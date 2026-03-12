// =============================================================
// ciudadano.service.ts
// CORRECCIÓN CRÍTICA:
//   URL absoluta 'http://localhost:8080/api/auth' → '/api/auth'
//   El proxy de Angular (proxy.conf.json) reenvía /api/** a
//   http://localhost:8080. Sin la URL relativa, el browser
//   lanza un error de CORS porque el origen es localhost:4200
//   vs localhost:8080 — Postman no tiene esta restricción.
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

  // CORRECCIÓN: URL relativa — el proxy reenvía a http://localhost:8080
  private readonly base = '/api/auth';

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
  // El backend usa @RequestParam String tipoPersna (typo intencional — NO corregir)
  reenviarCodigo(tipoPersna: string, identificador: string): Observable<void> {
    const params = new HttpParams()
      .set('tipoPersna', tipoPersna)
      .set('identificador', identificador);
    return this.http.post<void>(`${this.base}/reenviar-codigo`, null, { params });
  }

  // ── POST /api/auth/login/ciudadano ────────────────────────
  // Body: LoginCiudadanoRequestDTO { tipoPersna, identificador, password }
  login(data: LoginCiudadanoRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login/ciudadano`, data);
  }
}