// =============================================================
// respuesta.model.ts
// Mapeado 1:1 con los DTOs del backend
// Fuente: com.mesapartes.sgd.dto.RespuestaRequestDTO
//         com.mesapartes.sgd.dto.RespuestaResponseDTO
// =============================================================

// ── RespuestaRequestDTO ──────────────────────────────────────
// Se envía como @RequestBody en POST /api/respuestas/{numeroTramite}
export interface RespuestaRequest {
  contenido: string;
  usuarioResponsable: string;
  enviarEmail: boolean;       // boolean (primitivo en Java) — no opcional
}

// ── RespuestaResponseDTO ─────────────────────────────────────
// CORRECCIONES vs versión anterior:
//   ~ id:             string  (UUID serializado como string en JSON)
//   ~ fechaRespuesta: string  (LocalDateTime → ISO string en JSON)
//   ~ enviadoPorEmail: boolean (era correcto, confirmado)
export interface RespuestaResponse {
  id: string;
  numeroTramite: string;
  contenido: string;
  usuarioResponsable: string;
  fechaRespuesta: string;     // ISO-8601 (LocalDateTime → string en JSON)
  enviadoPorEmail: boolean;
}