// src/app/core/services/liberacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoteLiberable {
  id: number;
  codigo_lote: string;
  producto: string;
  cantidad: number;
  estado: string;
  estado_display: string;
  calidad_estado: 'pendiente' | 'aprobado' | 'rechazado';
  calidad_obs: string | null;
  calidad_por: string | null;
  calidad_fecha: string | null;
  stock_bloqueado: boolean;
  stock_liberado: boolean;
}

export interface LiberacionResult {
  ok: boolean;
  mensaje: string;
  codigo_lote: string;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class LiberacionService {

  private api = 'http://127.0.0.1:8000/api/lotes/';

  constructor(private http: HttpClient) {}

  getLotesParaLiberacion(): Observable<LoteLiberable[]> {
    return this.http.get<LoteLiberable[]>(`${this.api}liberacion/`);
  }

  liberarStock(loteId: number): Observable<LiberacionResult> {
    return this.http.post<LiberacionResult>(`${this.api}${loteId}/liberar/`, {});
  }
}