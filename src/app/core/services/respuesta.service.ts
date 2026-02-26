import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RespuestaRequest, RespuestaResponse } from '../models/respuesta.model';

@Injectable({ providedIn: 'root' })
export class RespuestaService {

  private apiUrl = 'http://localhost:8080/api/respuestas';

  constructor(private http: HttpClient) {}

  emitir(numeroTramite: string, request: RespuestaRequest): Observable<RespuestaResponse> {
    return this.http.post<RespuestaResponse>(`${this.apiUrl}/${numeroTramite}`, request);
  }

  obtenerPorTramite(numeroTramite: string): Observable<RespuestaResponse[]> {
    return this.http.get<RespuestaResponse[]>(`${this.apiUrl}/${numeroTramite}`);
  }
}