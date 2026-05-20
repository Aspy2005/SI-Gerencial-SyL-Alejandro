import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalidadListComponent } from './calidad-list/calidad-list';

const routes: Routes = [
  { path: '', component: CalidadListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalidadRoutingModule {}