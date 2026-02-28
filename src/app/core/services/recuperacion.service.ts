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

  private base = 'http://localhost:8080/api/auth/recuperar';

  constructor(private http: HttpClient) {}

  // ---- VÍA A: CÓDIGO POR CORREO ----

  solicitarCodigo(data: RecuperacionSolicitarRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/solicitar`, data);
  }

  verificarCodigo(data: RecuperacionVerificarCodigoRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/verificar-codigo`, data);
  }

  // ---- VÍA B: PREGUNTA SECRETA ----

  obtenerPregunta(tipoPersna: string, identificador: string): Observable<PreguntaSeguridadResponse> {
    const params = new HttpParams()
      .set('tipoPersna', tipoPersna)
      .set('identificador', identificador);
    return this.http.get<PreguntaSeguridadResponse>(`${this.base}/pregunta`, { params });
  }

  verificarPregunta(data: VerificarPreguntaRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/verificar-pregunta`, data);
  }

  // ---- PASO FINAL (ambas vías) ----

  establecerNuevaPassword(data: NuevaPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/nueva-password`, data);
  }
}