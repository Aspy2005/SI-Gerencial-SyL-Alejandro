import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LotesListComponent } from './lotes-list/lotes-list';

const routes: Routes = [
  { path: '', component: LotesListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LotesRoutingModule {}