// src/app/features/liberacion/liberacion-module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { LiberacionComponent } from './liberacion.component';

const routes: Routes = [
  { path: '', component: LiberacionComponent }
];

@NgModule({
  declarations: [LiberacionComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
})
export class LiberacionModule {}