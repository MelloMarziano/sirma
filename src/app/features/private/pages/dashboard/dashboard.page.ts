import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CursosService } from 'src/app/core/services/cursos/cursos.service';
import { DumcService } from 'src/app/core/services/dumc/dumc.service';
import {
  InstructoresItem,
  InstructoresService,
} from 'src/app/core/services/instructores/instructores.service';
import { LogrosService } from 'src/app/core/services/logros/logros.service';
import { UsuariosService } from 'src/app/core/services/usuarios/usuarios.service';

interface ZoneStat {
  label: string;
  count: number;
  percentage: number;
  sharePercentage: number;
  color: string;
}

interface RankedInstructor {
  item: InstructoresItem;
  score: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly totalZones = 11;
  private readonly zonePalette = [
    '#1f4ab8',
    '#2f6ee5',
    '#3f8cf3',
    '#12b5cb',
    '#16a56d',
    '#7bbf2a',
    '#f0c23d',
    '#f39a2d',
    '#ea5c43',
    '#d64fa8',
    '#7b5cf0',
  ];

  loadingInstructores = true;
  instructores: InstructoresItem[] = [];
  cursosCount = 0;
  dumcCount = 0;
  usuariosCount = 0;
  logrosCount = 0;

  constructor(
    private readonly instructoresService: InstructoresService,
    private readonly cursosService: CursosService,
    private readonly dumcService: DumcService,
    private readonly usuariosService: UsuariosService,
    private readonly logrosService: LogrosService
  ) {}

  ngOnInit(): void {
    this.instructoresService
      .getInstructores$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.instructores = items;
          this.loadingInstructores = false;
        },
        error: (error) => {
          this.loadingInstructores = false;
          console.error('Error cargando instructores para dashboard', error);
        },
      });

    this.cursosService
      .getCursos$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (items) => (this.cursosCount = items.length) });

    this.dumcService
      .getDumc$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (items) => (this.dumcCount = items.length) });

    this.usuariosService
      .getUsuarios$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (items) => (this.usuariosCount = items.length) });

    this.logrosService
      .getLogros$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (items) => (this.logrosCount = items.length) });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalInstructores(): number {
    return this.instructores.length;
  }

  get instructoresActivos(): number {
    return this.instructores.filter((item) => item.status === 'ACTIVO').length;
  }

  get instructoresInactivos(): number {
    return this.instructores.filter((item) => item.status === 'INACTIVO').length;
  }

  get zonasConCobertura(): number {
    const validZones = new Set(
      Array.from({ length: this.totalZones }, (_, index) => `Zona ${index + 1}`)
    );
    return new Set(
      this.instructores.map((item) => item.zone?.trim()).filter((zone): zone is string => !!zone && validZones.has(zone))
    ).size;
  }

  get promedioCursosPorInstructor(): number {
    if (!this.instructores.length) {
      return 0;
    }
    const total = this.instructores.reduce((sum, item) => sum + item.completedCourses.length, 0);
    return total / this.instructores.length;
  }

  get zoneStats(): ZoneStat[] {
    const baseZones = Array.from({ length: this.totalZones }, (_, index) => `Zona ${index + 1}`);
    const counts = new Map<string, number>(baseZones.map((zone) => [zone, 0]));

    for (const instructor of this.instructores) {
      const zone = instructor.zone?.trim() || 'Sin zona';
      counts.set(zone, (counts.get(zone) ?? 0) + 1);
    }

    const entries = Array.from(counts.entries()).sort(([a], [b]) => this.compareZones(a, b));
    const maxCount = Math.max(1, ...entries.map(([, count]) => count));
    const totalCount = Math.max(1, entries.reduce((sum, [, count]) => sum + count, 0));

    return entries.map(([label, count], index) => ({
      label,
      count,
      percentage: Math.round((count / maxCount) * 100),
      sharePercentage: Math.round((count / totalCount) * 100),
      color: this.zonePalette[index % this.zonePalette.length],
    }));
  }

  get zoneStatsForPie(): ZoneStat[] {
    return this.zoneStats.filter((item) => item.count > 0);
  }

  get zonePieBackground(): string {
    const items = this.zoneStatsForPie;
    if (items.length === 0) {
      return 'conic-gradient(#e7edf7 0deg 360deg)';
    }

    const total = items.reduce((sum, item) => sum + item.count, 0);
    if (!total) {
      return 'conic-gradient(#e7edf7 0deg 360deg)';
    }

    let current = 0;
    const segments = items.map((item) => {
      const start = current;
      const angle = (item.count / total) * 360;
      current += angle;
      return `${item.color} ${start.toFixed(2)}deg ${current.toFixed(2)}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  get topRankedInstructors(): RankedInstructor[] {
    return [...this.instructores]
      .map((item) => ({ item, score: this.calculateInstructorScore(item) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  get rankDistribution(): Array<{ label: string; count: number; percentage: number }> {
    const ranks = ['Guias Mayores', 'Conquistadores', 'Aventureros'];
    const counts = ranks.map((label) => ({
      label,
      count: this.instructores.filter((item) => item.rank === label).length,
    }));
    const max = Math.max(1, ...counts.map((item) => item.count));

    return counts.map((item) => ({
      ...item,
      percentage: Math.round((item.count / max) * 100),
    }));
  }

  get topClubs(): Array<{ club: string; count: number }> {
    const map = new Map<string, number>();

    for (const instructor of this.instructores) {
      const club = instructor.club?.trim() || 'Sin club';
      map.set(club, (map.get(club) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([club, count]) => ({ club, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  get recentInstructors(): InstructoresItem[] {
    return [...this.instructores].slice(0, 5);
  }

  trackByZone(index: number, item: ZoneStat): string {
    return item.label ?? `${index}`;
  }

  trackByInstructor(index: number, item: RankedInstructor): string {
    return item.item.id ?? `${index}`;
  }

  trackByClub(index: number, item: { club: string }): string {
    return item.club ?? `${index}`;
  }

  trackByRecent(index: number, item: InstructoresItem): string {
    return item.id ?? `${index}`;
  }

  getRankShort(rank: string): string {
    if (rank === 'Guias Mayores') {
      return 'GM';
    }
    if (rank === 'Conquistadores') {
      return 'CQ';
    }
    if (rank === 'Aventureros') {
      return 'AV';
    }
    return 'IN';
  }

  private calculateInstructorScore(instructor: InstructoresItem): number {
    return (instructor.achievements ?? []).reduce(
      (sum, achievement) => sum + (Number(achievement.points) || 0),
      0
    );
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

  private extractZoneNumber(label: string): number | null {
    const match = label.match(/zona\s+(\d+)/i);
    return match ? Number(match[1]) : null;
  }
}
