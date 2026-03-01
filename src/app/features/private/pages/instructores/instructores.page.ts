import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/core/services/alert.service';
import { CloudinaryService } from 'src/app/core/services/cloudinary/cloudinary.service';
import { CursoItem, CursosService } from 'src/app/core/services/cursos/cursos.service';
import { LogroItem, LogrosService } from 'src/app/core/services/logros/logros.service';
import {
  InstructoresAchievement,
  InstructoresCourse,
  InstructoresItem,
  InstructoresService,
} from 'src/app/core/services/instructores/instructores.service';

@Component({
  selector: 'app-instructores',
  templateUrl: './instructores.page.html',
  styleUrls: ['./instructores.page.scss'],
})
export class InstructoresPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly tempObjectUrls: string[] = [];
  private selectedPhotoFile: File | null = null;
  private readonly defaultPhotoUrl =
    'https://res.cloudinary.com/dktcgc5nw/image/upload/v1772278625/bbe302ed8d905165577c638e908cec76_frtgru.jpg';

  searchTerm = '';
  selectedZoneFilter = 'ALL';
  selectedRankFilter = 'ALL';
  selectedStatusFilter = 'ALL';
  selectedPhotoFilter: 'ALL' | 'WITH_PHOTO' | 'NO_PHOTO' = 'ALL';
  selectedOrderBy: 'RANK' | 'ZONE' = 'RANK';
  showMobileFilters = false;
  isRegisterModalOpen = false;
  isAddCourseModalOpen = false;
  isAddAchievementModalOpen = false;
  loadingRecords = true;
  loadingCursos = true;
  loadingLogros = true;
  savingInstructor = false;
  selectedInstructor: InstructoresItem | null = null;
  editingInstructorId: string | null = null;
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

  instructors: InstructoresItem[] = [];
  availableCourses: CursoItem[] = [];
  availableLogros: LogroItem[] = [];

  readonly registerForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [
      '',
      [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)],
    ],
    church: ['', Validators.required],
    zone: ['Zona 1', Validators.required],
    rank: ['Guia Mayor', Validators.required],
    specialties: this.formBuilder.nonNullable.control<string[]>([]),
    achievementIds: this.formBuilder.nonNullable.control<string[]>([]),
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly instructoresService: InstructoresService,
    private readonly cursosService: CursosService,
    private readonly logrosService: LogrosService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.instructoresService
      .getInstructores$()
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
          console.error('Error cargando instructores', error);
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
          console.error('Error cargando cursos para especialidades de instructores', error);
        },
      });

    this.logrosService
      .getLogros$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logros) => {
          this.availableLogros = logros.filter((item) => item.isActive);
          this.loadingLogros = false;
        },
        error: (error) => {
          this.loadingLogros = false;
          console.error('Error cargando logros para instructores', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.cleanupObjectUrls();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredInstructors(): InstructoresItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.instructors.filter((instructor) => {
      const matchesTerm =
        !term ||
        `${instructor.fullName} ${instructor.iglesia ?? instructor.club ?? ''} ${instructor.email ?? ''} ${instructor.phone ?? ''}`
          .toLowerCase()
          .includes(term);

      const matchesZone =
        this.selectedZoneFilter === 'ALL' || (instructor.zone ?? '') === this.selectedZoneFilter;

      const matchesRank =
        this.selectedRankFilter === 'ALL' || (instructor.rank ?? '') === this.selectedRankFilter;

      const matchesStatus =
        this.selectedStatusFilter === 'ALL' ||
        (instructor.status ?? '') === this.selectedStatusFilter;

      const hasCustomPhoto = this.hasCustomPhoto(instructor.photoUrl);
      const matchesPhoto =
        this.selectedPhotoFilter === 'ALL' ||
        (this.selectedPhotoFilter === 'WITH_PHOTO' && hasCustomPhoto) ||
        (this.selectedPhotoFilter === 'NO_PHOTO' && !hasCustomPhoto);

      return matchesTerm && matchesZone && matchesRank && matchesStatus && matchesPhoto;
    });

    return this.sortInstructorList(filtered);
  }

  get zoneFilterOptions(): string[] {
    const zones = Array.from(
      new Set(this.instructors.map((instructor) => instructor.zone?.trim()).filter(Boolean))
    ) as string[];

    return zones.sort((a, b) => this.compareZones(a, b));
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

  get statusFilterOptions(): string[] {
    const statuses = Array.from(
      new Set(this.instructors.map((instructor) => instructor.status?.trim()).filter(Boolean))
    ) as string[];

    const order = ['ACTIVO', 'INACTIVO'];
    return statuses.sort((a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex >= 0 && bIndex >= 0) {
        return aIndex - bIndex;
      }
      if (aIndex >= 0) {
        return -1;
      }
      if (bIndex >= 0) {
        return 1;
      }
      return a.localeCompare(b);
    });
  }

  get selectedSpecialties(): string[] {
    return this.registerForm.controls.specialties.value;
  }

  get selectedAchievementIds(): string[] {
    return this.registerForm.controls.achievementIds.value;
  }

  get registerModalTitle(): string {
    return this.editingInstructorId ? 'Editar Instructor' : 'Registrar Instructor';
  }

  get registerSubmitLabel(): string {
    if (this.savingInstructor) {
      return this.editingInstructorId ? 'Actualizando...' : 'Guardando...';
    }
    return this.editingInstructorId ? 'Actualizar' : 'Guardar';
  }

  get addableCoursesForSelectedInstructor(): CursoItem[] {
    if (!this.selectedInstructor) {
      return [];
    }

    const existingNames = new Set(this.selectedInstructor.completedCourses.map((course) => course.name));
    return this.availableCourses.filter((course) => !existingNames.has(course.title));
  }

  get addableLogrosForSelectedInstructor(): LogroItem[] {
    if (!this.selectedInstructor) {
      return [];
    }

    const existingIds = new Set((this.selectedInstructor.achievements ?? []).map((item) => item.id));
    return this.availableLogros.filter((logro) => !existingIds.has(logro.id));
  }

  openRegisterModal(): void {
    this.editingInstructorId = null;
    this.editingCurrentPhotoUrl = '';
    this.editingCurrentPhotoPublicId = '';
    this.isRegisterModalOpen = true;
    this.uploadError = '';
  }

  async requestEditInstructor(instructor: InstructoresItem): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Editar registro',
      `¿Deseas editar el registro de ${instructor.fullName}?`,
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

  private openEditModal(instructor: InstructoresItem): void {
    this.editingInstructorId = instructor.id;
    this.editingCurrentPhotoUrl = instructor.photoUrl;
    this.editingCurrentPhotoPublicId = instructor.photoPublicId ?? '';
    this.isRegisterModalOpen = true;
    this.uploadError = '';
    this.selectedPhotoFile = null;
    this.selectedPhotoName = '';
    this.selectedPhotoPreview = instructor.photoUrl || '';

    this.registerForm.reset({
      fullName: instructor.fullName,
      email: instructor.email ?? '',
      phone: instructor.phone ?? '',
      church: instructor.iglesia ?? instructor.club ?? '',
      zone: instructor.zone,
      rank: instructor.rank,
      specialties: [...instructor.specialties],
      achievementIds: (instructor.achievements ?? []).map((item) => item.id),
    });
  }

  closeRegisterModal(revokeUpload = true): void {
    this.isRegisterModalOpen = false;
    this.uploadError = '';
    this.editingInstructorId = null;
    this.editingCurrentPhotoUrl = '';
    this.editingCurrentPhotoPublicId = '';
    this.resetFormState(revokeUpload);
  }

  openInstructorDetail(instructor: InstructoresItem): void {
    this.selectedInstructor = instructor;
  }

  closeInstructorDetail(): void {
    this.selectedInstructor = null;
    this.closeAddCourseModal();
    this.closeAddAchievementModal();
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

  onAddAchievementBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('dumc-add-course-overlay')) {
      this.closeAddAchievementModal();
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

  toggleAchievement(logroId: string, checked: boolean): void {
    const current = [...this.selectedAchievementIds];
    const next = checked
      ? Array.from(new Set([...current, logroId]))
      : current.filter((item) => item !== logroId);

    this.registerForm.controls.achievementIds.setValue(next);
    this.registerForm.controls.achievementIds.markAsTouched();
  }

  isAchievementSelected(logroId: string): boolean {
    return this.selectedAchievementIds.includes(logroId);
  }

  async onRegisterSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.alertService.error('Completa los campos obligatorios para guardar el instructor.');
      return;
    }

    this.savingInstructor = true;
    this.uploadError = '';

    try {
      const values = this.registerForm.getRawValue();
      const church = values.church.trim();
      this.alertService.showLoading(
        this.editingInstructorId ? 'Actualizando instructor...' : 'Guardando instructor...'
      );

      let photoUrl = this.editingCurrentPhotoUrl || this.createAvatarUrl(values.fullName);
      let photoPublicId: string | undefined = this.editingCurrentPhotoPublicId || undefined;

      if (this.selectedPhotoFile) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          this.selectedPhotoFile,
          'sirma/instructores'
        );
        photoUrl = uploadResult.url;
        photoPublicId = uploadResult.publicId;

        if (this.editingInstructorId && this.editingCurrentPhotoPublicId) {
          try {
            await this.cloudinaryService.deleteImageByPublicId(this.editingCurrentPhotoPublicId);
          } catch (cleanupError) {
            console.warn('No se pudo eliminar imagen anterior en Cloudinary', cleanupError);
          }
        }
      }

      const completedCourses: InstructoresCourse[] = values.specialties.map((name) => {
        const match = this.availableCourses.find((course) => course.title === name);
        return {
          name,
          category: match?.category ?? 'Curso',
        };
      });

      const achievements: InstructoresAchievement[] = values.achievementIds
        .map((id) => this.availableLogros.find((logro) => logro.id === id))
        .filter((item): item is LogroItem => !!item)
        .map((logro) => ({
          id: logro.id,
          title: logro.title,
          category: logro.category,
          level: logro.level,
          points: logro.points,
        }));

      if (this.editingInstructorId) {
        await this.instructoresService.updateInstructor(this.editingInstructorId, {
          fullName: values.fullName.trim(),
          club: church,
          iglesia: church,
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          zone: values.zone,
          rank: values.rank,
          photoUrl,
          photoPublicId,
          specialties: values.specialties,
          completedCourses,
          achievements,
        });
      } else {
        await this.instructoresService.createInstructor({
          fullName: values.fullName.trim(),
          club: church,
          iglesia: church,
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          zone: values.zone,
          rank: values.rank,
          photoUrl,
          photoPublicId,
          specialties: values.specialties,
          completedCourses,
          achievements,
          status: 'ACTIVO',
          disciplinaryStatus: 'Historial limpio',
        });
      }

      this.alertService.close();
      this.alertService.successAlert(
        'Registro guardado',
        this.editingInstructorId ? 'El instructor fue actualizado.' : 'El instructor fue creado.'
      );
      this.closeRegisterModal();
    } catch (error) {
      this.alertService.close();
      this.uploadError =
        error instanceof Error ? error.message : 'Ocurrio un error guardando el instructor.';
      this.alertService.error(this.uploadError);
      console.error('Error guardando instructor', error);
    } finally {
      this.savingInstructor = false;
    }
  }

  trackByInstructor(index: number, instructor: InstructoresItem): string {
    return instructor.id ?? `${index}`;
  }

  trackByCourse(index: number, course: CursoItem): string {
    return course.id ?? `${index}`;
  }

  trackByLogro(index: number, logro: LogroItem): string {
    return logro.id ?? `${index}`;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedZoneFilter = 'ALL';
    this.selectedRankFilter = 'ALL';
    this.selectedStatusFilter = 'ALL';
    this.selectedPhotoFilter = 'ALL';
    this.selectedOrderBy = 'RANK';
  }

  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
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

  openAddAchievementModal(): void {
    if (!this.selectedInstructor) {
      return;
    }
    this.isAddAchievementModalOpen = true;
  }

  closeAddAchievementModal(): void {
    this.isAddAchievementModalOpen = false;
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

    const nextCompletedCourses: InstructoresCourse[] = [
      ...current.completedCourses,
      { name: course.title, category: course.category },
    ];
    const nextSpecialties = Array.from(new Set([...current.specialties, course.title]));

    try {
      this.alertService.showLoading('Agregando curso...');
      await this.instructoresService.updateInstructor(current.id, {
        completedCourses: nextCompletedCourses,
        specialties: nextSpecialties,
      });
      this.alertService.close();
      this.alertService.success('Curso agregado al instructor');
      this.closeAddCourseModal();
    } catch (error) {
      this.alertService.close();
      this.alertService.error('No se pudo agregar el curso.');
      console.error('Error agregando curso a instructor', error);
    }
  }

  async addExistingLogroToSelected(logro: LogroItem): Promise<void> {
    if (!this.selectedInstructor) {
      return;
    }

    const current = this.instructors.find((item) => item.id === this.selectedInstructor?.id);
    if (!current) {
      return;
    }

    const currentAchievements = current.achievements ?? [];
    const alreadyExists = currentAchievements.some((item) => item.id === logro.id);
    if (alreadyExists) {
      return;
    }

    const nextAchievements: InstructoresAchievement[] = [
      ...currentAchievements,
      {
        id: logro.id,
        title: logro.title,
        category: logro.category,
        level: logro.level,
        points: logro.points,
      },
    ];

    try {
      this.alertService.showLoading('Agregando logro...');
      await this.instructoresService.updateInstructor(current.id, {
        achievements: nextAchievements,
      });
      this.alertService.close();
      this.alertService.success('Logro agregado al instructor');
      this.closeAddAchievementModal();
    } catch (error) {
      this.alertService.close();
      this.alertService.error('No se pudo agregar el logro.');
      console.error('Error agregando logro a instructor', error);
    }
  }

  async toggleAuthorizationStatus(instructor: InstructoresItem): Promise<void> {
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
      await this.instructoresService.updateInstructor(instructor.id, { status: nextStatus });
      this.alertService.close();
      this.alertService.success(
        nextStatus === 'INACTIVO' ? 'Permiso revocado correctamente' : 'Permiso activado correctamente'
      );
    } catch (error) {
      this.alertService.close();
      this.alertService.error('No se pudo actualizar el estado.');
      console.error('Error actualizando estado de instructor', error);
    }
  }

  async deleteSelectedInstructor(instructor: InstructoresItem): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Eliminar instructor',
      `¿Deseas eliminar el instructor "${instructor.fullName}"? Esta accion no se puede deshacer.`,
      'Sí, eliminar'
    );
    if (!confirmed) {
      return;
    }

    try {
      this.alertService.showLoading('Eliminando instructor...');
      if (instructor.photoPublicId) {
        await this.cloudinaryService.deleteImageByPublicId(instructor.photoPublicId);
      }
      await this.instructoresService.deleteInstructor(instructor.id);
      this.alertService.close();
      this.alertService.successAlert('Registro eliminado', 'El instructor fue eliminado.');
      this.closeInstructorDetail();
    } catch (error) {
      this.alertService.close();
      this.alertService.error(error instanceof Error ? error.message : 'No se pudo eliminar el instructor.');
      console.error('Error eliminando instructor', error);
    }
  }

  private createAvatarUrl(name: string): string {
    const safeName = name.trim() || 'Instructor';
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

  private sortInstructorList(items: InstructoresItem[]): InstructoresItem[] {
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

  private hasCustomPhoto(photoUrl: string | null | undefined): boolean {
    const cleanPhotoUrl = (photoUrl ?? '').trim();
    return !!cleanPhotoUrl && cleanPhotoUrl !== this.defaultPhotoUrl;
  }

  private resetFormState(revokeUpload: boolean): void {
    if (revokeUpload && this.selectedPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.selectedPhotoPreview);
    }

    this.registerForm.reset({
      fullName: '',
      email: '',
      phone: '',
      church: '',
      zone: 'Zona 1',
      rank: 'Guia Mayor',
      specialties: [],
      achievementIds: [],
    });

    this.registerForm.controls.specialties.setValue([]);
    this.registerForm.controls.achievementIds.setValue([]);
    this.selectedPhotoFile = null;
    this.selectedPhotoPreview = '';
    this.selectedPhotoName = '';
  }
}
