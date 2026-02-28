import { PreguntaSeguridad } from './ciudadano.model';

// ===== PERFIL PERSONA NATURAL =====
export interface PerfilNaturalResponse {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  telefono: string;
  email: string;
  preguntaSeguridad: PreguntaSeguridad;
  descripcionPregunta: string;
  afiliadoBuzon: boolean;
  fechaCreacion: string;
}

export interface EditarNaturalRequest {
  direccion: string;
  telefono: string;
  email: string;
  preguntaSeguridad: PreguntaSeguridad;
  respuestaSeguridad: string;
}

// ===== PERFIL PERSONA JURÍDICA =====
export interface PerfilJuridicaResponse {
  id: string;
  ruc: string;
  razonSocial: string;
  preguntaSeguridad: PreguntaSeguridad;
  descripcionPregunta: string;
  tipoDocRepresentante: string;
  numDocRepresentante: string;
  nombresRepresentante: string;
  apellidoPaternoRepresentante: string;
  apellidoMaternoRepresentante: string;
  emailRepresentante: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  telefono: string;
  afiliadoBuzon: boolean;
  fechaCreacion: string;
  contactosNotificacion: ContactoNotificacionResponse[];
}

export interface EditarJuridicaRequest {
  direccion: string;
  telefono: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

// ===== CONTACTOS DE NOTIFICACIÓN =====
export interface ContactoNotificacionRequest {
  nombres: string;
  email: string;
  activo?: boolean;
}

export interface ContactoNotificacionResponse {
  id: string;
  nombres: string;
  email: string;
  activo: boolean;
}

export interface ToggleContactoRequest {
  activo: boolean;
}

// ===== CAMBIAR CONTRASEÑA =====
export interface CambiarPasswordRequest {
  tipoPersna: string;       // "NATURAL" o "JURIDICA"
  identificador: string;    // DNI o RUC
  passwordActual: string;
  nuevaPassword: string;
  confirmarPassword: string;
}