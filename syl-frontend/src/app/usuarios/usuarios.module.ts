import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // ← faltaba
import { UsuariosRoutingModule } from './usuarios/usuarios-routing.module';
import { UsuariosComponent } from './usuarios/usuarios';

@NgModule({
  declarations: [UsuariosComponent],
  imports: [
    CommonModule,
    FormsModule,
    UsuariosRoutingModule
  ]
})
export class UsuariosModule {}