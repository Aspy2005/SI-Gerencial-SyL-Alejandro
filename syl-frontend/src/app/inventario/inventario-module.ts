import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { InventarioComponent } from './inventario';
import { InventarioCountPipe, StockSumPipe } from './inventario.pipes';

const routes: Routes = [
  { path: '', component: InventarioComponent }
];

@NgModule({
  declarations: [
    InventarioComponent,
    InventarioCountPipe,
    StockSumPipe,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ]
})
export class InventarioModule {}