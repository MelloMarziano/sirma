import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsuariosPageRoutingModule } from './usuarios.page-routing.module';
import { UsuariosPage } from './usuarios.page';

@NgModule({
  declarations: [UsuariosPage],
  imports: [CommonModule, UsuariosPageRoutingModule, FormsModule, ReactiveFormsModule],
})
export class UsuariosPageModule {}
