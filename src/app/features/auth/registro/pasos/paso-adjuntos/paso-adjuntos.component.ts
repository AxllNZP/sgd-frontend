// =============================================================
// paso-adjuntos.component.ts
// RESPONSABILIDAD: selección y validación de archivos adjuntos.
// DUMB: no llama API. Emite los archivos seleccionados al padre.
//
// ¿Por qué emitir File en lugar de mutar? Porque los archivos
// NO son parte del RegistroForm (no son primitivos JSON) —
// el padre los guarda en variables separadas y los añade
// al FormData en confirmarEnvio().
// =============================================================

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paso-adjuntos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paso-adjuntos.component.html',
  styleUrl: './paso-adjuntos.component.css'
})
export class PasoAdjuntosComponent {

  // El padre pasa los nombres actuales para mostrarlos
  @Input() archivoNombre = '';
  @Input() anexoNombre   = '';

  // El padre recibe los archivos para armarlos en FormData
  @Output() archivoSeleccionado = new EventEmitter<File | null>();
  @Output() anexoSeleccionado   = new EventEmitter<File | null>();

  // Estado de validación — local al componente
  errorArchivo = '';
  errorAnexo   = '';

  // Estado de progreso — local al componente
  subiendoArchivo = false;
  progresoArchivo = 0;
  subiendoAnexo   = false;
  progresoAnexo   = 0;

  // ── Handlers de input y drag ────────────────────────────
  onArchivoSeleccionado(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.procesarArchivo(file, 'principal');
  }

  onAnexoSeleccionado(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.procesarArchivo(file, 'anexo');
  }

  onDropArchivo(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.procesarArchivo(file, 'principal');
  }

  onDropAnexo(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.procesarArchivo(file, 'anexo');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  // ── Eliminar archivos ────────────────────────────────────
  eliminarArchivo(event: Event): void {
    event.stopPropagation();
    this.archivoSeleccionado.emit(null);
    this.errorArchivo = '';
  }

  eliminarAnexo(event: Event): void {
    event.stopPropagation();
    this.anexoSeleccionado.emit(null);
    this.errorAnexo = '';
  }

  // ── Helpers ──────────────────────────────────────────────
  getFileSize(nombre: string, bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
  }

  // ── Lógica de validación ─────────────────────────────────
  // Límites según DocumentoServiceImpl del backend:
  //   principal: 50 MB, solo PDF
  //   anexo:     20 MB, PDF / DOC / DOCX / ZIP
  private procesarArchivo(file: File, tipo: 'principal' | 'anexo'): void {
    const maxMB     = tipo === 'principal' ? 50 : 20;
    const extValidas = tipo === 'principal'
      ? ['pdf']
      : ['pdf', 'doc', 'docx', 'zip'];

    const sizeMB  = file.size / (1024 * 1024);
    const ext     = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (sizeMB > maxMB) {
      this.setError(tipo, `El archivo supera los ${maxMB} MB permitidos.`);
      return;
    }
    if (!extValidas.includes(ext)) {
      this.setError(tipo, `Formato no permitido. Use: ${extValidas.join(', ')}.`);
      return;
    }

    // Archivo válido — emitir al padre y simular progreso
    this.setError(tipo, '');
    if (tipo === 'principal') {
      this.archivoSeleccionado.emit(file);
      this.simularProgreso('principal');
    } else {
      this.anexoSeleccionado.emit(file);
      this.simularProgreso('anexo');
    }
  }

  private setError(tipo: 'principal' | 'anexo', msg: string): void {
    if (tipo === 'principal') this.errorArchivo = msg;
    else                      this.errorAnexo   = msg;
  }

  private simularProgreso(tipo: 'principal' | 'anexo'): void {
    let progreso = 0;
    if (tipo === 'principal') this.subiendoArchivo = true;
    else                      this.subiendoAnexo   = true;

    const intervalo = setInterval(() => {
      progreso += 10;
      if (tipo === 'principal') this.progresoArchivo = progreso;
      else                      this.progresoAnexo   = progreso;

      if (progreso >= 100) {
        clearInterval(intervalo);
        if (tipo === 'principal') this.subiendoArchivo = false;
        else                      this.subiendoAnexo   = false;
      }
    }, 100);
  }

  isDragging = false;

onDragLeave(): void {
  this.isDragging = false;
}
}
