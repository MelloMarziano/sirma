import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrivatePage } from './private.page';
// import { roleGuard } from 'src/app/core/guards/role/role.guard';
// import { RoleGuard } from 'src/app/core/guards/role/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: PrivatePage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then((m) => m.DashboardPageModule),
      },
      {
        path: 'instructores',
        loadChildren: () =>
          import('./pages/instructores/instructores.module').then(
            (m) => m.InstructoresPageModule
          ),
      },
      {
        path: 'dumc',
        loadChildren: () =>
          import('./pages/dumc/dumc.module').then((m) => m.DumcPageModule),
      },
      {
        path: 'cursos',
        loadChildren: () =>
          import('./pages/cursos/cursos.module').then((m) => m.CursosPageModule),
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./pages/usuarios/usuarios.module').then((m) => m.UsuariosPageModule),
      },
      {
        path: 'logros',
        loadChildren: () =>
          import('./pages/logros/logros.module').then((m) => m.LogrosPageModule),
      },
      {
        path: 'home',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrivateRoutingModule {}
