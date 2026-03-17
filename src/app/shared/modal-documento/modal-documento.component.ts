// =============================================================
// modal-documento.component.ts
// AÑADIDO:
//   + @Input()  descargandoCargo: boolean  — bloquea el botón mientras descarga
//   + @Output() descargar: EventEmitter    — el padre ejecuta la descarga real
//
// ARQUITECTURA: el modal NO inyecta DocumentoService directamente.
// Emite el evento al padre (registro.component) que ya tiene
// descargarCargo() y descargandoCargo implementados.
// Esto mantiene el mismo patrón que (cerrar) y (nuevo).
// =============================================================

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-documento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-documento.component.html',
  styleUrls: ['./modal-documento.component.css']
})
export class ModalDocumentoComponent {

  @Input() numeroTramite: string    = '';
  @Input() emailConfirmacion: string = '';

  // ── NUEVO: controla el estado del botón de descarga ───────
  // El padre (registro.component) maneja el estado real —
  // este Input solo refleja el valor para deshabilitar el botón
  @Input() descargandoCargo: boolean = false;

  @Output() cerrar    = new EventEmitter<void>();
  @Output() nuevo     = new EventEmitter<void>();

  // ── NUEVO: el padre escucha este evento y llama descargarCargo() ──
  @Output() descargar = new EventEmitter<void>();

  isClosing = false;

  cerrarModal(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.cerrar.emit();
      this.isClosing = false;
    }, 250);
  }

  nuevoRegistro(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.nuevo.emit();
      this.isClosing = false;
    }, 250);
  }

  // ── NUEVO: emite al padre sin lógica propia ───────────────
  onDescargar(): void {
    this.descargar.emit();
  }
}
