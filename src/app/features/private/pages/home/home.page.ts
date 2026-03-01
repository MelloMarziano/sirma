import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

type InstructorStatus = 'ACTIVO' | 'INACTIVO';

interface InstructorCourse {
  name: string;
  category: string;
}

interface Instructor {
  id: number;
  fullName: string;
  club: string;
  zone: string;
  rank: string;
  status: InstructorStatus;
  photoUrl: string;
  specialties: string[];
  completedCourses: InstructorCourse[];
  disciplinaryStatus: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly tempObjectUrls: string[] = [];

  currentSection = 'Instructores';
  searchTerm = '';
  isRegisterModalOpen = false;
  selectedInstructor: Instructor | null = null;
  selectedPhotoPreview = '';
  selectedPhotoName = '';

  readonly rankOptions = ['Aventureros', 'Conquistadores', 'Guias Mayores'];
  instructors: Instructor[] = [
    {
      id: 1,
      fullName: 'Carlos Jimenez',
      club: 'Club Orion',
      zone: 'Zona 1',
      rank: 'Guias Mayores',
      status: 'ACTIVO',
      photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      specialties: ['Marchas Avanzadas', 'Liderazgo Juvenil'],
      completedCourses: [
        { name: 'Marchas Avanzadas', category: 'Tecnica' },
        { name: 'Liderazgo Juvenil', category: 'Liderazgo' },
      ],
      disciplinaryStatus: 'Historial limpio',
    },
    {
      id: 2,
      fullName: 'Ana Torres',
      club: 'Club Pleyades',
      zone: 'Zona 2',
      rank: 'Conquistadores',
      status: 'ACTIVO',
      photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      specialties: ['Marchas Basicas'],
      completedCourses: [
        { name: 'Marchas Basicas', category: 'Tecnica' },
        { name: 'Campismo', category: 'Campo' },
      ],
      disciplinaryStatus: 'Historial limpio',
    },
    {
      id: 3,
      fullName: 'David Ruiz',
      club: 'Club Leones',
      zone: 'Zona 1',
      rank: 'Aventureros',
      status: 'INACTIVO',
      photoUrl: 'https://randomuser.me/api/portraits/men/65.jpg',
      specialties: ['Marchas Basicas'],
      completedCourses: [
        { name: 'Marchas Basicas', category: 'Tecnica' },
        { name: 'Primeros Auxilios', category: 'Salud' },
      ],
      disciplinaryStatus: 'Observacion en proceso',
    },
  ];

  readonly registerForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    club: ['', Validators.required],
    zone: ['', Validators.required],
    rank: ['Conquistadores', Validators.required],
    specialties: [''],
  });

  constructor(
    private readonly router: Router,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.updateCurrentSection(this.router.url);
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => this.updateCurrentSection(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.cleanupObjectUrls();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredInstructors(): Instructor[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.instructors;
    }

    return this.instructors.filter((instructor) =>
      `${instructor.fullName} ${instructor.club}`.toLowerCase().includes(term)
    );
  }

  openRegisterModal(): void {
    this.isRegisterModalOpen = true;
  }

  closeRegisterModal(revokeUpload = true): void {
    this.isRegisterModalOpen = false;
    this.resetFormState(revokeUpload);
  }

  openInstructorDetail(instructor: Instructor): void {
    this.selectedInstructor = instructor;
  }

  closeInstructorDetail(): void {
    this.selectedInstructor = null;
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

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (this.selectedPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.selectedPhotoPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    this.tempObjectUrls.push(objectUrl);
    this.selectedPhotoPreview = objectUrl;
    this.selectedPhotoName = file.name;
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const values = this.registerForm.getRawValue();
    const specialties = values.specialties
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const photo = this.selectedPhotoPreview || this.createAvatarUrl(values.fullName);
    const newInstructor: Instructor = {
      id: Date.now(),
      fullName: values.fullName.trim(),
      club: values.club.trim(),
      zone: values.zone.trim(),
      rank: values.rank,
      status: 'ACTIVO',
      photoUrl: photo,
      specialties: specialties.length > 0 ? specialties : ['Sin especialidad'],
      completedCourses: [
        { name: 'Induccion Inicial', category: 'Base' },
        { name: 'Marchas Basicas', category: 'Tecnica' },
      ],
      disciplinaryStatus: 'Historial limpio',
    };

    this.instructors = [newInstructor, ...this.instructors];
    this.closeRegisterModal(!this.selectedPhotoPreview.startsWith('blob:'));
  }

  trackByInstructor(index: number, instructor: Instructor): number {
    return instructor.id ?? index;
  }

  private updateCurrentSection(url: string): void {
    const section = url.split('?')[0].split('/').filter(Boolean).pop();
    const sectionMap: Record<string, string> = {
      instructores: 'Instructores',
      dumc: 'DUMC',
      cursos: 'Cursos',
    };

    this.currentSection = sectionMap[section ?? 'instructores'] ?? 'Instructores';
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

  private resetFormState(revokeUpload: boolean): void {
    if (revokeUpload && this.selectedPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.selectedPhotoPreview);
    }

    this.registerForm.reset({
      fullName: '',
      club: '',
      zone: '',
      rank: 'Conquistadores',
      specialties: '',
    });
    this.selectedPhotoPreview = '';
    this.selectedPhotoName = '';
  }
}
