import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LotesService {

  private api = 'http://127.0.0.1:8000/api/lotes/';

  constructor(private http: HttpClient) {}

  getLotes(): Observable<any[]> {
    return this.http.get<any[]>(this.api);
  }
  getProgresoGlobal(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}progreso-global/`);
  }
  createLote(data: any): Observable<any> {
    return this.http.post(this.api, data);
  }

  enviarBartender(id: number): Observable<any> {
    return this.http.post(`${this.api}${id}/bartender/`, {});
  }

  enviarTodos(): Observable<any> {
    return this.http.post(`${this.api}bartender/enviar-todos/`, {});
  }
  getActividadReciente(limite = 30): Observable<any[]> {
  return this.http.get<any[]>(`${this.api}actividad/?limite=${limite}`);
}
getLiberacion(): Observable<any[]> {
  return this.http.get<any[]>(`${this.api}liberacion/`);
}
deleteLote(id: number): Observable<any> {
  return this.http.delete(`${this.api}${id}/`);
}
  escanearBolsa(codigoBarras: string, loteId: number): Observable<any> {
    return this.http.post(`${this.api}escanear/`, {
      codigo_barras: codigoBarras,
      lote_id: loteId,
    });
  }

  registrarMerma(codigoBarras: string, motivo: string, loteId: number): Observable<any> {
    return this.http.post(`${this.api}merma/`, {
      codigo_barras: codigoBarras,
      motivo,
      lote_id: loteId,
    });
  }

  getProgresoLote(loteId: number): Observable<any> {
    return this.http.get(`${this.api}${loteId}/progreso/`);
  }

  // lotes.service.ts
getInventario(): Observable<any> {
  return this.http.get(`${this.api}inventario/`);
}
}