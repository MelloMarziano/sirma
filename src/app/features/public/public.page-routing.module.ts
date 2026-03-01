import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PublicPage } from './public.page';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full'
  },
  {
    path: '',
    component: PublicPage,
    children: [
      {
        path: 'sign-in',
        loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
      },
      // {
      //   path: 'sign-up',
      //   loadChildren: () => import('./pages/sign-up/signup.module').then(m => m.SignUpPageModule)
      // },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
