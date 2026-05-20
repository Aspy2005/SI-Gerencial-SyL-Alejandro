// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';
import { ShellComponent } from './shared/shell/shell';

const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard-module').then(m => m.DashboardModule)
      },
      {
        path: 'mallas',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta'] },
        loadChildren: () =>
          import('./mallas/mallas-list-module').then(m => m.MallasListModule)
      },
      {
        path: 'lotes',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta', 'operario'] },
        loadChildren: () =>
          import('./lotes/lotes-module').then(m => m.LotesModule)
      },
      {
        path: 'produccion',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta', 'operario'] },
        loadChildren: () =>
          import('./produccion/produccion-module').then(m => m.ProduccionModule)
      },
      {
        path: 'escaneo',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta', 'operario'] },
        loadChildren: () =>
          import('./escaneo/escaneo-module').then(m => m.EscaneoModule)
      },
      {
        path: 'inventario',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta', 'operario'] },
        loadChildren: () =>
          import('./inventario/inventario-module').then(m => m.InventarioModule)
      },
      {
        path: 'calidad',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta', 'analista_calidad'] },
        loadChildren: () =>
          import('./features/calidad/calidad-module').then(m => m.CalidadModule)
      },
      {
        path: 'mermas',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta', 'operario', 'analista_calidad'] },
        loadChildren: () =>
          import('./features/mermas/mermas-module').then(m => m.MermasModule)
      },

      // ── RF-08 Liberación de Stock ────────────────────────────────────
      {
        path: 'liberacion',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta', 'analista_calidad'] },
        loadChildren: () =>
          import('./liberacion.component/liberacion-module')
            .then(m => m.LiberacionModule)
      },
      {
        path: 'trazabilidad',
        canActivate: [RoleGuard],
        data: { roles: ['jefe_planta', 'analista_calidad'] },
        loadChildren: () =>
          import('./features/trazabilidad/trazabilidad-module')
            .then(m => m.TrazabilidadModule)
      },
{
  path: 'usuarios',
  canActivate: [RoleGuard],
  data: { roles: ['jefe_planta'] },
  loadChildren: () =>
    import('./usuarios/usuarios.module').then(m => m.UsuariosModule)
},
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth-module').then(m => m.AuthModule)
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}