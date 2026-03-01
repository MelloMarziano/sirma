import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';

const routes: Routes = [
  {
    path: 'private',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/private/private.module').then((m) => m.PrivateModule),
  },
  {
    path: 'public',
    canActivate: [NoAuthGuard],
    loadChildren: () =>
      import('./features/public/public.module').then((m) => m.PublicModule),
  },

  { path: '', redirectTo: 'public', pathMatch: 'full' },
  // { path: '404', component: NotFoundComponent },
  // { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
