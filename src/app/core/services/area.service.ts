import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AreaRequest, AreaResponse } from '../models/area.model';

@Injectable({ providedIn: 'root' })
export class AreaService {

  private apiUrl = 'http://localhost:8080/api/areas';

  constructor(private http: HttpClient) {}

  crear(request: AreaRequest): Observable<AreaResponse> {
    return this.http.post<AreaResponse>(this.apiUrl, request);
  }

  listar(): Observable<AreaResponse[]> {
    return this.http.get<AreaResponse[]>(this.apiUrl);
  }

  obtenerPorId(id: string): Observable<AreaResponse> {
    return this.http.get<AreaResponse>(`${this.apiUrl}/${id}`);
  }

  desactivar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}