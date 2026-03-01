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

export interface LogroItem {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  level: string;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface LogroUpsertPayload {
  title: string;
  description: string;
  category: string;
  points: number;
  level: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LogrosService {
  private readonly logrosCollection = collection(this.firestore, 'logros');

  constructor(private readonly firestore: Firestore) {}

  getLogros$(): Observable<LogroItem[]> {
    return collectionData(this.logrosCollection, { idField: 'id' }).pipe(
      map((items) =>
        (items as LogroItem[]).sort((a, b) => {
          const dateA = a.updatedAt ?? a.createdAt ?? 0;
          const dateB = b.updatedAt ?? b.createdAt ?? 0;
          return dateB - dateA;
        })
      )
    );
  }

  async createLogro(payload: LogroUpsertPayload): Promise<void> {
    await addDoc(this.logrosCollection, {
      ...payload,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async updateLogro(id: string, payload: LogroUpsertPayload): Promise<void> {
    const ref = doc(this.firestore, `logros/${id}`);
    await updateDoc(ref, {
      ...payload,
      updatedAt: Date.now(),
    });
  }

  async deleteLogro(id: string): Promise<void> {
    const ref = doc(this.firestore, `logros/${id}`);
    await deleteDoc(ref);
  }
}
