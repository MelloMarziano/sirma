import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModuleCustom } from 'src/app/material/material.module';
import { PublicRoutingModule } from './public.page-routing.module';
import { PublicPage } from './public.page';



@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PublicRoutingModule,
    MaterialModuleCustom,

  ],
  declarations: [
    PublicPage,
  ],
  exports: [
  ]

})
export class PublicModule { }
