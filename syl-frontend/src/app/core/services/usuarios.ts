import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';

export interface Usuario {
  id:         number;
  username:   string;
  email:      string;
  first_name: string;
  last_name:  string;
  rol:        'jefe_planta' | 'operario' | 'analista_calidad';
  activo:     boolean;
}

export interface CrearUsuario {
  username:   string;
  email:      string;
  first_name: string;
  last_name:  string;
  rol:        string;
  password:   string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private api: ApiService) {}

  getUsuarios(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>('/auth/usuarios/');
  }

  crearUsuario(data: CrearUsuario): Observable<Usuario> {
    return this.api.post<Usuario>('/auth/registro/', data);
  }

  actualizarUsuario(id: number, data: Partial<Usuario>): Observable<Usuario> {
    return this.api.put<Usuario>(`/auth/usuarios/${id}/`, data);
  }

  toggleActivo(id: number, activo: boolean): Observable<Usuario> {
    return this.api.put<Usuario>(`/auth/usuarios/${id}/`, { activo });
  }
}