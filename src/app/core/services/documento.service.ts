// =============================================================
// documento.service.ts
// CORRECCIONES:
//   1. listarTodos() → retorna Observable<PageResponse<DocumentoResponse>>
//      El backend GET /api/documentos retorna Page<DocumentoResponseDTO>
//      con query params: ?page=0&size=20&sortBy=fechaHoraRegistro
//   2. buscarPorFiltros() → POST /api/documentos/buscar con body DocumentoFiltro
//      Retorna Page<DocumentoResponseDTO>  (no List)
//      El endpoint es POST, no GET
//   3. listarPorEstado() → ELIMINADO: no existe en el backend
//      El backend NO tiene GET /api/documentos/estado/{estado}
//      Usar buscarPorFiltros con { estado: 'X' } en su lugar
//   4. descargarAnexo() → AÑADIDO: GET /api/documentos/{numeroTramite}/descargar-anexo
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DocumentoResponse,
  DocumentoFiltro,
  DocumentoRequest,
  CambioEstado,
  PageResponse,
} from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoService {

  private readonly apiUrl = 'http://localhost:8080/api/documentos';

  constructor(private http: HttpClient) {}

  // ── POST /api/documentos (multipart/form-data) ────────────
  // Público — no requiere token
  registrar(formData: FormData): Observable<DocumentoResponse> {
    return this.http.post<DocumentoResponse>(this.apiUrl, formData);
  }

  // ── GET /api/documentos?page=0&size=20&sortBy=fechaHoraRegistro ──
  // Requiere autenticación (isAuthenticated())
  // CORRECCIÓN: retorna PageResponse<DocumentoResponse>, no DocumentoResponse[]
  listarTodos(
    page = 0,
    size = 20,
    sortBy = 'fechaHoraRegistro'
  ): Observable<PageResponse<DocumentoResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);
    return this.http.get<PageResponse<DocumentoResponse>>(this.apiUrl, { params });
  }

  // ── GET /api/documentos/{numeroTramite} ───────────────────
  // Público — no requiere token
  consultarPorNumeroTramite(numeroTramite: string): Observable<DocumentoResponse> {
    return this.http.get<DocumentoResponse>(`${this.apiUrl}/${numeroTramite}`);
  }

  // ── PATCH /api/documentos/{numeroTramite}/estado ──────────
  // Requiere rol MESA_PARTES o ADMINISTRADOR
  cambiarEstado(
    numeroTramite: string,
    cambio: CambioEstado
  ): Observable<DocumentoResponse> {
    return this.http.patch<DocumentoResponse>(
      `${this.apiUrl}/${numeroTramite}/estado`,
      cambio
    );
  }

  // ── PATCH /api/documentos/{numeroTramite}/area/{areaId} ───
  // Requiere rol MESA_PARTES o ADMINISTRADOR
  asignarArea(
    numeroTramite: string,
    areaId: string
  ): Observable<DocumentoResponse> {
    return this.http.patch<DocumentoResponse>(
      `${this.apiUrl}/${numeroTramite}/area/${areaId}`,
      {}
    );
  }

  // ── POST /api/documentos/buscar ───────────────────────────
  // CORRECCIÓN: era GET, debe ser POST con body
  // CORRECCIÓN: retorna PageResponse<DocumentoResponse>, no DocumentoResponse[]
  // Requiere autenticación
  buscarPorFiltros(
    filtro: DocumentoFiltro,
    page = 0,
    size = 20,
    sortBy = 'fechaHoraRegistro'
  ): Observable<PageResponse<DocumentoResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);
    return this.http.post<PageResponse<DocumentoResponse>>(
      `${this.apiUrl}/buscar`,
      filtro,
      { params }
    );
  }

  // ── GET /api/documentos/{numeroTramite}/descargar ─────────
  // Requiere autenticación
  descargarArchivo(numeroTramite: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${numeroTramite}/descargar`,
      { responseType: 'blob' }
    );
  }

  // ── GET /api/documentos/{numeroTramite}/descargar-anexo ───
  // Requiere autenticación
  descargarAnexo(numeroTramite: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${numeroTramite}/descargar-anexo`,
      { responseType: 'blob' }
    );
  }

  // ── GET /api/documentos/{numeroTramite}/cargo ─────────────
  // Público — no requiere token
  // Retorna HTML como bytes (Content-Type: text/html)
  generarCargo(numeroTramite: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${numeroTramite}/cargo`,
      { responseType: 'blob' }
    );
  }
}