// =============================================================
// ciudadano.service.ts
// CORRECCIONES:
//   1. reenviarCodigo() — CRÍTICO: parámetro era 'tipoPersona', debe ser 'tipoPersna'
//      El backend @RequestParam es "tipoPersna" (typo intencional)
//      Se usa HttpParams para construir la query string correctamente
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RegistroNaturalRequest,
  RegistroJuridicaRequest,
  RegistroResponse,
  VerificacionCodigoRequest,
  LoginCiudadanoRequest,
} from '../models/ciudadano.model';
import { LoginResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class CiudadanoService {

  private readonly base = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // ── POST /api/auth/registro/natural ──────────────────────
  registrarNatural(data: RegistroNaturalRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.base}/registro/natural`, data);
  }

  // ── POST /api/auth/registro/juridica ─────────────────────
  registrarJuridica(data: RegistroJuridicaRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.base}/registro/juridica`, data);
  }

  // ── POST /api/auth/verificar ──────────────────────────────
  // Body: VerificacionCodigoDTO { tipoPersna, identificador, codigo }
  verificarCodigo(data: VerificacionCodigoRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/verificar`, data);
  }

  // ── POST /api/auth/reenviar-codigo?tipoPersna=...&identificador=... ──
  // CORRECCIÓN: el parámetro se llama 'tipoPersna' (NO 'tipoPersona')
  // El backend usa @RequestParam String tipoPersna
  reenviarCodigo(tipoPersna: string, identificador: string): Observable<void> {
    const params = new HttpParams()
      .set('tipoPersna', tipoPersna)       // ← contrato exacto del backend
      .set('identificador', identificador);
    return this.http.post<void>(`${this.base}/reenviar-codigo`, null, { params });
  }

  // ── POST /api/auth/login/ciudadano ────────────────────────
  // Body: LoginCiudadanoRequestDTO { tipoPersna, identificador, password }
  login(data: LoginCiudadanoRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login/ciudadano`, data);
  }
}