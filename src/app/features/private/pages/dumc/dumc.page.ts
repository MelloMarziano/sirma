import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/core/services/alert.service';
import { CloudinaryService } from 'src/app/core/services/cloudinary/cloudinary.service';
import { CursoItem, CursosService } from 'src/app/core/services/cursos/cursos.service';
import { DumcCourse, DumcItem, DumcService } from 'src/app/core/services/dumc/dumc.service';

@Component({
  selector: 'app-dumc',
  templateUrl: './dumc.page.html',
  styleUrls: ['./dumc.page.scss'],
})
export class DumcPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly tempObjectUrls: string[] = [];
  private selectedPhotoFile: File | null = null;

  searchTerm = '';
  selectedRankFilter = 'ALL';
  selectedOrderBy: 'RANK' | 'ZONE' = 'RANK';
  isRegisterModalOpen = false;
  isAddCourseModalOpen = false;
  loadingRecords = true;
  loadingCursos = true;
  savingDumc = false;
  selectedInstructor: DumcItem | null = null;
  editingDumcId: string | null = null;
  editingCurrentPhotoUrl = '';
  editingCurrentPhotoPublicId = '';
  selectedPhotoPreview = '';
  selectedPhotoName = '';
  uploadError = '';

  readonly rankOptions = [
    'Amigos',
    'Compañeros',
    'Explorador',
    'Orientador',
    'Viajero',
    'Guia',
    'Guia Mayor',
  ];
  readonly zoneOptions = Array.from({ length: 11 }, (_, index) => `Zona ${index + 1}`);

  instructors: DumcItem[] = [];
  availableCourses: CursoItem[] = [];

  readonly registerForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    club: ['', Validators.required],
    zone: ['Zona 1', Validators.required],
    rank: ['Guia Mayor', Validators.required],
    specialties: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly dumcService: DumcService,
    private readonly cursosService: CursosService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.dumcService
      .getDumc$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.instructors = items;
          if (this.selectedInstructor) {
            const refreshed = items.find((item) => item.id === this.selectedInstructor?.id);
            this.selectedInstructor = refreshed ?? null;
          }
          this.loadingRecords = false;
        },
        error: (error) => {
          this.loadingRecords = false;
          console.error('Error cargando DUMC', error);
        },
      });

    this.cursosService
      .getCursos$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.availableCourses = courses;
          this.loadingCursos = false;
        },
        error: (error) => {
          this.loadingCursos = false;
          console.error('Error cargando cursos para especialidades DUMC', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.cleanupObjectUrls();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredInstructors(): DumcItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.instructors.filter((instructor) => {
      const matchesTerm =
        !term || `${instructor.fullName} ${instructor.club}`.toLowerCase().includes(term);

      const matchesRank =
        this.selectedRankFilter === 'ALL' || (instructor.rank ?? '') === this.selectedRankFilter;

      return matchesTerm && matchesRank;
    });

    return this.sortDumcList(filtered);
  }

  get rankFilterOptions(): string[] {
    const ranks = Array.from(
      new Set(this.instructors.map((instructor) => instructor.rank?.trim()).filter(Boolean))
    ) as string[];

    return ranks.sort((a, b) => {
      const orderDiff = this.getRankPriority(a) - this.getRankPriority(b);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return a.localeCompare(b);
    });
  }

  get selectedSpecialties(): string[] {
    return this.registerForm.controls.specialties.value;
  }

  get registerModalTitle(): string {
    return this.editingDumcId ? 'Editar DUMC' : 'Registrar DUMC';
  }

  get registerSubmitLabel(): string {
    if (this.savingDumc) {
      return this.editingDumcId ? 'Actualizando...' : 'Guardando...';
    }
    return this.editingDumcId ? 'Actualizar' : 'Guardar';
  }

  get addableCoursesForSelectedInstructor(): CursoItem[] {
    if (!this.selectedInstructor) {
      return [];
    }

    const existingNames = new Set(this.selectedInstructor.completedCourses.map((course) => course.name));
    return this.availableCourses.filter((course) => !existingNames.has(course.title));
  }

  openRegisterModal(): void {
    this.editingDumcId = null;
    this.editingCurrentPhotoUrl = '';
    this.isRegisterModalOpen = true;
    this.uploadError = '';
  }

  async requestEditDumc(instructor: DumcItem): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Editar registro',
      `¿Deseas editar el registro DUMC de ${instructor.fullName}?`,
      'Sí, editar'
    );
    if (!confirmed) {
      return;
    }
    this.alertService.close();
    await this.delay(120);
    this.closeInstructorDetail();
    this.openEditModal(instructor);
  }

  private openEditModal(instructor: DumcItem): void {
    this.editingDumcId = instructor.id;
    this.editingCurrentPhotoUrl = instructor.photoUrl;
    this.editingCurrentPhotoPublicId = instructor.photoPublicId ?? '';
    this.isRegisterModalOpen = true;
    this.uploadError = '';
    this.selectedPhotoFile = null;
    this.selectedPhotoName = '';
    this.selectedPhotoPreview = instructor.photoUrl || '';

    this.registerForm.reset({
      fullName: instructor.fullName,
      club: instructor.club,
      zone: instructor.zone,
      rank: instructor.rank,
      specialties: [...instructor.specialties],
    });
  }

  closeRegisterModal(revokeUpload = true): void {
    this.isRegisterModalOpen = false;
    this.uploadError = '';
    this.editingDumcId = null;
    this.editingCurrentPhotoUrl = '';
    this.editingCurrentPhotoPublicId = '';
    this.resetFormState(revokeUpload);
  }

  openInstructorDetail(instructor: DumcItem): void {
    this.selectedInstructor = instructor;
  }

  closeInstructorDetail(): void {
    this.selectedInstructor = null;
    this.closeAddCourseModal();
  }

  onModalBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('register-modal-overlay')) {
      this.closeRegisterModal();
    }
  }

  onDetailBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('detail-modal-overlay')) {
      this.closeInstructorDetail();
    }
  }

  onAddCourseBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('dumc-add-course-overlay')) {
      this.closeAddCourseModal();
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploadError = '';
    this.selectedPhotoFile = file;

    if (this.selectedPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.selectedPhotoPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    this.tempObjectUrls.push(objectUrl);
    this.selectedPhotoPreview = objectUrl;
    this.selectedPhotoName = file.name;
  }

  toggleSpecialty(courseTitle: string, checked: boolean): void {
    const current = [...this.selectedSpecialties];
    const next = checked
      ? Array.from(new Set([...current, courseTitle]))
      : current.filter((item) => item !== courseTitle);

    this.registerForm.controls.specialties.setValue(next);
    this.registerForm.controls.specialties.markAsTouched();
  }

  isSpecialtySelected(courseTitle: string): boolean {
    return this.selectedSpecialties.includes(courseTitle);
  }

  async onRegisterSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.savingDumc = true;
    this.uploadError = '';

    try {
      const values = this.registerForm.getRawValue();
      this.alertService.showLoading(
        this.editingDumcId ? 'Actualizando registro DUMC...' : 'Guardando registro DUMC...'
      );

      let photoUrl = this.editingCurrentPhotoUrl || this.createAvatarUrl(values.fullName);
      let photoPublicId: string | undefined = this.editingCurrentPhotoPublicId || undefined;

      if (this.selectedPhotoFile) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          this.selectedPhotoFile,
          'sirma/dumc'
        );
        photoUrl = uploadResult.url;
        photoPublicId = uploadResult.publicId;

        if (this.editingDumcId && this.editingCurrentPhotoPublicId) {
          try {
            await this.cloudinaryService.deleteImageByPublicId(this.editingCurrentPhotoPublicId);
          } catch (cleanupError) {
            console.warn('No se pudo eliminar imagen anterior en Cloudinary', cleanupError);
          }
        }
      }

      const completedCourses: DumcCourse[] = values.specialties.map((name) => {
        const match = this.availableCourses.find((course) => course.title === name);
        return {
          name,
          category: match?.category ?? 'Curso',
        };
      });

      if (this.editingDumcId) {
        await this.dumcService.updateDumc(this.editingDumcId, {
          fullName: values.fullName.trim(),
          club: values.club.trim(),
          zone: values.zone,
          rank: values.rank,
          photoUrl,
          photoPublicId,
          specialties: values.specialties,
          completedCourses,
        });
      } else {
        await this.dumcService.createDumc({
          fullName: values.fullName.trim(),
          club: values.club.trim(),
          zone: values.zone,
          rank: values.rank,
          photoUrl,
          photoPublicId,
          specialties: values.specialties,
          completedCourses,
          status: 'ACTIVO',
          disciplinaryStatus: 'Historial limpio',
        });
      }

      this.alertService.close();
      this.alertService.successAlert(
        'Registro guardado',
        this.editingDumcId ? 'El registro DUMC fue actualizado.' : 'El registro DUMC fue creado.'
      );
      this.closeRegisterModal();
    } catch (error) {
      this.alertService.close();
      this.uploadError =
        error instanceof Error ? error.message : 'Ocurrio un error guardando el registro DUMC.';
      this.alertService.error(this.uploadError);
      console.error('Error guardando DUMC', error);
    } finally {
      this.savingDumc = false;
    }
  }

  trackByInstructor(index: number, instructor: DumcItem): string {
    return instructor.id ?? `${index}`;
  }

  trackByCourse(index: number, course: CursoItem): string {
    return course.id ?? `${index}`;
  }

  getRankChipClass(rank: string | null | undefined): string {
    const normalizedRank = this.normalizeRank(rank);

    if (normalizedRank.includes('amigo')) {
      return 'rank-chip--blue';
    }
    if (normalizedRank.includes('compan')) {
      return 'rank-chip--red';
    }
    if (normalizedRank.includes('explor')) {
      return 'rank-chip--green';
    }
    if (normalizedRank.includes('orient')) {
      return 'rank-chip--gray';
    }
    if (normalizedRank.includes('viajer')) {
      return 'rank-chip--violet';
    }
    if (
      normalizedRank.includes('guia') ||
      normalizedRank.includes('gia')
    ) {
      return 'rank-chip--yellow';
    }
    return 'rank-chip--neutral';
  }

  openAddCourseModal(): void {
    if (!this.selectedInstructor) {
      return;
    }
    this.isAddCourseModalOpen = true;
  }

  closeAddCourseModal(): void {
    this.isAddCourseModalOpen = false;
  }

  async addExistingCourseToSelected(course: CursoItem): Promise<void> {
    if (!this.selectedInstructor) {
      return;
    }

    const current = this.instructors.find((item) => item.id === this.selectedInstructor?.id);
    if (!current) {
      return;
    }

    const alreadyExists = current.completedCourses.some((item) => item.name === course.title);
    if (alreadyExists) {
      return;
    }

    const nextCompletedCourses: DumcCourse[] = [
      ...current.completedCourses,
      { name: course.title, category: course.category },
    ];
    const nextSpecialties = Array.from(new Set([...current.specialties, course.title]));

    try {
      this.alertService.showLoading('Agregando curso...');
      await this.dumcService.updateDumc(current.id, {
        completedCourses: nextCompletedCourses,
        specialties: nextSpecialties,
      });
      this.alertService.close();
      this.alertService.success('Curso agregado al registro DUMC');
      this.closeAddCourseModal();
    } catch (error) {
      this.alertService.close();
      this.alertService.error('No se pudo agregar el curso.');
      console.error('Error agregando curso a DUMC', error);
    }
  }

  async toggleAuthorizationStatus(instructor: DumcItem): Promise<void> {
    const nextStatus = instructor.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const confirmed = await this.alertService.confirm(
      nextStatus === 'INACTIVO' ? 'Revocar permiso' : 'Activar permiso',
      nextStatus === 'INACTIVO'
        ? `¿Deseas revocar el permiso de ${instructor.fullName}?`
        : `¿Deseas activar nuevamente a ${instructor.fullName}?`,
      nextStatus === 'INACTIVO' ? 'Sí, revocar' : 'Sí, activar'
    );
    if (!confirmed) {
      return;
    }

    try {
      this.alertService.showLoading('Actualizando estado...');
      await this.dumcService.updateDumc(instructor.id, { status: nextStatus });
      this.alertService.close();
      this.alertService.success(
        nextStatus === 'INACTIVO' ? 'Permiso revocado correctamente' : 'Permiso activado correctamente'
      );
    } catch (error) {
      this.alertService.close();
      this.alertService.error('No se pudo actualizar el estado.');
      console.error('Error actualizando estado DUMC', error);
    }
  }

  async deleteSelectedDumc(instructor: DumcItem): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Eliminar registro DUMC',
      `¿Deseas eliminar el registro DUMC de "${instructor.fullName}"? Esta accion no se puede deshacer.`,
      'Sí, eliminar'
    );
    if (!confirmed) {
      return;
    }

    try {
      this.alertService.showLoading('Eliminando registro DUMC...');
      if (instructor.photoPublicId) {
        await this.cloudinaryService.deleteImageByPublicId(instructor.photoPublicId);
      }
      await this.dumcService.deleteDumc(instructor.id);
      this.alertService.close();
      this.alertService.successAlert('Registro eliminado', 'El registro DUMC fue eliminado.');
      this.closeInstructorDetail();
    } catch (error) {
      this.alertService.close();
      this.alertService.error(
        error instanceof Error ? error.message : 'No se pudo eliminar el registro DUMC.'
      );
      console.error('Error eliminando registro DUMC', error);
    }
  }

  private createAvatarUrl(name: string): string {
    const safeName = name.trim() || 'DUMC';
    return `https://ui-avatars.com/api/?background=1f3f9f&color=ffffff&name=${encodeURIComponent(
      safeName
    )}`;
  }

  private cleanupObjectUrls(): void {
    const uniqueUrls = new Set(this.tempObjectUrls);
    uniqueUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private compareZones(a: string, b: string): number {
    const aNum = this.extractZoneNumber(a);
    const bNum = this.extractZoneNumber(b);

    if (aNum !== null && bNum !== null) {
      return aNum - bNum;
    }
    if (aNum !== null) {
      return -1;
    }
    if (bNum !== null) {
      return 1;
    }
    return a.localeCompare(b);
  }

  private extractZoneNumber(zone: string): number | null {
    const match = zone.match(/zona\s+(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  private sortDumcList(items: DumcItem[]): DumcItem[] {
    const sorted = [...items];
    if (this.selectedOrderBy === 'ZONE') {
      return sorted.sort((a, b) => {
        const zoneDiff = this.compareZones(a.zone ?? '', b.zone ?? '');
        if (zoneDiff !== 0) {
          return zoneDiff;
        }

        const rankDiff = this.getRankPriority(a.rank ?? '') - this.getRankPriority(b.rank ?? '');
        if (rankDiff !== 0) {
          return rankDiff;
        }

        return this.compareNames(a.fullName, b.fullName);
      });
    }

    return sorted.sort((a, b) => {
      const rankDiff = this.getRankPriority(a.rank ?? '') - this.getRankPriority(b.rank ?? '');
      if (rankDiff !== 0) {
        return rankDiff;
      }

      const zoneDiff = this.compareZones(a.zone ?? '', b.zone ?? '');
      if (zoneDiff !== 0) {
        return zoneDiff;
      }

      return this.compareNames(a.fullName, b.fullName);
    });
  }

  private getRankPriority(rank: string): number {
    const normalizedRank = this.normalizeRank(rank);

    if (normalizedRank.includes('amigo')) {
      return 1;
    }
    if (normalizedRank.includes('compan')) {
      return 2;
    }
    if (normalizedRank.includes('explor')) {
      return 3;
    }
    if (normalizedRank.includes('orient')) {
      return 4;
    }
    if (normalizedRank.includes('viajer')) {
      return 5;
    }
    if (
      normalizedRank.includes('guia') ||
      normalizedRank.includes('gia')
    ) {
      return 6;
    }
    return 99;
  }

  private normalizeRank(rank: string | null | undefined): string {
    return (rank ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private compareNames(a: string, b: string): number {
    return (a ?? '').localeCompare(b ?? '', 'es', { sensitivity: 'base' });
  }

  private resetFormState(revokeUpload: boolean): void {
    if (revokeUpload && this.selectedPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.selectedPhotoPreview);
    }

    this.registerForm.reset({
      fullName: '',
      club: '',
      zone: 'Zona 1',
      rank: 'Guia Mayor',
      specialties: [],
    });

    this.registerForm.controls.specialties.setValue([]);
    this.selectedPhotoFile = null;
    this.selectedPhotoPreview = '';
    this.selectedPhotoName = '';
  }
}
