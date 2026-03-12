// =============================================================
// respuesta.service.ts
// POST /api/respuestas/{numeroTramite} — emitir respuesta
// GET  /api/respuestas/{numeroTramite} — listar respuestas
// Requiere: MESA_PARTES o ADMINISTRADOR
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RespuestaRequest, RespuestaResponse } from '../models/respuesta.model';

@Injectable({ providedIn: 'root' })
export class RespuestaService {

  private readonly apiUrl = 'http://localhost:8080/api/respuestas';

  constructor(private http: HttpClient) {}

  // ── POST /api/respuestas/{numeroTramite} ──────────────────
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