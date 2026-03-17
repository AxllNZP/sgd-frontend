// admin-ciudadanos.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CiudadanoNaturalResumen,
  CiudadanoJuridicaResumen,
  CiudadanoFiltro,
  EstadisticasCiudadanos,
} from '../models/ciudadano-admin.model';
import { PageResponse } from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class AdminCiudadanosService {

  private readonly base = '/api/admin/ciudadanos';

  constructor(private http: HttpClient) {}

  // ── Estadísticas ─────────────────────────────────────────
  estadisticas(): Observable<EstadisticasCiudadanos> {
    return this.http.get<EstadisticasCiudadanos>(`${this.base}/estadisticas`);
  }

  // ── Listar ───────────────────────────────────────────────
  listarNaturales(page = 0, size = 20): Observable<PageResponse<CiudadanoNaturalResumen>> {
    const params = new HttpParams()
      .set('page', page).set('size', size);
    return this.http.get<PageResponse<CiudadanoNaturalResumen>>(
      `${this.base}/naturales`, { params });
  }

  listarJuridicas(page = 0, size = 20): Observable<PageResponse<CiudadanoJuridicaResumen>> {
    const params = new HttpParams()
      .set('page', page).set('size', size);
    return this.http.get<PageResponse<CiudadanoJuridicaResumen>>(
      `${this.base}/juridicas`, { params });
  }

  // ── Buscar ───────────────────────────────────────────────
  buscarNaturales(filtro: CiudadanoFiltro, page = 0, size = 20): Observable<PageResponse<CiudadanoNaturalResumen>> {
    const params = new HttpParams()
      .set('page', page).set('size', size);
    return this.http.post<PageResponse<CiudadanoNaturalResumen>>(
      `${this.base}/naturales/buscar`, filtro, { params });
  }

  buscarJuridicas(filtro: CiudadanoFiltro, page = 0, size = 20): Observable<PageResponse<CiudadanoJuridicaResumen>> {
    const params = new HttpParams()
      .set('page', page).set('size', size);
    return this.http.post<PageResponse<CiudadanoJuridicaResumen>>(
      `${this.base}/juridicas/buscar`, filtro, { params });
  }

  // ── Toggle estado ────────────────────────────────────────
  toggleNatural(numeroDocumento: string, activo: boolean): Observable<CiudadanoNaturalResumen> {
    const params = new HttpParams().set('activo', activo);
    return this.http.patch<CiudadanoNaturalResumen>(
      `${this.base}/naturales/${numeroDocumento}/estado`, {}, { params });
  }

  toggleJuridica(ruc: string, activo: boolean): Observable<CiudadanoJuridicaResumen> {
    const params = new HttpParams().set('activo', activo);
    return this.http.patch<CiudadanoJuridicaResumen>(
      `${this.base}/juridicas/${ruc}/estado`, {}, { params });
  }

  // ── Eliminar ─────────────────────────────────────────────
  eliminarNatural(numeroDocumento: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/naturales/${numeroDocumento}`);
  }

  eliminarJuridica(ruc: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/juridicas/${ruc}`);
  }
}
