import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export type UsuarioRol = 'Administrador' | 'Director General' | 'Coordinador' | 'Consulta';

export interface UsuarioItem {
  id: string; // same as Firebase Auth uid
  uid: string;
  fullName: string;
  email: string;
  role: UsuarioRol;
  isActive: boolean;
  providerId: 'password';
  createdAt?: number;
  updatedAt?: number;
  createdByUid?: string;
}

export interface UsuarioCreatePayload {
  uid: string;
  fullName: string;
  email: string;
  role: UsuarioRol;
  isActive?: boolean;
  createdByUid?: string;
}

export type UsuarioUpdatePayload = Partial<Pick<UsuarioItem, 'fullName' | 'role' | 'isActive'>>;

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly usuariosCollection = collection(this.firestore, 'usuarios');

  constructor(private readonly firestore: Firestore) {}

  getUsuarios$(): Observable<UsuarioItem[]> {
    return collectionData(this.usuariosCollection, { idField: 'id' }).pipe(
      map((items) =>
        (items as UsuarioItem[]).sort((a, b) => {
          const dateA = a.updatedAt ?? a.createdAt ?? 0;
          const dateB = b.updatedAt ?? b.createdAt ?? 0;
          return dateB - dateA;
        })
      )
    );
  }

  async createUsuario(payload: UsuarioCreatePayload): Promise<void> {
    const now = Date.now();
    const ref = doc(this.firestore, `usuarios/${payload.uid}`);
    await setDoc(
      ref,
      this.cleanUndefined({
        uid: payload.uid,
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role,
        isActive: payload.isActive ?? true,
        providerId: 'password',
        createdByUid: payload.createdByUid,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  async updateUsuario(uid: string, payload: UsuarioUpdatePayload): Promise<void> {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    await updateDoc(
      ref,
      this.cleanUndefined({
        ...payload,
        updatedAt: Date.now(),
      })
    );
  }

  async deleteUsuario(uid: string): Promise<void> {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    await deleteDoc(ref);
  }

  async getUsuarioByUid(uid: string): Promise<UsuarioItem | null> {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<UsuarioItem, 'id'>),
    };
  }

  private cleanUndefined<T extends Record<string, unknown>>(payload: T): T {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    ) as T;
  }
}
