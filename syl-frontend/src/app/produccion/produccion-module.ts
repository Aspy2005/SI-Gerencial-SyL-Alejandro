import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ProduccionListComponent } from './produccion-list/produccion-list';

const routes: Routes = [
  { path: '', component: ProduccionListComponent }
];

@NgModule({
  declarations: [ProduccionListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ProduccionModule {}