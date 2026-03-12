// =============================================================
// documento.model.ts
// Mapeado 1:1 con los DTOs del backend (Spring Boot)
// Fuente de verdad: DocumentoRequestDTO, DocumentoResponseDTO,
//                  CambioEstadoDTO, DocumentoFiltroDTO
// =============================================================

// ── Enum de estados ──────────────────────────────────────────
// Fuente: com.mesapartes.sgd.entity.EstadoDocumento
export type EstadoDocumento =
  | 'RECIBIDO'
  | 'EN_PROCESO'
  | 'OBSERVADO'
  | 'ARCHIVADO';

// ── Wrapper paginado genérico ────────────────────────────────
// Refleja la estructura de org.springframework.data.domain.Page<T>
// que el backend retorna en GET /api/documentos y POST /api/documentos/buscar
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;       // página actual (0-based)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ── DocumentoResponseDTO ─────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.DocumentoResponseDTO
// CORRECCIONES vs versión anterior:
//   + id:                         string (UUID serializado como string en JSON)
//   + tipoPersona:                string   (campo FALTANTE)
//   + numeroDocumentoRemitente:   string   (campo FALTANTE)
//   + numeroFolios:               number   (campo FALTANTE)
//   + nombreArchivoOriginal:      string   (campo FALTANTE)
//   + nombreAnexoOriginal:        string   (campo FALTANTE)
//   + rutaAnexo:                  string   (campo FALTANTE)
//   + emailNotificacionAdicional: string   (campo FALTANTE)
//   + contactosNotificacionIds:   string   (campo FALTANTE — CSV de UUIDs)
//   + areaId:                     string   (UUID serializado como string en JSON)
//   ~ fechaHoraRegistro:          string   (LocalDateTime se serializa como ISO string)
//   ~ estado:                     EstadoDocumento (tipado, antes era string)
export interface DocumentoResponse {
  id: string;
  numeroTramite: string;
  tipoPersona: string;
  remitente: string;
  dniRuc: string;
  asunto: string;
  tipoDocumento: string;
  numeroDocumentoRemitente: string | null;
  numeroFolios: number;
  nombreArchivoOriginal: string | null;
  rutaArchivo: string | null;
  nombreAnexoOriginal: string | null;
  rutaAnexo: string | null;
  fechaHoraRegistro: string;            // ISO-8601 (LocalDateTime → string en JSON)
  estado: EstadoDocumento;
  emailRemitente: string | null;
  emailNotificacionAdicional: string | null;
  contactosNotificacionIds: string | null; // CSV: "uuid1,uuid2"
  areaId: string | null;
  areaNombre: string | null;
}

// ── DocumentoRequestDTO ──────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.DocumentoRequestDTO
// Se envía como @RequestPart("datos") con multipart/form-data
export interface DocumentoRequest {
  tipoPersona: string;                  // "NATURAL" | "JURIDICA"
  remitente: string;
  dniRuc: string;
  tipoDocumento: string;
  numeroDocumentoRemitente?: string;
  numeroFolios: number;                 // @Min(1) @NotNull
  asunto: string;                       // @Size(max=900)
  emailRemitente?: string;
  emailNotificacionAdicional?: string;  // solo Persona Natural
  contactosNotificacionIds?: string[];  // solo Persona Jurídica — array de UUIDs
}

// ── CambioEstadoDTO ──────────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.CambioEstadoDTO
// Se envía como @RequestBody en PATCH /api/documentos/{numeroTramite}/estado
export interface CambioEstado {
  estado: EstadoDocumento;
  observacion: string;
  usuarioResponsable: string;
}

// ── DocumentoFiltroDTO ───────────────────────────────────────
// Fuente: com.mesapartes.sgd.dto.DocumentoFiltroDTO
// Se envía como body en POST /api/documentos/buscar
export interface DocumentoFiltro {
  remitente?: string;
  asunto?: string;
  estado?: EstadoDocumento;
  fechaDesde?: string;    // ISO date string
  fechaHasta?: string;    // ISO date string
}