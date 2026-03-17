// =============================================================
// paso-documento.component.ts
// RESPONSABILIDAD: captura tipo de documento, asunto y folios.
// DUMB: muta form vía ngModel por referencia.
// El custom select (selectOpen/selectTipo) vive aquí porque
// solo afecta a este campo — no pertenece al padre.
// =============================================================

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroForm } from '../../registro.models';

@Component({
  selector: 'app-paso-documento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paso-documento.component.html',
  styleUrl: './paso-documento.component.css'
})
export class PasoDocumentoComponent {
  @Input() form!: RegistroForm;

  readonly tiposDocumento = [
    { label: 'Solicitud', value: 'SOLICITUD' },
    { label: 'Informe',   value: 'INFORME' },
    { label: 'Oficio',    value: 'OFICIO' },
    { label: 'Memorando', value: 'MEMORANDO' },
    { label: 'Carta',     value: 'CARTA' }
  ];

  selectOpen = false;

  // =========================
  // SELECT CONTROL
  // =========================

  toggleSelect(): void {
    this.selectOpen = !this.selectOpen;
  }

  selectTipo(valor: string): void {
    this.form.tipoDocumento = valor;
    this.selectOpen = false;
  }

  // =========================
  // UX / VALIDACIÓN
  // =========================

  getLabelSeleccionado(): string | null {
    const found = this.tiposDocumento.find(t => t.value === this.form.tipoDocumento);
    return found ? found.label : null;
  }

  get tipoInvalido(): boolean {
    return !this.form.tipoDocumento;
  }

  // =========================
  // CONTROL GLOBAL (OPCIONAL PERO LISTO)
  // =========================

  esValido(): boolean {
    return !!(
      this.form.tipoDocumento &&
      this.form.asunto &&
      this.form.asunto.length >= 5 &&
      this.form.numeroFolios &&
      this.form.numeroFolios >= 1 &&
      this.form.numeroFolios <= 999
    );
  }
}
