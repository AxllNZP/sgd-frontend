export interface AreaRequest {
  nombre: string;
  descripcion: string;
}

export interface AreaResponse {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}