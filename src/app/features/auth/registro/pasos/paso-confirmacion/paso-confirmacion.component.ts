// =============================================================
// paso-confirmacion.component.ts
// RESPONSABILIDAD: muestra el resumen de etapa 2 y los botones
// "Confirmar envío" y "Corregir datos".
// DUMB: solo recibe datos vía @Input y emite acciones vía @Output.
// =============================================================

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroForm } from '../../registro.models';

@Component({
  selector: 'app-paso-confirmacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paso-confirmacion.component.html',
  styleUrl: './paso-confirmacion.component.css'
})
export class PasoConfirmacionComponent {
  @Input() form!: RegistroForm;
  @Input() archivoNombre = '';
  @Input() anexoNombre   = '';
  @Input() cargando      = false;
  @Input() error         = '';

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar  = new EventEmitter<void>();
  getTipoPersona(): string {
  if (!this.form.dniRuc) return '—';
  return this.form.dniRuc.length === 11 ? 'Jurídica' : 'Natural';
}

getTipoDocumentoLabel(): string {
  const map: Record<string, string> = {
    SOLICITUD: 'Solicitud',
    INFORME: 'Informe',
    OFICIO: 'Oficio',
    MEMORANDO: 'Memorando',
    CARTA: 'Carta'
  };

  return this.form.tipoDocumento
    ? map[this.form.tipoDocumento] || this.form.tipoDocumento
    : '—';
}

formValido(): boolean {
  return !!(
    this.form.remitente &&
    this.form.dniRuc &&
    (this.form.dniRuc.length === 8 || this.form.dniRuc.length === 11) &&
    this.form.tipoDocumento &&
    this.form.asunto &&
    this.form.asunto.length >= 5 &&
    this.form.numeroFolios &&
    this.form.numeroFolios >= 1 &&
    this.form.numeroFolios <= 999 &&
    this.form.emailRemitente &&
    this.archivoNombre // 🔥 CRÍTICO: archivo obligatorio
  );
}
}
