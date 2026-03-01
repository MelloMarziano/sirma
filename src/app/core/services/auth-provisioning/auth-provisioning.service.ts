import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';

export interface ProvisionedAuthUser {
  uid: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthProvisioningService {
  async createEmailPasswordUser(email: string, password: string): Promise<ProvisionedAuthUser> {
    const appName = `sirma-admin-provision-${Date.now()}`;
    const secondaryApp = initializeApp(environment.firebase, appName);

    try {
      const secondaryAuth = getAuth(secondaryApp);
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email.trim().toLowerCase(),
        password
      );

      // Prevent switching the admin session on the main app auth instance.
      await signOut(secondaryAuth);

      return {
        uid: credential.user.uid,
        email: credential.user.email ?? email.trim().toLowerCase(),
      };
    } finally {
      await deleteApp(secondaryApp).catch(() => undefined);
    }
  }
}
