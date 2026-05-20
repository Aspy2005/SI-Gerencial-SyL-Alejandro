import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProduccionService {
  private apiUrl = `${environment.apiUrl}/produccion`;

  constructor(private http: HttpClient) {}

  getOrdenes() {
    return this.http.get<any[]>(`${this.apiUrl}/`);
  }

  createOrden(data: any) {
    return this.http.post(`${this.apiUrl}/`, data);
  }

  updateOrden(id: number, data: any) {
    return this.http.patch(`${this.apiUrl}/${id}/`, data);
  }

  deleteOrden(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}/`);
  }
}