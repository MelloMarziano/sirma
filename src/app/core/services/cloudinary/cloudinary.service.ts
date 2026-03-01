import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

interface CloudinaryDeleteRequest {
  publicId: string;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  constructor(private readonly http: HttpClient) {}

  async uploadImage(file: File, folder = 'sirma/dumc'): Promise<CloudinaryUploadResult> {
    const { cloudName, uploadPreset } = environment.cloudinary;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        'Cloudinary no esta configurado. Falta cloudName o uploadPreset (unsigned).'
      );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const response = await firstValueFrom(
      this.http.post<CloudinaryUploadResponse>(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      )
    );

    return {
      url: response.secure_url,
      publicId: response.public_id,
    };
  }

  async deleteImageByPublicId(publicId: string): Promise<void> {
    const deleteEndpoint = (environment.cloudinary as { deleteEndpoint?: string }).deleteEndpoint;

    if (!publicId) {
      return;
    }

    if (!deleteEndpoint) {
      throw new Error(
        'Falta endpoint seguro para eliminar en Cloudinary. Crea un backend/Cloud Function firmada y configura cloudinary.deleteEndpoint.'
      );
    }

    await firstValueFrom(
      this.http.post(deleteEndpoint, {
        publicId,
      } as CloudinaryDeleteRequest)
    );
  }
}
