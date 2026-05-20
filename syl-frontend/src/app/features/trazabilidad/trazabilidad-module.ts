// src/app/features/trazabilidad/trazabilidad-module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';    // *ngIf, *ngFor, ngClass, date, titlecase
import { FormsModule } from '@angular/forms';      // ngModel
import { RouterModule, Routes } from '@angular/router';

import { TrazabilidadComponent } from './trazabilidad/trazabilidad';

const routes: Routes = [
  { path: '', component: TrazabilidadComponent }
];

@NgModule({
  declarations: [TrazabilidadComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class TrazabilidadModule {}