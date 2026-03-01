import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DumcPage } from './dumc.page';
import { DumcPageRoutingModule } from './dumc.page-routing.module';

@NgModule({
  declarations: [DumcPage],
  imports: [CommonModule, DumcPageRoutingModule, FormsModule, ReactiveFormsModule],
})
export class DumcPageModule {}
