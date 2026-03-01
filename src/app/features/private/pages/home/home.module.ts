import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { HomeRoutingModule } from './home.page-routing.module';

@NgModule({
  declarations: [HomePage],
  imports: [CommonModule, HomeRoutingModule, ReactiveFormsModule, FormsModule],
})
export class HomePageModule {}
