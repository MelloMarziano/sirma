import { Injectable } from '@angular/core';
import { Auth, User, UserCredential, onAuthStateChanged, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { BehaviorSubject, Observable, ReplaySubject, from, map, of, take } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private authReadySubject = new ReplaySubject<void>(1);
  private authInitialized = false;
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private auth: Auth,
    private router: Router,
    private usuariosService: UsuariosService,
  ) {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        void this.saveSession(user);
      } else {
        localStorage.removeItem('user_session');
        this.isLoggedInSubject.next(false);
      }

      if (!this.authInitialized) {
        this.authInitialized = true;
        this.authReadySubject.next();
      }
    });
  }

  login(email: string, pass: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email.trim(), pass)).pipe(
      tap((credential) => {
        void this.saveSession(credential.user);
      }),
    );
  }

  logout() {
    signOut(this.auth).catch((error) => {
      console.error('Error cerrando sesion en Firebase Auth', error);
    });
    localStorage.removeItem('user_session');
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/public/sign-in']);
  }

  private async saveSession(user: User): Promise<void> {
    const profile = await this.usuariosService.getUsuarioByUid(user.uid).catch(() => null);
    const displayName =
      profile?.fullName?.trim() || user.displayName?.trim() || user.email?.split('@')[0] || 'Usuario';

    const safeSession = {
      _id: user.uid,
      uid: user.uid,
      name: displayName,
      memberName: displayName,
      email: user.email ?? '',
      role: profile?.role ?? 'Administrador',
      photoURL: user.photoURL ?? null,
      emailVerified: user.emailVerified,
      providerId: user.providerData?.[0]?.providerId ?? 'password',
      isActive: profile?.isActive ?? true,
    };

    localStorage.setItem('user_session', JSON.stringify(safeSession));
    this.isLoggedInSubject.next(true);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('user_session');
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser || this.hasToken();
  }

  isAuthenticatedForGuard$(): Observable<boolean> {
    if (this.authInitialized) {
      return of(this.isAuthenticated());
    }

    return this.authReadySubject.pipe(
      take(1),
      map(() => this.isAuthenticated())
    );
  }

  getUserSession(): any {
    const session = localStorage.getItem('user_session');
    return session ? JSON.parse(session) : null;
  }
}
