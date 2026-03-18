// =============================================================
// respuesta.service.ts
// CORRECCIÓN: URL absoluta → relativa (/api/respuestas)
// El proxy de Angular reenvía /api/** a http://localhost:8080
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RespuestaRequest, RespuestaResponse } from '../models/respuesta.model';

@Injectable({ providedIn: 'root' })
export class RespuestaService {

  // CORRECCIÓN: URL relativa — el proxy reenvía a http://localhost:8080
  private readonly apiUrl = '/api/respuestas';

  constructor(private http: HttpClient) {}

  // ── POST /api/respuestas/{numeroTramite} ──────────────────
  // Requiere: MESA_PARTES o ADMINISTRADOR
  emitir(
    numeroTramite: string,
    request: RespuestaRequest
  ): Observable<RespuestaResponse> {
    return this.http.post<RespuestaResponse>(
      `${this.apiUrl}/${numeroTramite}`,
      request
    );
  }

  // ── GET /api/respuestas/{numeroTramite} ───────────────────
  obtenerPorTramite(numeroTramite: string): Observable<RespuestaResponse[]> {
    return this.http.get<RespuestaResponse[]>(`${this.apiUrl}/${numeroTramite}`);
  }
}
