import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  private base = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // ---- REGISTRO ----

  registrarNatural(data: RegistroNaturalRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.base}/registro/natural`, data);
  }

  registrarJuridica(data: RegistroJuridicaRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.base}/registro/juridica`, data);
  }

  // ---- VERIFICACIÓN EMAIL ----

  verificarCodigo(data: VerificacionCodigoRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/verificar`, data);
  }

  reenviarCodigo(tipoPersna: string, identificador: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/reenviar-codigo?tipoPersna=${tipoPersna}&identificador=${identificador}`,
      {}
    );
  }

  // ---- LOGIN CIUDADANO ----

  login(data: LoginCiudadanoRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login/ciudadano`, data);
  }
}