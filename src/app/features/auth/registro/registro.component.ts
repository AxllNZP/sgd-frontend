import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SoloNumerosDirective } from '../../../shared/directives/solo-numeros.directive';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, SoloNumerosDirective],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {

  // ── Control de etapas ──────────────────────────────────────
  // 1 = Etapa 1 (formulario)
  // 2 = Etapa 2 (confirmación)
  etapa: 1 | 2 = 1;

  // ── Control del modal de resultado ────────────────────────
  mostrarModal = false;

  // ── Formulario ────────────────────────────────────────────
  form = {
    remitente: '',
    dniRuc: '',
    emailRemitente: '',
    asunto: '',
    tipoDocumento: '',
    numeroFolios: 1
  };

  tiposDocumento = [
    { label: 'Solicitud',  value: 'SOLICITUD'  },
    { label: 'Informe',    value: 'INFORME'    },
    { label: 'Oficio',     value: 'OFICIO'     },
    { label: 'Memorando',  value: 'MEMORANDO'  },
    { label: 'Carta',      value: 'CARTA'      }
  ];

  // ── Archivos ──────────────────────────────────────────────
  archivo: File | null = null;
  archivoNombre = '';
  anexo: File | null = null;
  anexoNombre = '';

  // ── Estado ────────────────────────────────────────────────
  error = '';
  cargando = false;
  numeroTramite = '';
  emailConfirmacion = '';

  constructor(private http: HttpClient) {}

  // ── Selección de archivos ──────────────────────────────────
  onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivo = file;
      this.archivoNombre = file.name;
    }
  }

  onAnexoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.anexo = file;
      this.anexoNombre = file.name;
    }
  }

  // ── Detectar tipo de persona por longitud del DNI/RUC ─────
  private detectarTipoPersona(): string {
    return this.form.dniRuc.length === 11 ? 'JURIDICA' : 'NATURAL';
  }

  // ── Validación del formulario (Etapa 1) ───────────────────
  private validarFormulario(): boolean {
    if (!this.form.remitente.trim()) {
      this.error = 'El nombre completo es obligatorio.';
      return false;
    }
    if (!this.form.dniRuc.trim()) {
      this.error = 'El DNI o RUC es obligatorio.';
      return false;
    }
    const soloNumeros = /^\d+$/.test(this.form.dniRuc);
    if (!soloNumeros) {
      this.error = 'El DNI o RUC solo debe contener números.';
      return false;
    }
    if (this.form.dniRuc.length !== 8 && this.form.dniRuc.length !== 11) {
      this.error = 'El DNI debe tener 8 dígitos o el RUC 11 dígitos.';
      return false;
    }
    if (!this.form.asunto.trim()) {
      this.error = 'El asunto es obligatorio.';
      return false;
    }
    if (!this.form.emailRemitente.trim()) {
      this.error = 'El correo electrónico es obligatorio.';
      return false;
    }
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.emailRemitente);
    if (!emailValido) {
      this.error = 'El correo electrónico no tiene un formato válido.';
      return false;
    }
    if (this.form.numeroFolios < 1) {
      this.error = 'El número de folios debe ser al menos 1.';
      return false;
    }
    return true;
  }

  // ── Botón "Continuar" → pasa a Etapa 2 (SIN llamar API) ───
  continuar(): void {
    this.error = '';
    if (this.validarFormulario()) {
      this.etapa = 2;
      // Scroll al inicio para ver la confirmación
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Botón "No, Cancelar" → vuelve a Etapa 1 ───────────────
  cancelar(): void {
    this.etapa = 1;
    this.error = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Botón "Sí, enviar documento" → llama API ──────────────
  confirmarEnvio(): void {
    this.error = '';
    this.cargando = true;

    const datos = {
      tipoPersona:    this.detectarTipoPersona(),
      remitente:      this.form.remitente,
      dniRuc:         this.form.dniRuc,
      tipoDocumento:  this.form.tipoDocumento,
      numeroFolios:   this.form.numeroFolios,
      asunto:         this.form.asunto,
      emailRemitente: this.form.emailRemitente
    };

    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));

    if (this.archivo) {
      formData.append('archivo', this.archivo);
    }
    if (this.anexo) {
      formData.append('anexo', this.anexo);
    }

    this.http.post<any>('http://localhost:8080/api/documentos', formData).subscribe({
      next: (response) => {
        this.cargando = false;
        this.numeroTramite = response.numeroTramite;
        this.emailConfirmacion = this.form.emailRemitente;
        this.mostrarModal = true;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.message || 'Error al registrar el documento. Intente nuevamente.';
      }
    });
  }

  // ── Botón "GENERAR CARGO" → descarga PDF del backend ──────
  generarCargo(): void {
    if (!this.numeroTramite) return;

    this.http.get(
      `http://localhost:8080/api/documentos/${this.numeroTramite}/cargo`,
      { responseType: 'blob' }
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cargo-${this.numeroTramite}.html`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('No se pudo descargar el cargo. Intente nuevamente.');
      }
    });
  }

  // ── Cerrar modal y reiniciar formulario ───────────────────
  cerrarModal(): void {
    this.mostrarModal = false;
    this.etapa = 1;
    this.form = {
      remitente: '',
      dniRuc: '',
      emailRemitente: '',
      asunto: '',
      tipoDocumento: '',
      numeroFolios: 1
    };
    this.archivo = null;
    this.archivoNombre = '';
    this.anexo = null;
    this.anexoNombre = '';
    this.numeroTramite = '';
    this.emailConfirmacion = '';
  }
}