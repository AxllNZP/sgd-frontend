// =============================================================
// cuenta.model.ts
// Mapeado 1:1 con los DTOs del backend
// Fuente: com.mesapartes.sgd.dto.PerfilNaturalResponseDTO
//         com.mesapartes.sgd.dto.PerfilJuridicaResponseDTO
//         com.mesapartes.sgd.dto.EditarNaturalRequestDTO
//         com.mesapartes.sgd.dto.EditarJuridicaRequestDTO
//         com.mesapartes.sgd.dto.ContactoNotificacionDTO
//         com.mesapartes.sgd.dto.ContactoNotificacionResponseDTO
//         com.mesapartes.sgd.dto.ToggleContactoDTO
//         com.mesapartes.sgd.dto.CambiarPasswordRequestDTO
// =============================================================

import { PreguntaSeguridad, TipoDocumento } from './ciudadano.model';

// ── PerfilNaturalResponseDTO ─────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.PerfilNaturalResponseDTO
// CORRECCIONES vs versión anterior:
//   ~ id:             string  (UUID → string en JSON)
//   ~ tipoDocumento:  TipoDocumento (tipado, antes era string)
//   ~ preguntaSeguridad: PreguntaSeguridad (tipado)
//   ~ fechaCreacion:  string  (LocalDateTime → ISO string)
//   + departamento, provincia, distrito: campos de solo lectura que estaban
//     en el DTO pero en el componente se mezclaban con los editables
export interface PerfilNaturalResponse {
  id: string;
  // Solo lectura
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  departamento: string;
  provincia: string;
  distrito: string;
  // Editables
  direccion: string;
  telefono: string;
  email: string;
  preguntaSeguridad: PreguntaSeguridad;
  descripcionPregunta: string;          // Texto legible de la pregunta
  afiliadoBuzon: boolean;
  fechaCreacion: string;                // ISO-8601
}

// ── EditarNaturalRequestDTO ──────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.EditarNaturalRequestDTO
// Se envía como @RequestBody en PUT /api/cuenta/natural/{numeroDocumento}
export interface EditarNaturalRequest {
  direccion: string;
  telefono: string;
  email: string;
  preguntaSeguridad: PreguntaSeguridad;
  respuestaSeguridad: string;
}

// ── PerfilJuridicaResponseDTO ────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.PerfilJuridicaResponseDTO
// CORRECCIONES vs versión anterior:
//   ~ id:                   string  (UUID → string en JSON)
//   ~ preguntaSeguridad:    PreguntaSeguridad (tipado)
//   ~ tipoDocRepresentante: TipoDocumento (tipado, antes era string)
//   ~ fechaCreacion:        string  (LocalDateTime → ISO string)
export interface PerfilJuridicaResponse {
  id: string;
  // Solo lectura
  ruc: string;
  razonSocial: string;
  preguntaSeguridad: PreguntaSeguridad;
  descripcionPregunta: string;
  tipoDocRepresentante: TipoDocumento;
  numDocRepresentante: string;
  nombresRepresentante: string;
  apellidoPaternoRepresentante: string;
  apellidoMaternoRepresentante: string;
  emailRepresentante: string;
  // Editables
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  telefono: string;
  afiliadoBuzon: boolean;
  fechaCreacion: string;                // ISO-8601
  contactosNotificacion: ContactoNotificacionResponse[];
}

// ── EditarJuridicaRequestDTO ─────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.EditarJuridicaRequestDTO
// Se envía como @RequestBody en PUT /api/cuenta/juridica/{ruc}
export interface EditarJuridicaRequest {
  direccion: string;
  telefono: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

// ── ContactoNotificacionDTO ───────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.ContactoNotificacionDTO
// Se envía como @RequestBody en POST /api/cuenta/juridica/{ruc}/contactos
export interface ContactoNotificacionRequest {
  nombres: string;
  email: string;
}

// ── ContactoNotificacionResponseDTO ─────────────────────────
// Fuente: com.mesapartes.sgd.dto.ContactoNotificacionResponseDTO
// CORRECCIONES:
//   ~ id: string (UUID → string en JSON)
export interface ContactoNotificacionResponse {
  id: string;
  nombres: string;
  email: string;
  activo: boolean;
}

// ── ToggleContactoDTO ────────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.ToggleContactoDTO
// Se envía como @RequestBody en PATCH /api/cuenta/juridica/{ruc}/contactos/{contactoId}/estado
export interface ToggleContactoRequest {
  activo: boolean;
}

// ── CambiarPasswordRequestDTO ────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.CambiarPasswordRequestDTO
// Se envía como @RequestBody en POST /api/cuenta/cambiar-password
export interface CambiarPasswordRequest {
  tipoPersna: string;         // "NATURAL" | "JURIDICA" — typo intencional del backend
  identificador: string;      // DNI o RUC
  passwordActual: string;
  nuevaPassword: string;
  confirmarPassword: string;
}