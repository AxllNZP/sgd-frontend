// =============================================================
// documento.service.ts
// CORRECCIONES:
//   1. URL absoluta → relativa (/api/documentos) — CORS fix
//   2. consultarPorNumeroTramite() — nombre correcto (era obtenerPorNumeroTramite)
//      Fuente: DocumentoController GET /api/documentos/{numeroTramite}
//   3. asignarArea() — RESTAURADO
//      Fuente: DocumentoController PATCH /api/documentos/{numeroTramite}/area/{areaId}
//   4. descargarArchivo() — RESTAURADO
//      Fuente: DocumentoController GET /api/documentos/{numeroTramite}/descargar
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DocumentoResponse,
  DocumentoFiltro,
  CambioEstado,
  PageResponse,
} from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoService {

  // CORRECCIÓN: URL relativa — el proxy reenvía a http://localhost:8080
  private readonly apiUrl = '/api/documentos';

  constructor(private http: HttpClient) {}

  // ── POST /api/documentos (multipart/form-data) ────────────
  // Público — no requiere token
  registrar(formData: FormData): Observable<DocumentoResponse> {
    return this.http.post<DocumentoResponse>(this.apiUrl, formData);
  }

  // ── GET /api/documentos?page=0&size=20&sortBy=fechaHoraRegistro ──
  // Requiere: isAuthenticated()
  listarTodos(page = 0, size = 20, sortBy = 'fechaHoraRegistro'): Observable<PageResponse<DocumentoResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);
    return this.http.get<PageResponse<DocumentoResponse>>(this.apiUrl, { params });
  }

  // ── GET /api/documentos/{numeroTramite} ───────────────────
  // Público — no requiere token
  // NOMBRE EXACTO del método en DocumentoService.java del backend — NO renombrar
  consultarPorNumeroTramite(numeroTramite: string): Observable<DocumentoResponse> {
    return this.http.get<DocumentoResponse>(`${this.apiUrl}/${numeroTramite}`);
  }

  // ── POST /api/documentos/buscar ───────────────────────────
  // Requiere: isAuthenticated()
  buscarPorFiltros(filtro: DocumentoFiltro, page = 0, size = 20): Observable<PageResponse<DocumentoResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.post<PageResponse<DocumentoResponse>>(
      `${this.apiUrl}/buscar`,
      filtro,
      { params }
    );
  }

  // ── PATCH /api/documentos/{numeroTramite}/estado ──────────
  // Requiere: MESA_PARTES o ADMINISTRADOR
  cambiarEstado(numeroTramite: string, cambio: CambioEstado): Observable<DocumentoResponse> {
    return this.http.patch<DocumentoResponse>(
      `${this.apiUrl}/${numeroTramite}/estado`,
      cambio
    );
  }

  // ── PATCH /api/documentos/{numeroTramite}/area/{areaId} ───
  // Requiere: MESA_PARTES o ADMINISTRADOR
  // Fuente: DocumentoController @PatchMapping("/{numeroTramite}/area/{areaId}")
  asignarArea(numeroTramite: string, areaId: string): Observable<DocumentoResponse> {
    return this.http.patch<DocumentoResponse>(
      `${this.apiUrl}/${numeroTramite}/area/${areaId}`,
      {}
    );
  }

  // ── GET /api/documentos/{numeroTramite}/descargar ─────────
  // Requiere: isAuthenticated()
  // Fuente: DocumentoController @GetMapping("/{numeroTramite}/descargar")
  descargarArchivo(numeroTramite: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${numeroTramite}/descargar`, {
      responseType: 'blob'
    });
  }

  // ── GET /api/documentos/{numeroTramite}/descargar-anexo ───
  // Requiere: isAuthenticated()
  descargarAnexo(numeroTramite: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${numeroTramite}/descargar-anexo`, {
      responseType: 'blob'
    });
  }

  // ── GET /api/documentos/{numeroTramite}/cargo ─────────────
  // Público — genera el cargo de recepción en HTML/PDF
  descargarCargo(numeroTramite: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${numeroTramite}/cargo`, {
      responseType: 'blob'
    });
  }
}