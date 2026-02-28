// ===== REGISTRO PERSONA NATURAL =====
export interface RegistroNaturalRequest {
  tipoDocumento: 'DNI' | 'CARNET_EXTRANJERIA';
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
  password: string;
  preguntaSeguridad: PreguntaSeguridad;
  respuestaSeguridad: string;
  afiliadoBuzon?: boolean;
}

// ===== REGISTRO PERSONA JURÍDICA =====
export interface RegistroJuridicaRequest {
  ruc: string;
  razonSocial: string;
  password: string;
  preguntaSeguridad: PreguntaSeguridad;
  respuestaSeguridad: string;
  tipoDocRepresentante: 'DNI' | 'CARNET_EXTRANJERIA';
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
  contactosNotificacion?: ContactoNotificacionItem[];
  afiliadoBuzon?: boolean;
}

export interface ContactoNotificacionItem {
  nombres: string;
  email: string;
  activo?: boolean;
}

// ===== RESPUESTA DE REGISTRO =====
export interface RegistroResponse {
  mensaje: string;
  identificador: string;  // DNI o RUC según tipo
  tipoPersna: string;     // "NATURAL" o "JURIDICA"
  requiereVerificacion: boolean;
}

// ===== VERIFICACIÓN DE CÓDIGO =====
export interface VerificacionCodigoRequest {
  tipoPersna: string;     // "NATURAL" o "JURIDICA"
  identificador: string;  // DNI o RUC
  codigo: string;
}

// ===== LOGIN CIUDADANO =====
export interface LoginCiudadanoRequest {
  tipoPersna: string;     // "NATURAL" o "JURIDICA"
  identificador: string;  // DNI o RUC
  password: string;
}

// ===== ENUM PREGUNTAS DE SEGURIDAD =====
export type PreguntaSeguridad =
  | 'NOMBRE_MASCOTA'
  | 'CIUDAD_NACIMIENTO'
  | 'NOMBRE_COLEGIO'
  | 'NOMBRE_MADRE'
  | 'PELICULA_FAVORITA'
  | 'APODO_INFANCIA';

export const PREGUNTAS_SEGURIDAD: { value: PreguntaSeguridad; label: string }[] = [
  { value: 'NOMBRE_MASCOTA',    label: '¿Cuál es el nombre de tu primera mascota?' },
  { value: 'CIUDAD_NACIMIENTO', label: '¿En qué ciudad naciste?' },
  { value: 'NOMBRE_COLEGIO',    label: '¿Cuál es el nombre de tu colegio de primaria?' },
  { value: 'NOMBRE_MADRE',      label: '¿Cuál es el primer nombre de tu madre?' },
  { value: 'PELICULA_FAVORITA', label: '¿Cuál es tu película favorita?' },
  { value: 'APODO_INFANCIA',    label: '¿Cuál era tu apodo de infancia?' },
];