import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MermasListComponent } from './mermas-list/mermas-list';

const routes: Routes = [
  { path: '', component: MermasListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MermasRoutingModule {}