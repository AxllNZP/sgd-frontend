// =============================================================
// paso-remitente.component.ts
// RESPONSABILIDAD: captura los datos del remitente.
// DUMB: no inyecta servicios. Muta el objeto @Input() form
// directamente via [(ngModel)] — Angular lo permite porque
// los objetos se pasan por referencia, el padre ve los cambios.
// =============================================================

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SoloNumerosDirective } from '../../../../../shared/directives/solo-numeros.directive';
import { RegistroForm } from '../../registro.models';

@Component({
  selector: 'app-paso-remitente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SoloNumerosDirective],
  templateUrl: './paso-remitente.component.html',
  styleUrl: './paso-remitente.component.css'
})
export class PasoRemitenteComponent {
  // El padre pasa su objeto form — ngModel lo muta directamente
  @Input() form!: RegistroForm;
  @Input() tipoPersona: 'NATURAL' | 'JURIDICA' = 'NATURAL';
  @Input() esCiudadanoAutenticado = false;

  dniInvalido = false;

validarDocumento() {
  const valor = this.form.dniRuc || '';

  if (valor.length === 0) {
    this.dniInvalido = false;
    return;
  }

  this.dniInvalido = !(valor.length === 8 || valor.length === 11);
}
estadoDoc: 'idle' | 'loading' | 'ok' | 'error' = 'idle';
tipoDetectado: 'DNI' | 'RUC' | null = null;
timeout: any;

onDocumentoChange() {
  const doc = (this.form.dniRuc || '').trim();

  clearTimeout(this.timeout);

  this.tipoDetectado = null;
  this.estadoDoc = 'idle';

  if (doc.length === 0) return;

  // ✅ VALIDACIÓN REAL (estructura)
  if (doc.length === 8) {
    this.tipoDetectado = 'DNI';
    this.estadoDoc = 'ok';

    // autocompletar (opcional demo)
    this.autocompletarDemo(doc);
  }

  else if (doc.length === 11) {
    this.tipoDetectado = 'RUC';
    this.estadoDoc = 'ok';

    this.autocompletarDemo(doc);
  }

  else {
    this.estadoDoc = 'error';
  }
}
autocompletarDemo(doc: string) {
  this.estadoDoc = 'loading';

  this.timeout = setTimeout(() => {

    // SOLO para demo, no afecta validez
    if (doc === '12345678') {
      this.form.remitente = 'Juan Pérez';
    }
    else if (doc === '20123456789') {
      this.form.remitente = 'Empresa Demo SAC';
    }

    // IMPORTANTE: siempre vuelve a OK
    this.estadoDoc = 'ok';

  }, 500);
}

consultarDocumento(doc: string) {
  this.estadoDoc = 'loading';

  // simulación API real
  this.timeout = setTimeout(() => {

    // FAKE DATA (simula RENIEC / SUNAT)
    if (doc === '12345678') {
      this.form.remitente = 'Juan Pérez';
      this.estadoDoc = 'ok';
    }
    else if (doc === '20123456789') {
      this.form.remitente = 'Empresa Demo SAC';
      this.estadoDoc = 'ok';
    }
    else {
      this.estadoDoc = 'error';
    }

  }, 800);
}


}


