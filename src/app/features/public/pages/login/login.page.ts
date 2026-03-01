import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/private']);
    }
  }

  buildForm() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading) return;

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/private']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error', err);
        alert(this.getFirebaseLoginError(err));
      },
    });
  }

  private getFirebaseLoginError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';

    switch (code) {
      case 'auth/invalid-email':
        return 'El correo no tiene un formato valido.';
      case 'auth/user-disabled':
        return 'Este usuario fue deshabilitado.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Correo o contrasena incorrectos.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta de nuevo en unos minutos.';
      case 'auth/network-request-failed':
        return 'Error de red. Verifica tu conexion e intenta nuevamente.';
      default:
        return 'Error al iniciar sesion. Verifique sus credenciales.';
    }
  }
}
