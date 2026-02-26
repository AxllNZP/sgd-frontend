export interface DerivacionRequest {
  areaDestinoId: string;
  motivo: string;
  usuarioResponsable: string;
}

export interface DerivacionResponse {
  id: string;
  numeroTramite: string;
  areaOrigen: string;
  areaDestino: string;
  motivo: string;
  usuarioResponsable: string;
  fechaDerivacion: string;
}