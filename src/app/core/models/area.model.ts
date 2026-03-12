// =============================================================
// area.model.ts
// Mapeado 1:1 con los DTOs del backend
// Fuente: com.mesapartes.sgd.dto.AreaRequestDTO
//         com.mesapartes.sgd.dto.AreaResponseDTO
// =============================================================

// ── AreaRequestDTO ───────────────────────────────────────────
// Se envía como @RequestBody en POST /api/areas
export interface AreaRequest {
  nombre: string;
  descripcion: string;
}

// ── AreaResponseDTO ──────────────────────────────────────────
// CORRECCIONES vs versión anterior:
//   ~ id: string (UUID serializado como string en JSON)
//   (resto de campos ya coincidían)
export interface AreaResponse {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}