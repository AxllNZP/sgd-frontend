// =============================================================
// derivacion.service.ts
// POST /api/derivaciones/{numeroTramite} — derivar
// GET  /api/derivaciones/{numeroTramite} — listar
// Requiere: MESA_PARTES o ADMINISTRADOR
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DerivacionRequest, DerivacionResponse } from '../models/derivacion.model';

@Injectable({ providedIn: 'root' })
export class DerivacionService {

  private readonly apiUrl = 'http://localhost:8080/api/derivaciones';

  constructor(private http: HttpClient) {}

  // ── POST /api/derivaciones/{numeroTramite} ────────────────
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
  obtenerPorTramite(numeroTramite: string): Observable<DerivacionResponse[]> {
    return this.http.get<DerivacionResponse[]>(`${this.apiUrl}/${numeroTramite}`);
  }
}