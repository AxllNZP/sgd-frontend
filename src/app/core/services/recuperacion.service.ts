// =============================================================
// recuperacion.service.ts
// CORRECCIÓN CRÍTICA:
//   URL absoluta 'http://localhost:8080/api/auth/recuperar' → '/api/auth/recuperar'
//   Razón: CORS — el browser bloquea solicitudes cross-origin a localhost:8080
//   desde localhost:4200. El proxy de Angular resuelve esto con rutas relativas.
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RecuperacionSolicitarRequest,
  RecuperacionVerificarCodigoRequest,
  PreguntaSeguridadResponse,
  VerificarPreguntaRequest,
  NuevaPasswordRequest,
} from '../models/recuperacion.model';

@Injectable({ providedIn: 'root' })
export class RecuperacionService {

  // CORRECCIÓN: URL relativa — el proxy reenvía a http://localhost:8080
  private readonly base = '/api/auth/recuperar';

  constructor(private http: HttpClient) {}

  // ── VÍA A: CÓDIGO POR CORREO ────────────────────────────────

  // POST /api/auth/recuperar/solicitar
  // Body: RecuperacionSolicitarDTO { tipoPersna, identificador, email }
  solicitarCodigo(data: RecuperacionSolicitarRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/solicitar`, data);
  }

  // POST /api/auth/recuperar/verificar-codigo
  // Body: RecuperacionVerificarCodigoDTO { tipoPersna, identificador, codigo }
  verificarCodigo(data: RecuperacionVerificarCodigoRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/verificar-codigo`, data);
  }

  // ── VÍA B: PREGUNTA SECRETA ─────────────────────────────────

  // GET /api/auth/recuperar/pregunta?tipoPersna=...&identificador=...
  obtenerPregunta(tipoPersna: string, identificador: string): Observable<PreguntaSeguridadResponse> {
    const params = new HttpParams()
      .set('tipoPersna', tipoPersna)
      .set('identificador', identificador);
    return this.http.get<PreguntaSeguridadResponse>(`${this.base}/pregunta`, { params });
  }

  // POST /api/auth/recuperar/verificar-pregunta
  verificarPregunta(data: VerificarPreguntaRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/verificar-pregunta`, data);
  }

  // ── PASO FINAL (ambas vías) ─────────────────────────────────

  // POST /api/auth/recuperar/nueva-password
  // Body: NuevaPasswordDTO { tipoPersna, identificador, nuevaPassword, confirmarPassword }
  establecerNuevaPassword(data: NuevaPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/nueva-password`, data);
  }
}