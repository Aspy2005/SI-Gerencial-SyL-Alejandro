import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProduccionListComponent } from './produccion-list/produccion-list';

const routes: Routes = [
  { path: '', component: ProduccionListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProduccionRoutingModule {}