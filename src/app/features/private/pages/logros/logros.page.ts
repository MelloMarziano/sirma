import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/core/services/alert.service';
import { LogroItem, LogrosService } from 'src/app/core/services/logros/logros.service';

@Component({
  selector: 'app-logros',
  templateUrl: './logros.page.html',
  styleUrls: ['./logros.page.scss'],
})
export class LogrosPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  searchTerm = '';
  loadingLogros = true;
  savingLogro = false;
  isCreateModalOpen = false;
  selectedLogro: LogroItem | null = null;
  editingLogroId: string | null = null;

  readonly categoryOptions = ['General', 'Servicio', 'Liderazgo', 'Tecnico', 'Disciplina'];
  readonly levelOptions = ['Bronce', 'Plata', 'Oro', 'Platino'];
  logros: LogroItem[] = [];

  readonly createForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    category: ['General', Validators.required],
    level: ['Bronce', Validators.required],
    points: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
    isActive: [true, Validators.required],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly logrosService: LogrosService,
    private readonly alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.logrosService
      .getLogros$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logros) => {
          this.logros = logros;
          if (this.selectedLogro) {
            this.selectedLogro = logros.find((item) => item.id === this.selectedLogro?.id) ?? null;
          }
          this.loadingLogros = false;
        },
        error: (error) => {
          this.loadingLogros = false;
          console.error('Error cargando logros', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredLogros(): LogroItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.logros;
    }

    return this.logros.filter((logro) =>
      `${logro.title} ${logro.description} ${logro.category} ${logro.level}`
        .toLowerCase()
        .includes(term)
    );
  }

  get createModalTitle(): string {
    return this.editingLogroId ? 'Editar Logro' : 'Crear Logro';
  }

  get createSubmitLabel(): string {
    if (this.savingLogro) {
      return this.editingLogroId ? 'Actualizando...' : 'Guardando...';
    }
    return this.editingLogroId ? 'Actualizar' : 'Guardar';
  }

  openCreateModal(): void {
    this.editingLogroId = null;
    this.isCreateModalOpen = true;
    this.createForm.reset({
      title: '',
      description: '',
      category: 'General',
      level: 'Bronce',
      points: 10,
      isActive: true,
    });
  }

  openEditModal(logro: LogroItem): void {
    this.editingLogroId = logro.id;
    this.isCreateModalOpen = true;
    this.createForm.reset({
      title: logro.title,
      description: logro.description,
      category: logro.category,
      level: logro.level,
      points: logro.points,
      isActive: logro.isActive,
    });
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.editingLogroId = null;
    this.createForm.reset({
      title: '',
      description: '',
      category: 'General',
      level: 'Bronce',
      points: 10,
      isActive: true,
    });
  }

  openDetails(logro: LogroItem, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedLogro = logro;
  }

  closeDetails(): void {
    this.selectedLogro = null;
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

    this.savingLogro = true;
    const values = this.createForm.getRawValue();
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      level: values.level,
      points: Number(values.points),
      isActive: values.isActive,
    };

    try {
      this.alertService.showLoading(this.editingLogroId ? 'Actualizando logro...' : 'Guardando logro...');
      if (this.editingLogroId) {
        await this.logrosService.updateLogro(this.editingLogroId, payload);
      } else {
        await this.logrosService.createLogro(payload);
      }
      this.alertService.close();
      this.alertService.successAlert(
        this.editingLogroId ? 'Logro actualizado' : 'Logro creado',
        this.editingLogroId ? 'El logro fue actualizado correctamente.' : 'El logro fue creado.'
      );
      this.closeCreateModal();
    } catch (error) {
      this.alertService.close();
      this.alertService.error('No se pudo guardar el logro.');
      console.error('Error guardando logro', error);
    } finally {
      this.savingLogro = false;
    }
  }

  async requestDeleteLogro(logro: LogroItem): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Eliminar logro',
      `¿Deseas eliminar el logro "${logro.title}"? Esta accion no se puede deshacer.`,
      'Sí, eliminar'
    );
    if (!confirmed) {
      return;
    }

    try {
      this.alertService.showLoading('Eliminando logro...');
      await this.logrosService.deleteLogro(logro.id);
      this.alertService.close();
      this.alertService.successAlert('Logro eliminado', 'El logro fue eliminado.');
      if (this.selectedLogro?.id === logro.id) {
        this.closeDetails();
      }
    } catch (error) {
      this.alertService.close();
      this.alertService.error('No se pudo eliminar el logro.');
      console.error('Error eliminando logro', error);
    }
  }

  trackByLogro(index: number, logro: LogroItem): string {
    return logro.id ?? `${index}`;
  }

  getLevelClass(level: string): string {
    return level.toLowerCase().replace(/\s+/g, '-');
  }
}
