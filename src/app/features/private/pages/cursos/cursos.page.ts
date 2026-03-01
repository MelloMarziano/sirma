import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  CursoItem,
  CursosService,
} from 'src/app/core/services/cursos/cursos.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cursos',
  templateUrl: './cursos.page.html',
  styleUrls: ['./cursos.page.scss'],
})
export class CursosPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  searchTerm = '';
  loadingCourses = true;
  savingCourse = false;
  isCreateModalOpen = false;
  selectedCourse: CursoItem | null = null;
  editingCourseId: string | null = null;

  readonly categoryOptions = ['General', 'Tecnica', 'Liderazgo', 'Operacion'];
  courses: CursoItem[] = [];

  readonly createForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    category: ['General', Validators.required],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly cursosService: CursosService
  ) {}

  ngOnInit(): void {
    this.cursosService
      .getCursos$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.courses = courses;
          this.loadingCourses = false;
        },
        error: (error) => {
          this.loadingCourses = false;
          console.error('Error cargando cursos en tiempo real', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredCourses(): CursoItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.courses;
    }

    return this.courses.filter((course) =>
      `${course.title} ${course.description} ${course.category}`
        .toLowerCase()
        .includes(term)
    );
  }

  get createModalTitle(): string {
    return this.editingCourseId ? 'Editar Curso' : 'Crear Curso';
  }

  get createSubmitLabel(): string {
    return this.editingCourseId ? 'Actualizar' : 'Guardar';
  }

  openCreateModal(): void {
    this.editingCourseId = null;
    this.isCreateModalOpen = true;
    this.createForm.reset({
      title: '',
      description: '',
      category: 'General',
    });
  }

  openEditModal(course: CursoItem): void {
    this.editingCourseId = course.id;
    this.isCreateModalOpen = true;
    this.createForm.reset({
      title: course.title,
      description: course.description,
      category: course.category,
    });
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.editingCourseId = null;
    this.createForm.reset({
      title: '',
      description: '',
      category: 'General',
    });
  }

  openDetails(course: CursoItem, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedCourse = course;
  }

  closeDetails(): void {
    this.selectedCourse = null;
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

    this.savingCourse = true;
    const values = this.createForm.getRawValue();
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
    };

    try {
      if (this.editingCourseId) {
        await this.cursosService.updateCurso(this.editingCourseId, payload);
      } else {
        await this.cursosService.createCurso(payload);
      }
      this.closeCreateModal();
    } catch (error) {
      console.error('Error guardando curso', error);
    } finally {
      this.savingCourse = false;
    }
  }

  async deleteCourse(course: CursoItem): Promise<void> {
    const confirmed = window.confirm(
      `¿Deseas eliminar el curso "${course.title}"? Esta accion no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await this.cursosService.deleteCurso(course.id);
      if (this.selectedCourse?.id === course.id) {
        this.closeDetails();
      }
    } catch (error) {
      console.error('Error eliminando curso', error);
    }
  }

  trackByCourse(index: number, course: CursoItem): string {
    return course.id ?? `${index}`;
  }

  getDisplayId(id: string): string {
    if (!id) {
      return '----';
    }
    return id.slice(0, 4).toUpperCase();
  }
}
