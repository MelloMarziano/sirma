import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { PrivatePage } from './private.page';
import { CommonModule } from '@angular/common';
import { PrivateRoutingModule } from './private-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModuleCustom } from 'src/app/material/material.module';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PrivateRoutingModule,
    MaterialModuleCustom,
    MatTooltipModule,
  ],
  declarations: [PrivatePage],
  exports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrivateModule {}
