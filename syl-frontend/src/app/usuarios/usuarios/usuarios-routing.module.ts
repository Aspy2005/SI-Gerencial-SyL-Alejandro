import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuariosComponent } from '../usuarios/usuarios';
import { AuthGuard } from '../../core/guards/auth-guard';
import { RoleGuard } from '../../core/guards/role-guard';

const routes: Routes = [
  {
    path: '',
    component: UsuariosComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['jefe_planta'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsuariosRoutingModule {}