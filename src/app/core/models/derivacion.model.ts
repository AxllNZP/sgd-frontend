// =============================================================
// derivacion.model.ts
// Mapeado 1:1 con los DTOs del backend
// Fuente: com.mesapartes.sgd.dto.DerivacionRequestDTO
//         com.mesapartes.sgd.dto.DerivacionResponseDTO
// =============================================================

// ── DerivacionRequestDTO ─────────────────────────────────────
// Se envía como @RequestBody en POST /api/derivaciones/{numeroTramite}
export interface DerivacionRequest {
  areaDestinoId: string;      // UUID del área destino
  motivo: string;
  usuarioResponsable: string;
}

// ── DerivacionResponseDTO ────────────────────────────────────
// CORRECCIONES vs versión anterior:
//   ~ id:              string  (UUID serializado como string en JSON)
//   ~ fechaDerivacion: string  (LocalDateTime → ISO string en JSON)
export interface DerivacionResponse {
  id: string;
  numeroTramite: string;
  areaOrigen: string;         // Nombre del área origen (string, no UUID)
  areaDestino: string;        // Nombre del área destino (string, no UUID)
  motivo: string;
  usuarioResponsable: string;
  fechaDerivacion: string;    // ISO-8601 (LocalDateTime → string en JSON)
}