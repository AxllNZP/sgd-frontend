// =============================================================
// ciudadano.model.ts
// Mapeado 1:1 con los DTOs del backend
// Fuente: com.mesapartes.sgd.dto.RegistroNaturalRequestDTO
//         com.mesapartes.sgd.dto.RegistroJuridicaRequestDTO
//         com.mesapartes.sgd.dto.RegistroResponseDTO
//         com.mesapartes.sgd.dto.VerificacionCodigoDTO
//         com.mesapartes.sgd.dto.LoginCiudadanoRequestDTO
//         com.mesapartes.sgd.entity.PreguntaSeguridad
//         com.mesapartes.sgd.entity.TipoDocumento
// =============================================================

// ── TipoDocumento ─────────────────────────────────────────────
// Fuente: com.mesapartes.sgd.entity.TipoDocumento
export type TipoDocumento = 'DNI' | 'CARNET_EXTRANJERIA';

// ── PreguntaSeguridad ─────────────────────────────────────────
// Fuente: com.mesapartes.sgd.entity.PreguntaSeguridad (enum Java con 6 valores)
// CORRECCIÓN: el componente mis-datos usaba valores incorrectos:
//   ❌ 'COLEGIO'      → ✅ 'NOMBRE_COLEGIO'
//   ❌ 'MEJOR_AMIGO'  → ✅ 'APODO_INFANCIA'
//   ❌ 'NOMBRE_MADRE' label incorrecto → ✅ '¿Cuál es el primer nombre de tu madre?'
export type PreguntaSeguridad =
  | 'NOMBRE_MASCOTA'
  | 'CIUDAD_NACIMIENTO'
  | 'NOMBRE_COLEGIO'
  | 'NOMBRE_MADRE'
  | 'PELICULA_FAVORITA'
  | 'APODO_INFANCIA';

// Descripción exacta del backend (PreguntaSeguridad.getDescripcion())
// Cero hardcoding: si el backend envía descripcionPregunta en el perfil, usar ese.
// Esta constante solo aplica para formularios de registro/edición.
export const PREGUNTAS_SEGURIDAD: { value: PreguntaSeguridad; label: string }[] = [
  { value: 'NOMBRE_MASCOTA',    label: '¿Cuál es el nombre de tu primera mascota?' },
  { value: 'CIUDAD_NACIMIENTO', label: '¿En qué ciudad naciste?' },
  { value: 'NOMBRE_COLEGIO',    label: '¿Cuál es el nombre de tu colegio de primaria?' },
  { value: 'NOMBRE_MADRE',      label: '¿Cuál es el primer nombre de tu madre?' },
  { value: 'PELICULA_FAVORITA', label: '¿Cuál es tu película favorita?' },
  { value: 'APODO_INFANCIA',    label: '¿Cuál era tu apodo de infancia?' },
];

// ── RegistroNaturalRequestDTO ────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.RegistroNaturalRequestDTO
export interface RegistroNaturalRequest {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;              // @Size(min=8, max=12)
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  telefono: string;
  email: string;                        // @Email
  password: string;                     // @Size(min=8)
  preguntaSeguridad: PreguntaSeguridad;
  respuestaSeguridad: string;
  afiliadoBuzon?: boolean;              // default false en backend
}

// ── RegistroJuridicaRequestDTO ───────────────────────────────
// Fuente: com.mesapartes.sgd.dto.RegistroJuridicaRequestDTO
export interface RegistroJuridicaRequest {
  ruc: string;
  razonSocial: string;
  password: string;                     // @Size(min=8)
  preguntaSeguridad: PreguntaSeguridad;
  respuestaSeguridad: string;
  tipoDocRepresentante: TipoDocumento;
  numDocRepresentante: string;
  nombresRepresentante: string;
  apellidoPaternoRepresentante: string;
  apellidoMaternoRepresentante: string;
  emailRepresentante: string;           // @Email
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  telefono: string;
  afiliadoBuzon?: boolean;              // default false en backend
}

// ── RegistroResponseDTO ──────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.RegistroResponseDTO
export interface RegistroResponse {
  mensaje: string;
  identificador: string;          // DNI o RUC
  tipoPersna: string;             // "NATURAL" | "JURIDICA" — campo con typo intencional del backend
  requiereVerificacion: boolean;
}

// ── VerificacionCodigoDTO ────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.VerificacionCodigoDTO
// Se envía como @RequestBody en POST /api/auth/verificar
export interface VerificacionCodigoRequest {
  tipoPersna: string;       // "NATURAL" | "JURIDICA" — typo intencional del backend
  identificador: string;    // DNI o RUC
  codigo: string;
}

// ── LoginCiudadanoRequestDTO ─────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.LoginCiudadanoRequestDTO
// Se envía como @RequestBody en POST /api/auth/login/ciudadano
export interface LoginCiudadanoRequest {
  tipoPersna: string;       // "NATURAL" | "JURIDICA" — typo intencional del backend
  identificador: string;    // DNI o RUC
  password: string;
}