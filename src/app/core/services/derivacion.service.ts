// =============================================================
// derivacion.service.ts
// CORRECCIÓN CRÍTICA:
//   URL absoluta 'http://localhost:8080/api/derivaciones' → '/api/derivaciones'
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DerivacionRequest, DerivacionResponse } from '../models/derivacion.model';

@Injectable({ providedIn: 'root' })
export class DerivacionService {

  // CORRECCIÓN: URL relativa — el proxy reenvía a http://localhost:8080
  private readonly apiUrl = '/api/derivaciones';

  constructor(private http: HttpClient) {}

  // ── POST /api/derivaciones/{numeroTramite} ────────────────
  // Requiere: MESA_PARTES o ADMINISTRADOR
  // Body: DerivacionRequestDTO { areaDestinoId, motivo, usuarioResponsable }
  derivar(
    numeroTramite: string,
    request: DerivacionRequest
  ): Observable<DerivacionResponse> {
    return this.http.post<DerivacionResponse>(
      `${this.apiUrl}/${numeroTramite}`,
      request
    );
  }

  // ── GET /api/derivaciones/{numeroTramite} ─────────────────
  // Requiere: MESA_PARTES o ADMINISTRADOR
  obtenerPorTramite(numeroTramite: string): Observable<DerivacionResponse[]> {
    return this.http.get<DerivacionResponse[]>(`${this.apiUrl}/${numeroTramite}`);
  }
}