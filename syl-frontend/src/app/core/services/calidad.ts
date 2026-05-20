import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CalidadService {
  private api = 'http://127.0.0.1:8000/api/calidad/';

  constructor(private http: HttpClient) {}

  getLotesEnRevision(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}lotes/`);
  }

  aprobarLote(id: number, observaciones: string): Observable<any> {
    return this.http.post(`${this.api}${id}/aprobar/`, { observaciones });
  }

  rechazarLote(id: number, motivo: string): Observable<any> {
    return this.http.post(`${this.api}${id}/rechazar/`, { motivo });
  }

  getMermasPorLote(loteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}mermas/?lote=${loteId}`);
  }

  // RF-09 — Mermas independiente
  getMermasTurno(): Observable<any[]> {
  return this.http.get<any[]>('http://127.0.0.1:8000/api/calidad/mermas/');
}

  registrarMerma(data: any): Observable<any> {
    return this.http.post('http://127.0.0.1:8000/api/lotes/merma/', data);
  }
}