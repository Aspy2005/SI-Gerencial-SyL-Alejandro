import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MallasListComponent } from './mallas-list/mallas-list';

const routes: Routes = [
  { path: '', component: MallasListComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    MallasListComponent   // importar el standalone aquí
  ]
})
export class MallasListModule {}