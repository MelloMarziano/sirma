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

export type InstructoresStatus = 'ACTIVO' | 'INACTIVO';

export interface InstructoresCourse {
  name: string;
  category: string;
}

export interface InstructoresAchievement {
  id: string;
  title: string;
  category: string;
  level: string;
  points: number;
}

export interface InstructoresItem {
  id: string;
  fullName: string;
  club: string;
  iglesia?: string;
  email?: string;
  phone?: string;
  zone: string;
  rank: string;
  status: InstructoresStatus;
  photoUrl: string;
  photoPublicId?: string;
  specialties: string[];
  completedCourses: InstructoresCourse[];
  achievements?: InstructoresAchievement[];
  disciplinaryStatus: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface InstructoresCreatePayload {
  fullName: string;
  club: string;
  iglesia?: string;
  email?: string;
  phone?: string;
  zone: string;
  rank: string;
  photoUrl: string;
  photoPublicId?: string;
  specialties: string[];
  completedCourses: InstructoresCourse[];
  achievements?: InstructoresAchievement[];
  status?: InstructoresStatus;
  disciplinaryStatus?: string;
}

export type InstructoresUpdatePayload = Partial<InstructoresCreatePayload> & {
  status?: InstructoresStatus;
  disciplinaryStatus?: string;
};

@Injectable({
  providedIn: 'root',
})
export class InstructoresService {
  private readonly instructoresCollection = collection(this.firestore, 'instructores');

  constructor(private readonly firestore: Firestore) {}

  getInstructores$(): Observable<InstructoresItem[]> {
    return collectionData(this.instructoresCollection, { idField: 'id' }).pipe(
      map((items) =>
        (items as InstructoresItem[]).sort((a, b) => {
          const dateA = a.updatedAt ?? a.createdAt ?? 0;
          const dateB = b.updatedAt ?? b.createdAt ?? 0;
          return dateB - dateA;
        })
      )
    );
  }

  async createInstructor(payload: InstructoresCreatePayload): Promise<void> {
    const now = Date.now();
    await addDoc(
      this.instructoresCollection,
      this.cleanUndefined({
        ...payload,
        status: payload.status ?? 'ACTIVO',
        disciplinaryStatus: payload.disciplinaryStatus ?? 'Historial limpio',
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  async updateInstructor(id: string, payload: InstructoresUpdatePayload): Promise<void> {
    const ref = doc(this.firestore, `instructores/${id}`);
    await updateDoc(
      ref,
      this.cleanUndefined({
        ...payload,
        updatedAt: Date.now(),
      })
    );
  }

  async deleteInstructor(id: string): Promise<void> {
    const ref = doc(this.firestore, `instructores/${id}`);
    await deleteDoc(ref);
  }

  private cleanUndefined<T extends Record<string, unknown>>(payload: T): T {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    ) as T;
  }
}
