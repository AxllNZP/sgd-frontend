// =============================================================
// recuperacion.model.ts
// Mapeado 1:1 con los DTOs del backend
// Fuente: com.mesapartes.sgd.dto.RecuperacionSolicitarDTO
//         com.mesapartes.sgd.dto.RecuperacionVerificarCodigoDTO
//         com.mesapartes.sgd.dto.NuevaPasswordDTO
//         com.mesapartes.sgd.dto.PreguntaSeguridadResponseDTO
//         com.mesapartes.sgd.dto.VerificarPreguntaDTO
// =============================================================

import { PreguntaSeguridad } from './ciudadano.model';

// ── VÍA A: POST /api/auth/recuperar/solicitar ────────────────
export interface RecuperacionSolicitarRequest {
  tipoPersna: string;         // "NATURAL" | "JURIDICA" — typo intencional del backend
  identificador: string;      // DNI o RUC
  email: string;
}

// ── VÍA A: POST /api/auth/recuperar/verificar-codigo ────────
export interface RecuperacionVerificarCodigoRequest {
  tipoPersna: string;
  identificador: string;
  codigo: string;
}

// ── VÍA B: GET /api/auth/recuperar/pregunta ─────────────────
// ?tipoPersna=NATURAL&identificador=12345678
// Respuesta: PreguntaSeguridadResponseDTO
export interface PreguntaSeguridadResponse {
  pregunta: PreguntaSeguridad;
  descripcion: string;
}

// ── VÍA B: POST /api/auth/recuperar/verificar-pregunta ──────
export interface VerificarPreguntaRequest {
  tipoPersna: string;
  identificador: string;
  preguntaSeguridad: PreguntaSeguridad;
  respuesta: string;
}

// ── PASO FINAL (ambas vías): POST /api/auth/recuperar/nueva-password ──
export interface NuevaPasswordRequest {
  tipoPersna: string;
  identificador: string;
  nuevaPassword: string;
  confirmarPassword: string;
}