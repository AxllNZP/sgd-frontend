// =============================================================
// registro.component.ts — SMART COMPONENT
// RESPONSABILIDAD ÚNICA: orquestar el flujo y llamar la API.
//
// Lo que YA NO hace (delegado a sub-componentes):
//   - Lógica de validación de archivos → PasoAdjuntosComponent
//   - Custom select de tipo doc        → PasoDocumentoComponent
//   - Simulación de progreso           → PasoAdjuntosComponent
//   - Renderizar el resumen            → PasoConfirmacionComponent
//
// Lo que SÍ hace (solo el padre puede hacerlo):
//   - Leer el estado de sesión (localStorage)
//   - Validar el formulario completo antes de pasar a etapa 2
//   - Construir el FormData y llamar DocumentoService
//   - Manejar errores HTTP
//   - Navegar entre etapas
// =============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { DocumentoService } from '../../../core/services/documento.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentoResponse } from '../../../core/models/documento.model';

import { RegistroForm, REGISTRO_FORM_VACIO } from './registro.models';
import { PasoRemitenteComponent }    from './pasos/paso-remitente/paso-remitente.component';
import { PasoDocumentoComponent }    from './pasos/paso-documento/paso-documento.component';
import { PasoAdjuntosComponent }     from './pasos/paso-adjuntos/paso-adjuntos.component';
import { PasoConfirmacionComponent } from './pasos/paso-confirmacion/paso-confirmacion.component';
import { ModalDocumentoComponent }   from '../../../shared/modal-documento/modal-documento.component';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PasoRemitenteComponent,
    PasoDocumentoComponent,
    PasoAdjuntosComponent,
    PasoConfirmacionComponent,
    ModalDocumentoComponent
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {

  // ── Etapas ────────────────────────────────────────────────
  etapa: 1 | 2 = 1;

  // ── Estado del formulario compartido con los pasos ────────
  // Los sub-componentes DUMB lo mutan directamente via ngModel
  form: RegistroForm = { ...REGISTRO_FORM_VACIO };

  // ── Archivos — no son parte del RegistroForm (no son JSON) ─
  archivo:       File | null = null;
  archivoNombre  = '';
  anexo:         File | null = null;
  anexoNombre    = '';

  // ── Estado de sesión ciudadano ────────────────────────────
  esCiudadanoAutenticado = false;
  tipoPersonaActual: 'NATURAL' | 'JURIDICA' | null = null;

  // ── Estado UI ─────────────────────────────────────────────
  error             = '';
  cargando          = false;
  mostrarModal      = false;
  descargandoCargo  = false;
  numeroTramite     = '';
  emailConfirmacion = '';

  constructor(
    private documentoService: DocumentoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const rol           = localStorage.getItem('rol');
    const tipoPersna    = localStorage.getItem('tipoPersna');
    const identificador = localStorage.getItem('identificador');

    if (rol === 'CIUDADANO' && tipoPersna && identificador) {
      this.esCiudadanoAutenticado = true;
      this.tipoPersonaActual      = tipoPersna as 'NATURAL' | 'JURIDICA';
      this.form.dniRuc            = identificador;

      const nombre = localStorage.getItem('nombre');
      const email  = localStorage.getItem('email');
      if (nombre) this.form.remitente      = nombre;
      if (email)  this.form.emailRemitente = email;
    }
  }

  // ── Getter para pasar a los sub-componentes ───────────────
  get tipoPersona(): 'NATURAL' | 'JURIDICA' {
    if (this.tipoPersonaActual) return this.tipoPersonaActual;
    return this.form.dniRuc.length === 11 ? 'JURIDICA' : 'NATURAL';
  }

  // ── Handlers de archivos (@Output de PasoAdjuntos) ────────
  onArchivoSeleccionado(file: File | null): void {
    this.archivo       = file;
    this.archivoNombre = file?.name ?? '';
  }

  onAnexoSeleccionado(file: File | null): void {
    this.anexo       = file;
    this.anexoNombre = file?.name ?? '';
  }

  // ── Validación completa antes de avanzar a etapa 2 ───────
  private validarFormulario(): boolean {
    if (!this.form.remitente.trim()) {
      this.error = 'El nombre completo es obligatorio.'; return false;
    }
    if (!this.form.dniRuc.trim() || !/^\d+$/.test(this.form.dniRuc)) {
      this.error = 'El DNI o RUC solo debe contener números.'; return false;
    }
    if (this.form.dniRuc.length !== 8 && this.form.dniRuc.length !== 11) {
      this.error = 'El DNI debe tener 8 dígitos o el RUC 11 dígitos.'; return false;
    }
    if (!this.form.tipoDocumento) {
      this.error = 'Seleccione el tipo de documento.'; return false;
    }
    if (!this.form.asunto.trim()) {
      this.error = 'El asunto es obligatorio.'; return false;
    }
    if (this.form.asunto.length > 900) {
      this.error = 'El asunto no puede superar los 900 caracteres.'; return false;
    }
    if (!this.form.emailRemitente.trim()) {
      this.error = 'El correo electrónico es obligatorio.'; return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.emailRemitente)) {
      this.error = 'El correo electrónico no tiene un formato válido.'; return false;
    }
    if (this.form.numeroFolios < 1) {
      this.error = 'El número de folios debe ser al menos 1.'; return false;
    }
    return true;
  }

  // ── Navegación ────────────────────────────────────────────
  continuar(): void {
    this.error = '';
    if (this.validarFormulario()) this.etapa = 2;
  }

  cancelar(): void {
    this.etapa = 1;
    this.error = '';
  }

  // ── Llamada a la API ──────────────────────────────────────
  confirmarEnvio(): void {
    this.error    = '';
    this.cargando = true;

    // Body exacto según DocumentoRequestDTO del backend
    const datos = {
      tipoPersona:                this.tipoPersona,
      remitente:                  this.form.remitente,
      dniRuc:                     this.form.dniRuc,
      tipoDocumento:              this.form.tipoDocumento,
      numeroFolios:               this.form.numeroFolios,
      asunto:                     this.form.asunto,
      emailRemitente:             this.form.emailRemitente,
      emailNotificacionAdicional: this.form.emailNotificacionAdicional || undefined,
      contactosNotificacionIds:   this.form.contactosNotificacionIds.length
                                    ? this.form.contactosNotificacionIds : undefined
    };

    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    if (this.archivo) formData.append('archivo', this.archivo);
    if (this.anexo)   formData.append('anexo',   this.anexo);

    this.documentoService.registrar(formData).subscribe({
      next: (response: DocumentoResponse) => {
        this.cargando          = false;
        this.numeroTramite     = response.numeroTramite;
        this.emailConfirmacion = this.form.emailRemitente;
        this.mostrarModal      = true;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error    = this.manejarErrorHttp(err);
      }
    });
  }

  // ── Descarga del cargo ────────────────────────────────────
  // GET /api/documentos/{numeroTramite}/cargo — endpoint público
  descargarCargo(): void {
    if (!this.numeroTramite) return;
    this.descargandoCargo = true;

    this.documentoService.descargarCargo(this.numeroTramite).subscribe({
      next: (blob: Blob) => {
        this.descargandoCargo = false;
        const url    = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href     = url;
        enlace.download = `cargo-${this.numeroTramite}.html`;
        enlace.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.descargandoCargo = false;
        this.error = 'No se pudo descargar el cargo. Intente nuevamente.';
      }
    });
  }

  // ── Acciones del modal ────────────────────────────────────
  cerrarModal(): void { this.mostrarModal = false; }

  nuevoRegistro(): void {
    this.mostrarModal  = false;
    this.etapa         = 1;
    this.form          = { ...REGISTRO_FORM_VACIO };
    this.archivo       = null;
    this.archivoNombre = '';
    this.anexo         = null;
    this.anexoNombre   = '';
    this.error         = '';
    this.numeroTramite = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.ngOnInit();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/ciudadano']);
  }

  // ── Manejo centralizado de errores HTTP ───────────────────
  private manejarErrorHttp(err: HttpErrorResponse): string {
    const body = err.error;
    switch (err.status) {
      case 0:   return 'Sin conexión con el servidor. Verifique su red.';
      case 400:
        if (body?.campos) return `Dato inválido: ${Object.values(body.campos)[0]}`;
        return body?.message || 'Datos del formulario incorrectos.';
      case 413: return 'El archivo supera el tamaño permitido (principal: 50 MB, anexo: 20 MB).';
      case 415: return 'Formato de envío no válido. Recargue la página.';
      case 500:
        return (body?.message && body.message !== 'Error interno del servidor')
          ? body.message : 'Error interno del servidor. Intente en unos momentos.';
      default:  return body?.message || `Error inesperado (código ${err.status}).`;
    }
  }
}
