export interface DocumentoRequest {
  remitente: string;
  dniRuc: string;
  asunto: string;
  tipoDocumento: string;
  emailRemitente: string;
}

export interface DocumentoResponse {
  id: string;
  numeroTramite: string;
  remitente: string;
  dniRuc: string;
  asunto: string;
  tipoDocumento: string;
  rutaArchivo: string;
  fechaHoraRegistro: string;
  estado: EstadoDocumento;
  emailRemitente: string;
  areaId: string;
  areaNombre: string;
}

export interface DocumentoFiltro {
  remitente?: string;
  asunto?: string;
  estado?: EstadoDocumento;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CambioEstado {
  estado: EstadoDocumento;
  observacion: string;
  usuarioResponsable: string;
}

export type EstadoDocumento = 'RECIBIDO' | 'EN_PROCESO' | 'OBSERVADO' | 'ARCHIVADO';