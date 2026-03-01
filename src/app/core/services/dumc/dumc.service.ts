import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export type DumcStatus = 'ACTIVO' | 'INACTIVO';

export interface DumcCourse {
  name: string;
  category: string;
}

export interface DumcItem {
  id: string;
  fullName: string;
  club: string;
  zone: string;
  rank: string;
  status: DumcStatus;
  photoUrl: string;
  photoPublicId?: string;
  specialties: string[];
  completedCourses: DumcCourse[];
  disciplinaryStatus: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface DumcCreatePayload {
  fullName: string;
  club: string;
  zone: string;
  rank: string;
  photoUrl: string;
  photoPublicId?: string;
  specialties: string[];
  completedCourses: DumcCourse[];
  status?: DumcStatus;
  disciplinaryStatus?: string;
}

export type DumcUpdatePayload = Partial<DumcCreatePayload> & {
  status?: DumcStatus;
  disciplinaryStatus?: string;
};

@Injectable({
  providedIn: 'root',
})
export class DumcService {
  private readonly dumcCollection = collection(this.firestore, 'dumc');

  constructor(private readonly firestore: Firestore) {}

  getDumc$(): Observable<DumcItem[]> {
    return collectionData(this.dumcCollection, { idField: 'id' }).pipe(
      map((items) =>
        (items as DumcItem[]).sort((a, b) => {
          const dateA = a.updatedAt ?? a.createdAt ?? 0;
          const dateB = b.updatedAt ?? b.createdAt ?? 0;
          return dateB - dateA;
        })
      )
    );
  }

  async createDumc(payload: DumcCreatePayload): Promise<void> {
    const now = Date.now();
    await addDoc(
      this.dumcCollection,
      this.cleanUndefined({
      ...payload,
      status: payload.status ?? 'ACTIVO',
      disciplinaryStatus: payload.disciplinaryStatus ?? 'Historial limpio',
      createdAt: now,
      updatedAt: now,
      })
    );
  }

  async updateDumc(id: string, payload: DumcUpdatePayload): Promise<void> {
    const ref = doc(this.firestore, `dumc/${id}`);
    await updateDoc(
      ref,
      this.cleanUndefined({
        ...payload,
        updatedAt: Date.now(),
      })
    );
  }

  async deleteDumc(id: string): Promise<void> {
    const ref = doc(this.firestore, `dumc/${id}`);
    await deleteDoc(ref);
  }

  private cleanUndefined<T extends Record<string, unknown>>(payload: T): T {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    ) as T;
  }
}
