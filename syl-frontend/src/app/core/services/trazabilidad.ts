import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventoLote {
  tipo:        string;   // 'creacion' | 'bartender' | 'escaneo' | 'merma' | 'calidad' | 'liberacion'
  descripcion: string;
  fecha:       string;
  usuario:     string | null;
}

export interface HistorialLote {
  codigo_lote:   string;
  producto:      string;
  cantidad:      number;
  estado:        string;
  calidad_estado: string;
  eventos:       EventoLote[];
  // detalle de bolsa si se buscó por código de barras
  bolsa?: {
    codigo_bolsa:  string;
    codigo_barras: string;
    sede:          string;
    ciudad:        string;
    escaneada:     boolean;
    fecha_escaneo: string | null;
    escaneada_por: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class TrazabilidadService {

  private api = `${environment.apiUrl}/lotes`;

  constructor(private http: HttpClient) {}

  /**
   * Busca un lote por:
   *  - codigo_lote (LOT-XXXXXXXX)
   *  - codigo_barras de una bolsa
   *  - sede (devuelve historial agregado del lote)
   */
  buscar(query: string): Observable<HistorialLote> {
    const params = new HttpParams().set('q', query);
    return this.http.get<HistorialLote>(`${this.api}/trazabilidad/`, { params });
  }

  /** Historial directo por ID de lote */
  historialPorLote(loteId: number): Observable<HistorialLote> {
    return this.http.get<HistorialLote>(`${this.api}/${loteId}/trazabilidad/`);
  }
}