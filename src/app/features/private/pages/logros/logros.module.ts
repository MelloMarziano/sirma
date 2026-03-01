import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LogrosPageRoutingModule } from './logros.page-routing.module';
import { LogrosPage } from './logros.page';

@NgModule({
  declarations: [LogrosPage],
  imports: [CommonModule, LogrosPageRoutingModule, FormsModule, ReactiveFormsModule],
})
export class LogrosPageModule {}
