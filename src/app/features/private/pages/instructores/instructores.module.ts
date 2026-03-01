import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InstructoresPage } from './instructores.page';
import { InstructoresPageRoutingModule } from './instructores.page-routing.module';

@NgModule({
  declarations: [InstructoresPage],
  imports: [CommonModule, InstructoresPageRoutingModule, FormsModule, ReactiveFormsModule],
})
export class InstructoresPageModule {}
