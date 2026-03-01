import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DashboardPageRoutingModule } from './dashboard.page-routing.module';
import { DashboardPage } from './dashboard.page';

@NgModule({
  declarations: [DashboardPage],
  imports: [CommonModule, DashboardPageRoutingModule],
})
export class DashboardPageModule {}
