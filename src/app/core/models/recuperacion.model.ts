import { PreguntaSeguridad } from './ciudadano.model';

// ===== VÍA A: RECUPERACIÓN POR CORREO =====

export interface RecuperacionSolicitarRequest {
  tipoPersna: string;     // "NATURAL" o "JURIDICA"
  identificador: string;  // DNI o RUC
  email: string;
}

export interface RecuperacionVerificarCodigoRequest {
  tipoPersna: string;
  identificador: string;
  codigo: string;
}

// ===== VÍA B: RECUPERACIÓN POR PREGUNTA SECRETA =====

export interface PreguntaSeguridadResponse {
  pregunta: PreguntaSeguridad;
  descripcion: string;    // Texto legible de la pregunta
}

export interface VerificarPreguntaRequest {
  tipoPersna: string;
  identificador: string;
  preguntaSeguridad: PreguntaSeguridad;
  respuesta: string;
}

// ===== PASO FINAL (ambas vías) =====

export interface NuevaPasswordRequest {
  tipoPersna: string;
  identificador: string;
  nuevaPassword: string;
  confirmarPassword: string;
}