import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistorialResponse } from '../models/historial.model';

@Injectable({ providedIn: 'root' })
export class HistorialService {

  private apiUrl = 'http://localhost:8080/api/historial';

  constructor(private http: HttpClient) {}

  obtenerPorTramite(numeroTramite: string): Observable<HistorialResponse[]> {
    return this.http.get<HistorialResponse[]>(`${this.apiUrl}/${numeroTramite}`);
  }
}