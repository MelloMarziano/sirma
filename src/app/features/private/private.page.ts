import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth/auth.service';

type NavIcon =
  | 'layout-dashboard'
  | 'shield'
  | 'users'
  | 'graduation-cap'
  | 'user-cog'
  | 'trophy';

interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
}

@Component({
  selector: 'app-private',
  templateUrl: './private.page.html',
  styleUrls: ['./private.page.scss'],
})
export class PrivatePage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  userName = 'Usuario';
  userRole = 'Administrador';
  userEmail = '';
  userInitials = 'US';

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/private/dashboard', icon: 'layout-dashboard' },
    { label: 'Instructores', route: '/private/instructores', icon: 'shield' },
    { label: 'DUMC', route: '/private/dumc', icon: 'users' },
    { label: 'Cursos', route: '/private/cursos', icon: 'graduation-cap' },
    { label: 'Logros', route: '/private/logros', icon: 'trophy' },
    { label: 'Usuarios', route: '/private/usuarios', icon: 'user-cog' },
  ];
  appBarTitle = 'Dashboard';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSessionUser();
    this.updateAppBarTitle(this.router.url);
    this.authService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadSessionUser());

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => this.updateAppBarTitle(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSignOut(): void {
    this.authService.logout();
  }

  private loadSessionUser(): void {
    const session = this.authService.getUserSession();
    const name = session?.name || session?.memberName || 'Usuario';
    const role = session?.role || 'Administrador';
    const email = session?.email || '';

    this.userName = name;
    this.userRole = role;
    this.userEmail = email;
    this.userInitials = this.getInitials(name);
  }

  private updateAppBarTitle(url: string): void {
    const activePath = url.split('?')[0].split('/').filter(Boolean).pop();
    const activeRoute = `/private/${activePath ?? 'dashboard'}`;
    const activeItem = this.navItems.find((item) => item.route === activeRoute);

    this.appBarTitle = activeItem?.label ?? 'Dashboard';
  }

  private getInitials(name: string): string {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (parts.length === 0) {
      return 'US';
    }

    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
  }
}
