import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { EscaneoComponent }  from './escaneo.component';
import { CountByEstadoPipe } from './count-by-estado.pipe';

const routes: Routes = [
  { path: '', component: EscaneoComponent }
];

@NgModule({
  declarations: [
    EscaneoComponent,   // este sí va en declarations (standalone: false)
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    CountByEstadoPipe,  // ← aquí, no en declarations
  ]
})
export class EscaneoModule {}