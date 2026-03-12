// =============================================================
// historial.model.ts
// Mapeado 1:1 con HistorialResponseDTO del backend
// Fuente: com.mesapartes.sgd.dto.HistorialResponseDTO
// =============================================================

import { EstadoDocumento } from './documento.model';

// ── HistorialResponseDTO ──────────────────────────────────────
// CORRECCIONES vs versión anterior:
//   ~ id:          string  (UUID serializado como string en JSON)
//   ~ estado:      EstadoDocumento (era 'string' genérico — ahora tipado)
//   ~ fechaCambio: string  (LocalDateTime → ISO string en JSON)
export interface HistorialResponse {
  id: string;
  numeroTramite: string;
  estado: EstadoDocumento;
  observacion: string;
  usuarioResponsable: string;
  fechaCambio: string;    // ISO-8601 (LocalDateTime → string en JSON)
}