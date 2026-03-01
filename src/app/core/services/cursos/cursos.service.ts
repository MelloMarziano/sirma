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

export interface CursoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface CursoUpsertPayload {
  title: string;
  description: string;
  category: string;
}

@Injectable({
  providedIn: 'root',
})
export class CursosService {
  private readonly cursosCollection = collection(this.firestore, 'cursos');

  constructor(private readonly firestore: Firestore) {}

  getCursos$(): Observable<CursoItem[]> {
    return collectionData(this.cursosCollection, { idField: 'id' }).pipe(
      map((items) =>
        (items as CursoItem[]).sort((a, b) => {
          const dateA = a.updatedAt ?? a.createdAt ?? 0;
          const dateB = b.updatedAt ?? b.createdAt ?? 0;
          return dateB - dateA;
        })
      )
    );
  }

  async createCurso(payload: CursoUpsertPayload): Promise<void> {
    await addDoc(this.cursosCollection, {
      ...payload,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async updateCurso(id: string, payload: CursoUpsertPayload): Promise<void> {
    const courseRef = doc(this.firestore, `cursos/${id}`);
    await updateDoc(courseRef, {
      ...payload,
      updatedAt: Date.now(),
    });
  }

  async deleteCurso(id: string): Promise<void> {
    const courseRef = doc(this.firestore, `cursos/${id}`);
    await deleteDoc(courseRef);
  }
}
