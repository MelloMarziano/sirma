import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CursosPage } from './cursos.page';
import { CursosPageRoutingModule } from './cursos.page-routing.module';

@NgModule({
  declarations: [CursosPage],
  imports: [CommonModule, CursosPageRoutingModule, FormsModule, ReactiveFormsModule],
})
export class CursosPageModule {}
