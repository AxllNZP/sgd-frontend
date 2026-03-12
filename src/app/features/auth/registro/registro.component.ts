// =============================================================
// registro.component.ts
// CORRECCIONES:
//   1. ELIMINADO: import HttpClient — el componente no debe llamar
//      a la API directamente.
//   2. AÑADIDO: DocumentoService inyectado — centraliza la llamada
//      a POST /api/documentos (multipart/form-data).
//   3. confirmarEnvio() tipado con DocumentoResponse (no 'any').
//      response.numeroTramite accede al campo exacto del DTO.
//   4. AÑADIDA validación de tipoDocumento en validarFormulario().
//      El backend tiene este campo como NOT NULL en la entidad y
//      lo mapea obligatoriamente en DocumentoRequestDTO.
//   5. La construcción del FormData se delega a DocumentoService.registrar()
//      manteniendo el contrato multipart: part 'datos' (JSON blob) +
//      parts opcionales 'archivo' y 'anexo'.
// =============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DocumentoService } from '../../../core/services/documento.service';
import { DocumentoResponse } from '../../../core/models/documento.model';
import { SoloNumerosDirective } from '../../../shared/directives/solo-numeros.directive';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SoloNumerosDirective],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {

  // ── Control de etapas ──────────────────────────────────────
  // 1 = Etapa 1 (formulario) | 2 = Etapa 2 (confirmación)
  etapa: 1 | 2 = 1;

  // ── Control del modal de resultado ────────────────────────
  mostrarModal = false;

  // ── Formulario ────────────────────────────────────────────
  form = {
    remitente:      '',
    dniRuc:         '',
    emailRemitente: '',
    asunto:         '',
    tipoDocumento:  '',
    numeroFolios:   1
  };

  // Fuente: DocumentoRequestDTO — valores del campo 'tipoDocumento'
  // No existe un enum en el backend; son strings libres definidos aquí.
  tiposDocumento = [
    { label: 'Solicitud', value: 'SOLICITUD'  },
    { label: 'Informe',   value: 'INFORME'    },
    { label: 'Oficio',    value: 'OFICIO'     },
    { label: 'Memorando', value: 'MEMORANDO'  },
    { label: 'Carta',     value: 'CARTA'      }
  ];

  // ── Archivos ──────────────────────────────────────────────
  archivo: File | null = null;
  archivoNombre = '';
  anexo: File | null = null;
  anexoNombre = '';

  // ── Estado ────────────────────────────────────────────────
  error    = '';
  cargando = false;
  numeroTramite    = '';
  emailConfirmacion = '';

  // CORRECCIÓN: DocumentoService inyectado — HttpClient eliminado del constructor
  constructor(
    private documentoService: DocumentoService,
    private router: Router
  ) {}

  // ── Selección de archivos ──────────────────────────────────
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.archivo = file;
      this.archivoNombre = file.name;
    }
  }

  onAnexoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.anexo = file;
      this.anexoNombre = file.name;
    }
  }

  // ── Detectar tipo de persona por longitud del DNI/RUC ─────
  // Fuente: DocumentoRequestDTO.tipoPersona — "NATURAL" | "JURIDICA"
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
    if (!/^\d+$/.test(this.form.dniRuc)) {
      this.error = 'El DNI o RUC solo debe contener números.';
      return false;
    }
    if (this.form.dniRuc.length !== 8 && this.form.dniRuc.length !== 11) {
      this.error = 'El DNI debe tener 8 dígitos o el RUC 11 dígitos.';
      return false;
    }
    // CORRECCIÓN: tipoDocumento es NOT NULL en la entidad Documento
    if (!this.form.tipoDocumento) {
      this.error = 'Seleccione el tipo de documento.';
      return false;
    }
    if (!this.form.asunto.trim()) {
      this.error = 'El asunto es obligatorio.';
      return false;
    }
    // Fuente: DocumentoRequestDTO.asunto @Size(max=900)
    if (this.form.asunto.length > 900) {
      this.error = 'El asunto no puede superar los 900 caracteres.';
      return false;
    }
    if (!this.form.emailRemitente.trim()) {
      this.error = 'El correo electrónico es obligatorio.';
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.emailRemitente)) {
      this.error = 'El correo electrónico no tiene un formato válido.';
      return false;
    }
    // Fuente: DocumentoRequestDTO.numeroFolios @Min(1) @NotNull
    if (this.form.numeroFolios < 1) {
      this.error = 'El número de folios debe ser al menos 1.';
      return false;
    }
    return true;
  }

  // ── Botón "Continuar" → pasa a Etapa 2 (sin llamar API) ───
  continuar(): void {
    this.error = '';
    if (this.validarFormulario()) {
      this.etapa = 2;
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
  // CORRECCIÓN: usa DocumentoService.registrar(formData)
  // El backend espera multipart/form-data con:
  //   - part "datos"   → DocumentoRequestDTO (application/json blob)
  //   - part "archivo" → MultipartFile (opcional)
  //   - part "anexo"   → MultipartFile (opcional)
  // Respuesta exitosa: 201 Created con DocumentoResponseDTO en el body.
  confirmarEnvio(): void {
    this.error = '';
    this.cargando = true;

    // Construir el objeto datos exactamente como DocumentoRequestDTO
    const datos = {
      tipoPersona:    this.detectarTipoPersona(),   // "NATURAL" | "JURIDICA"
      remitente:      this.form.remitente,
      dniRuc:         this.form.dniRuc,
      tipoDocumento:  this.form.tipoDocumento,
      numeroFolios:   this.form.numeroFolios,        // @Min(1) @NotNull
      asunto:         this.form.asunto,              // @Size(max=900)
      emailRemitente: this.form.emailRemitente
      // emailNotificacionAdicional y contactosNotificacionIds son opcionales
      // y no aplican en el flujo anónimo de registro de documento
    };

    const formData = new FormData();
    // Part "datos" debe enviarse como blob con mediaType application/json
    // para que @RequestPart("datos") en el controlador lo deserialice
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));

    if (this.archivo) {
      formData.append('archivo', this.archivo);
    }
    if (this.anexo) {
      formData.append('anexo', this.anexo);
    }

    // CORRECCIÓN: DocumentoService.registrar() — ya tipado con DocumentoResponse
    this.documentoService.registrar(formData).subscribe({
      next: (response: DocumentoResponse) => {
        this.cargando = false;
        // Fuente: DocumentoResponseDTO.numeroTramite
        this.numeroTramite     = response.numeroTramite;
        this.emailConfirmacion = this.form.emailRemitente;
        this.mostrarModal = true;
      },
      error: (err) => {
        this.cargando = false;
        // El backend retorna mensajes de error en err.error.message
        // Posibles códigos: 400 (validación), 413 (archivo muy grande)
        if (err.status === 413) {
          this.error = 'El archivo supera el tamaño permitido (principal: 50MB, anexo: 20MB).';
        } else {
          this.error = err.error?.message || 'Error al registrar el documento. Intente nuevamente.';
        }
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  nuevoRegistro(): void {
    this.mostrarModal = false;
    this.etapa = 1;
    this.form = {
      remitente:      '',
      dniRuc:         '',
      emailRemitente: '',
      asunto:         '',
      tipoDocumento:  '',
      numeroFolios:   1
    };
    this.archivo      = null;
    this.archivoNombre = '';
    this.anexo        = null;
    this.anexoNombre  = '';
    this.error        = '';
    this.numeroTramite = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}