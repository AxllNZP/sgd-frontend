export interface RespuestaRequest {
  contenido: string;
  usuarioResponsable: string;
  enviarEmail: boolean;
}

export interface RespuestaResponse {
  id: string;
  numeroTramite: string;
  contenido: string;
  usuarioResponsable: string;
  fechaRespuesta: string;
  enviadoPorEmail: boolean;
}