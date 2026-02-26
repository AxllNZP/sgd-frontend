import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DocumentoResponse,
  DocumentoFiltro,
  CambioEstado
} from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoService {

  private apiUrl = 'http://localhost:8080/api/documentos';

  constructor(private http: HttpClient) {}

  registrar(formData: FormData): Observable<DocumentoResponse> {
    return this.http.post<DocumentoResponse>(this.apiUrl, formData);
  }

  listarTodos(): Observable<DocumentoResponse[]> {
    return this.http.get<DocumentoResponse[]>(this.apiUrl);
  }

  consultarPorNumeroTramite(numeroTramite: string): Observable<DocumentoResponse> {
    return this.http.get<DocumentoResponse>(`${this.apiUrl}/${numeroTramite}`);
  }

  listarPorEstado(estado: string): Observable<DocumentoResponse[]> {
    return this.http.get<DocumentoResponse[]>(`${this.apiUrl}/estado/${estado}`);
  }

  cambiarEstado(numeroTramite: string, cambio: CambioEstado): Observable<DocumentoResponse> {
    return this.http.patch<DocumentoResponse>(`${this.apiUrl}/${numeroTramite}/estado`, cambio);
  }

  asignarArea(numeroTramite: string, areaId: string): Observable<DocumentoResponse> {
    return this.http.patch<DocumentoResponse>(`${this.apiUrl}/${numeroTramite}/area/${areaId}`, {});
  }

  buscarPorFiltros(filtro: DocumentoFiltro): Observable<DocumentoResponse[]> {
    return this.http.post<DocumentoResponse[]>(`${this.apiUrl}/buscar`, filtro);
  }

  descargarArchivo(numeroTramite: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${numeroTramite}/descargar`, { responseType: 'blob' });
  }
}