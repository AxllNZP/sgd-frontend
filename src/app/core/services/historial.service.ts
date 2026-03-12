// =============================================================
// historial.service.ts
// GET /api/historial/{numeroTramite} → List<HistorialResponseDTO>
// Requiere: isAuthenticated()
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistorialResponse } from '../models/historial.model';

@Injectable({ providedIn: 'root' })
export class HistorialService {

  private readonly apiUrl = 'http://localhost:8080/api/historial';

  constructor(private http: HttpClient) {}

  // ── GET /api/historial/{numeroTramite} ────────────────────
  // Retorna List<HistorialResponseDTO> (no paginado)
  obtenerPorTramite(numeroTramite: string): Observable<HistorialResponse[]> {
    return this.http.get<HistorialResponse[]>(`${this.apiUrl}/${numeroTramite}`);
  }
}