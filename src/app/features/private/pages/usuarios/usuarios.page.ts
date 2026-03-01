import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/core/services/alert.service';
import { AuthProvisioningService } from 'src/app/core/services/auth-provisioning/auth-provisioning.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import {
  UsuarioItem,
  UsuarioRol,
  UsuariosService,
} from 'src/app/core/services/usuarios/usuarios.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  searchTerm = '';
  loadingUsers = true;
  savingUser = false;
  isCreateModalOpen = false;
  selectedUser: UsuarioItem | null = null;
  editingUserId: string | null = null;
  currentSessionUid = '';
  formError = '';

  readonly roleOptions: UsuarioRol[] = [
    'Administrador',
    'Director General',
    'Coordinador',
    'Consulta',
  ];
  users: UsuarioItem[] = [];

  readonly createForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    role: ['Consulta' as UsuarioRol, Validators.required],
    isActive: [true, Validators.required],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly usuariosService: UsuariosService,
    private readonly authProvisioningService: AuthProvisioningService,
    private readonly alertService: AlertService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentSessionUid = this.authService.getUserSession()?.uid ?? '';

    this.usuariosService
      .getUsuarios$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          if (this.selectedUser) {
            this.selectedUser = users.find((item) => item.id === this.selectedUser?.id) ?? null;
          }
          this.loadingUsers = false;
        },
        error: (error) => {
          this.loadingUsers = false;
          console.error('Error cargando usuarios', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredUsers(): UsuarioItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.users;
    }

    return this.users.filter((user) =>
      `${user.fullName} ${user.email} ${user.role}`.toLowerCase().includes(term)
    );
  }

  get createModalTitle(): string {
    return this.editingUserId ? 'Editar Usuario' : 'Crear Usuario';
  }

  get createSubmitLabel(): string {
    if (this.savingUser) {
      return this.editingUserId ? 'Actualizando...' : 'Creando...';
    }
    return this.editingUserId ? 'Actualizar' : 'Crear Usuario';
  }

  get isEditing(): boolean {
    return !!this.editingUserId;
  }

  openCreateModal(): void {
    this.editingUserId = null;
    this.formError = '';
    this.isCreateModalOpen = true;
    this.createForm.reset({
      fullName: '',
      email: '',
      password: '',
      role: 'Consulta',
      isActive: true,
    });
    this.createForm.controls.email.enable();
    this.createForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.createForm.controls.password.updateValueAndValidity();
  }

  openEditModal(user: UsuarioItem): void {
    this.editingUserId = user.id;
    this.formError = '';
    this.isCreateModalOpen = true;
    this.createForm.reset({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
    });
    this.createForm.controls.email.disable();
    this.createForm.controls.password.clearValidators();
    this.createForm.controls.password.updateValueAndValidity();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.editingUserId = null;
    this.formError = '';
    this.createForm.controls.email.enable();
    this.createForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.createForm.controls.password.updateValueAndValidity();
    this.createForm.reset({
      fullName: '',
      email: '',
      password: '',
      role: 'Consulta',
      isActive: true,
    });
  }

  openDetails(user: UsuarioItem, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedUser = user;
  }

  closeDetails(): void {
    this.selectedUser = null;
  }

  onCreateBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('course-create-overlay')) {
      this.closeCreateModal();
    }
  }

  onDetailsBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('course-detail-overlay')) {
      this.closeDetails();
    }
  }

  async onCreateSubmit(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.savingUser = true;
    this.formError = '';

    const raw = this.createForm.getRawValue();
    const payload = {
      fullName: raw.fullName.trim(),
      email: raw.email.trim().toLowerCase(),
      role: raw.role,
      isActive: raw.isActive,
    };

    try {
      this.alertService.showLoading(this.isEditing ? 'Actualizando usuario...' : 'Creando usuario...');

      if (this.editingUserId) {
        await this.usuariosService.updateUsuario(this.editingUserId, {
          fullName: payload.fullName,
          role: payload.role,
          isActive: payload.isActive,
        });
      } else {
        const provisioned = await this.authProvisioningService.createEmailPasswordUser(
          payload.email,
          raw.password
        );

        await this.usuariosService.createUsuario({
          uid: provisioned.uid,
          email: provisioned.email,
          fullName: payload.fullName,
          role: payload.role,
          isActive: payload.isActive,
          createdByUid: this.currentSessionUid || undefined,
        });
      }

      this.alertService.close();
      this.alertService.successAlert(
        this.isEditing ? 'Usuario actualizado' : 'Usuario creado',
        this.isEditing
          ? 'Se actualizo el perfil del usuario en Firestore.'
          : 'Usuario creado en Firebase Auth y registrado en Firestore.'
      );
      this.closeCreateModal();
    } catch (error) {
      this.alertService.close();
      this.formError = this.mapError(error);
      this.alertService.error(this.formError);
      console.error('Error guardando usuario', error);
    } finally {
      this.savingUser = false;
    }
  }

  async requestEditUser(user: UsuarioItem): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Editar usuario',
      `¿Deseas editar el usuario ${user.fullName}?`,
      'Sí, editar'
    );
    if (!confirmed) {
      return;
    }

    this.alertService.close();
    this.closeDetails();
    await this.delay(120);
    this.openEditModal(user);
  }

  async deleteUser(user: UsuarioItem): Promise<void> {
    if (user.uid === this.currentSessionUid) {
      this.alertService.error('No puedes eliminar tu propio usuario desde esta sesion.');
      return;
    }

    const confirmed = await this.alertService.confirm(
      'Eliminar usuario',
      `¿Deseas eliminar el usuario "${user.fullName}"? Esta accion no se puede deshacer.`,
      'Sí, eliminar'
    );
    if (!confirmed) {
      return;
    }

    try {
      this.alertService.showLoading('Eliminando usuario...');
      await this.usuariosService.deleteUsuario(user.uid);
      this.alertService.close();
      this.alertService.successAlert('Usuario eliminado', 'Perfil eliminado en Firestore.');
      if (this.selectedUser?.id === user.id) {
        this.closeDetails();
      }
    } catch (error) {
      this.alertService.close();
      this.alertService.error('No se pudo eliminar el usuario.');
      console.error('Error eliminando usuario', error);
    }
  }

  trackByUser(index: number, user: UsuarioItem): string {
    return user.id ?? `${index}`;
  }

  getDisplayId(id: string): string {
    return id ? id.slice(0, 6).toUpperCase() : '------';
  }

  private mapError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';

    switch (code) {
      case 'auth/email-already-in-use':
        return 'El correo ya esta registrado en Firebase Authentication.';
      case 'auth/invalid-email':
        return 'El correo ingresado no es valido.';
      case 'auth/weak-password':
        return 'La contrasena es muy debil (minimo 6 caracteres).';
      default:
        return error instanceof Error ? error.message : 'Ocurrio un error guardando el usuario.';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
