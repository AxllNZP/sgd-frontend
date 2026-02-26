export interface UsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
}

export interface UsuarioResponse {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fechaCreacion: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  rol: string;
  nombre: string;
}

export type RolUsuario = 'CIUDADANO' | 'MESA_PARTES' | 'ADMINISTRADOR';