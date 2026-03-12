// =============================================================
// auth.service.ts
// CORRECCIONES:
//   1. login() — URL corregida a /api/auth/login (staff interno)
//      Era '/api/auth/login' pero faltaba persistir tipoPersna/identificador
//   2. loginCiudadano() — AÑADIDO: POST /api/auth/login/ciudadano
//      El componente LoginCiudadanoComponent usaba HttpClient directo
//      sin pasar por el servicio. Ahora centralizado aquí.
//   3. getNombre(), getRol(), etc. — sin cambios, ya eran correctos
// =============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse } from '../models/usuario.model';
import { LoginCiudadanoRequest } from '../models/ciudadano.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // ── POST /api/auth/login ──────────────────────────────────
  // Para usuarios internos: MESA_PARTES, ADMINISTRADOR
  // Body: LoginRequestDTO { email, password }
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('email', response.email);
        localStorage.setItem('rol', response.rol);
        localStorage.setItem('nombre', response.nombre);
      })
    );
  }

  // ── POST /api/auth/login/ciudadano ────────────────────────
  // Para ciudadanos: NATURAL o JURIDICA
  // Body: LoginCiudadanoRequestDTO { tipoPersna, identificador, password }
  // NOTA: 'tipoPersna' con typo es el contrato real del backend — NO corregir
  loginCiudadano(
    request: LoginCiudadanoRequest,
    identificador: string
  ): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login/ciudadano`,
      request
    ).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('email', response.email);
        localStorage.setItem('rol', response.rol);
        localStorage.setItem('nombre', response.nombre);
        localStorage.setItem('tipoPersna', request.tipoPersna);
        localStorage.setItem('identificador', identificador);
      })
    );
  }

  logout(): void {
    localStorage.clear();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getRol(): string {
    return localStorage.getItem('rol') || '';
  }

  getNombre(): string {
    return localStorage.getItem('nombre') || '';
  }

  getEmail(): string {
    return localStorage.getItem('email') || '';
  }

  getTipoPersna(): string {
    return localStorage.getItem('tipoPersna') || '';
  }

  getIdentificador(): string {
    return localStorage.getItem('identificador') || '';
  }
}