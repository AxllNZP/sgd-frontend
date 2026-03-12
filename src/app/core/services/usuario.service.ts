// =============================================================
// usuario.service.ts
// CORRECCIÓN CRÍTICA:
//   URL absoluta 'http://localhost:8080/api/usuarios' → '/api/usuarios'
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioRequest, UsuarioResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  // CORRECCIÓN: URL relativa — el proxy reenvía a http://localhost:8080
  private readonly apiUrl = '/api/usuarios';

  constructor(private http: HttpClient) {}

  // ── POST /api/usuarios — requiere ADMINISTRADOR ───────────
  crear(request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.apiUrl, request);
  }

  // ── GET /api/usuarios — requiere ADMINISTRADOR ────────────
  listar(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.apiUrl);
  }

  // ── GET /api/usuarios/{id} — requiere ADMINISTRADOR ───────
  obtenerPorId(id: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  // ── DELETE /api/usuarios/{id} — requiere ADMINISTRADOR ────
  // Soft-delete: activo = false
  desactivar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}