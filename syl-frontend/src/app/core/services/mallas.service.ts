import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MallasService {

  apiUrl = 'http://127.0.0.1:8000/api/mallas';

  constructor(
    private http: HttpClient
  ) {}

  getMallas() {
    return this.http.get<any[]>(
      `${this.apiUrl}/`
    );
  }

  uploadMalla(formData: FormData) {

  return this.http.post(
    `${this.apiUrl}/upload/`,
    formData
  );
}

  previewMalla(formData: FormData) {

  return this.http.post(
    `${this.apiUrl}/preview/`,
    formData
  );
}
}