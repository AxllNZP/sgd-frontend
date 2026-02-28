import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PerfilNaturalResponse,
  EditarNaturalRequest,
  PerfilJuridicaResponse,
  EditarJuridicaRequest,
  ContactoNotificacionRequest,
  ContactoNotificacionResponse,
  ToggleContactoRequest,
  CambiarPasswordRequest,
} from '../models/cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {

  private base = 'http://localhost:8080/api/cuenta';

  constructor(private http: HttpClient) {}

  // ---- PERFIL NATURAL ----

  getPerfilNatural(numeroDocumento: string): Observable<PerfilNaturalResponse> {
    return this.http.get<PerfilNaturalResponse>(`${this.base}/natural/${numeroDocumento}`);
  }

  editarPerfilNatural(numeroDocumento: string, data: EditarNaturalRequest): Observable<PerfilNaturalResponse> {
    return this.http.put<PerfilNaturalResponse>(`${this.base}/natural/${numeroDocumento}`, data);
  }

  // ---- PERFIL JURÍDICO ----

  getPerfilJuridica(ruc: string): Observable<PerfilJuridicaResponse> {
    return this.http.get<PerfilJuridicaResponse>(`${this.base}/juridica/${ruc}`);
  }

  editarPerfilJuridica(ruc: string, data: EditarJuridicaRequest): Observable<PerfilJuridicaResponse> {
    return this.http.put<PerfilJuridicaResponse>(`${this.base}/juridica/${ruc}`, data);
  }

  // ---- CONTACTOS DE NOTIFICACIÓN (solo jurídica) ----

  listarContactos(ruc: string): Observable<ContactoNotificacionResponse[]> {
    return this.http.get<ContactoNotificacionResponse[]>(
      `${this.base}/juridica/${ruc}/contactos`
    );
  }

  agregarContacto(ruc: string, data: ContactoNotificacionRequest): Observable<ContactoNotificacionResponse> {
    return this.http.post<ContactoNotificacionResponse>(
      `${this.base}/juridica/${ruc}/contactos`, data
    );
  }

  toggleContacto(ruc: string, contactoId: string, activo: boolean): Observable<ContactoNotificacionResponse> {
    return this.http.patch<ContactoNotificacionResponse>(
      `${this.base}/juridica/${ruc}/contactos/${contactoId}/estado`,
      { activo } as ToggleContactoRequest
    );
  }

  eliminarContacto(ruc: string, contactoId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/juridica/${ruc}/contactos/${contactoId}`
    );
  }

  // ---- CAMBIAR CONTRASEÑA ----

  cambiarPassword(data: CambiarPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/cambiar-password`, data);
  }
}