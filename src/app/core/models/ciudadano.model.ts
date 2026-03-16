// =============================================================
// ciudadano.model.ts — ACTUALIZADO
// Mapeado 1:1 con los DTOs del backend (Spring Boot)
//
// CAMBIOS vs versión anterior:
//   + ContactoNotificacionRegistro — nuevo tipo local
//     para RegistroJuridicaRequestDTO.contactosNotificacion
//     Fuente: com.mesapartes.sgd.dto.ContactoNotificacionDTO
//   + RegistroJuridicaRequest ahora incluye contactosNotificacion
//     con el tipo correcto en lugar de omitirlo
// =============================================================

// ── TipoDocumento ─────────────────────────────────────────────
// Fuente: com.mesapartes.sgd.entity.TipoDocumento
export type TipoDocumento = 'DNI' | 'CARNET_EXTRANJERIA';

// ── PreguntaSeguridad ─────────────────────────────────────────
// Fuente: com.mesapartes.sgd.entity.PreguntaSeguridad
export type PreguntaSeguridad =
  | 'NOMBRE_MASCOTA'
  | 'CIUDAD_NACIMIENTO'
  | 'NOMBRE_COLEGIO'
  | 'NOMBRE_MADRE'
  | 'PELICULA_FAVORITA'
  | 'APODO_INFANCIA';

// Etiquetas para los formularios de registro/edición.
// 📚 LECCIÓN "Cero Hardcoding": esta constante es la única
// fuente de verdad de las labels. Si agregas una pregunta nueva
// al enum de Java, la agregas aquí y se propaga en toda la UI.
export const PREGUNTAS_SEGURIDAD: { value: PreguntaSeguridad; label: string }[] = [
  { value: 'NOMBRE_MASCOTA',    label: '¿Cuál es el nombre de tu primera mascota?' },
  { value: 'CIUDAD_NACIMIENTO', label: '¿En qué ciudad naciste?' },
  { value: 'NOMBRE_COLEGIO',    label: '¿Cuál es el nombre de tu colegio de primaria?' },
  { value: 'NOMBRE_MADRE',      label: '¿Cuál es el primer nombre de tu madre?' },
  { value: 'PELICULA_FAVORITA', label: '¿Cuál es tu película favorita?' },
  { value: 'APODO_INFANCIA',    label: '¿Cuál era tu apodo de infancia?' },
];

// ── ContactoNotificacionRegistro ──────────────────────────────
// Fuente: com.mesapartes.sgd.dto.ContactoNotificacionDTO
// Usado SOLO en el formulario de registro jurídica como ítem
// del array contactosNotificacion dentro de RegistroJuridicaRequestDTO.
// 📚 LECCIÓN: este tipo es distinto a ContactoNotificacionResponse
// (que es la respuesta del servidor con id y fecha). Este es el
// DTO de *entrada* — solo nombres, email y activo.
export interface ContactoNotificacionRegistro {
  nombres: string;
  email:   string;
  activo:  boolean;   // siempre true al crear
}

// ── RegistroNaturalRequestDTO ─────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.RegistroNaturalRequestDTO
export interface RegistroNaturalRequest {
  tipoDocumento:      TipoDocumento;
  numeroDocumento:    string;         // @Size(min=8, max=12)
  nombres:            string;
  apellidoPaterno:    string;
  apellidoMaterno:    string;
  departamento:       string;
  provincia:          string;
  distrito:           string;
  direccion:          string;
  telefono:           string;
  email:              string;         // @Email
  password:           string;         // @Size(min=8)
  preguntaSeguridad:  PreguntaSeguridad;
  respuestaSeguridad: string;
  afiliadoBuzon?:     boolean;        // default false en backend
}

// ── RegistroJuridicaRequestDTO ────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.RegistroJuridicaRequestDTO
export interface RegistroJuridicaRequest {
  ruc:                          string;               // @Size(min=11, max=11)
  razonSocial:                  string;
  password:                     string;               // @Size(min=8)
  preguntaSeguridad:            PreguntaSeguridad;
  respuestaSeguridad:           string;
  tipoDocRepresentante:         TipoDocumento;
  numDocRepresentante:          string;
  nombresRepresentante:         string;
  apellidoPaternoRepresentante: string;
  apellidoMaternoRepresentante: string;
  emailRepresentante:           string;               // @Email
  departamento:                 string;
  provincia:                    string;
  distrito:                     string;
  direccion:                    string;
  telefono:                     string;
  // CAMPO AÑADIDO: mapeado desde ContactoNotificacionDTO del backend
  // El backend usa @Valid List<ContactoNotificacionDTO> — puede ser vacío
  contactosNotificacion:        ContactoNotificacionRegistro[];
  afiliadoBuzon?:               boolean;              // default false en backend
}

// ── RegistroResponseDTO ───────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.RegistroResponseDTO
export interface RegistroResponse {
  mensaje:              string;
  identificador:        string;   // DNI o RUC
  tipoPersna:           string;   // "NATURAL" | "JURIDICA" — typo intencional del backend
  requiereVerificacion: boolean;
}

// ── VerificacionCodigoDTO ─────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.VerificacionCodigoDTO
export interface VerificacionCodigoRequest {
  tipoPersna:   string;   // "NATURAL" | "JURIDICA" — typo intencional del backend
  identificador: string;
  codigo:        string;
}

// ── LoginCiudadanoRequestDTO ──────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.LoginCiudadanoRequestDTO
export interface LoginCiudadanoRequest {
  tipoPersna:    string;   // "NATURAL" | "JURIDICA" — typo intencional del backend
  identificador: string;
  password:      string;
}
