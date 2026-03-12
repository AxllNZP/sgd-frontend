// =============================================================
// area.service.ts
// Todos los endpoints /api/areas requieren rol ADMINISTRADOR
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AreaRequest, AreaResponse } from '../models/area.model';

@Injectable({ providedIn: 'root' })
export class AreaService {

  private readonly apiUrl = 'http://localhost:8080/api/areas';

  constructor(private http: HttpClient) {}

  // ── POST /api/areas — requiere ADMINISTRADOR ──────────────
  crear(request: AreaRequest): Observable<AreaResponse> {
    return this.http.post<AreaResponse>(this.apiUrl, request);
  }

  // ── GET /api/areas — requiere ADMINISTRADOR ───────────────
  listar(): Observable<AreaResponse[]> {
    return this.http.get<AreaResponse[]>(this.apiUrl);
  }

  // ── GET /api/areas/{id} — requiere ADMINISTRADOR ─────────
  obtenerPorId(id: string): Observable<AreaResponse> {
    return this.http.get<AreaResponse>(`${this.apiUrl}/${id}`);
  }

  // ── DELETE /api/areas/{id} — requiere ADMINISTRADOR ──────
  // Soft-delete: activa = false
  desactivar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}