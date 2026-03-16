// registro.component.ts — COMPLETO Y SINCRONIZADO

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DocumentoService } from '../../../core/services/documento.service';
import { DocumentoResponse } from '../../../core/models/documento.model';
import { SoloNumerosDirective } from '../../../shared/directives/solo-numeros.directive';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, SoloNumerosDirective],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {

  etapa: 1 | 2 = 1;
  mostrarModal = false;

  // ── Formulario — campos mapeados 1:1 con DocumentoRequestDTO ──
  form = {
    remitente:                   '',
    dniRuc:                      '',
    emailRemitente:              '',
    asunto:                      '',
    tipoDocumento:               '',
    numeroFolios:                1,
    emailNotificacionAdicional:  '',   // AÑADIDO — solo Persona Natural
    contactosNotificacionIds:    [] as string[]  // AÑADIDO — solo Persona Jurídica
  };

  // Fuente: DocumentoRequestDTO — no hay enum en backend, son strings
  tiposDocumento = [
    { label: 'Solicitud', value: 'SOLICITUD'  },
    { label: 'Informe',   value: 'INFORME'    },
    { label: 'Oficio',    value: 'OFICIO'     },
    { label: 'Memorando', value: 'MEMORANDO'  },
    { label: 'Carta',     value: 'CARTA'      }
  ];

  archivo:      File | null = null;
  archivoNombre = '';
  anexo:        File | null = null;
  anexoNombre  = '';

  error     = '';
  cargando  = false;
  numeroTramite     = '';
  emailConfirmacion = '';

  // ── Modo autenticado: se detecta en ngOnInit desde localStorage ──
  // Fuente: AuthService guarda tipoPersna e identificador tras loginCiudadano()
  esCiudadanoAutenticado = false;
  tipoPersonaActual: 'NATURAL' | 'JURIDICA' | null = null;

  constructor(
    private documentoService: DocumentoService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const tipoPersna    = localStorage.getItem('tipoPersna');
    const identificador = localStorage.getItem('identificador');
    const rol           = localStorage.getItem('rol');

    // Si hay sesión ciudadana activa, pre-cargar datos del formulario
    if (rol === 'CIUDADANO' && tipoPersna && identificador) {
      this.esCiudadanoAutenticado  = true;
      this.tipoPersonaActual       = tipoPersna as 'NATURAL' | 'JURIDICA';
      this.form.dniRuc             = identificador;

      // Pre-cargar nombre visible si está guardado
      const nombre = localStorage.getItem('nombre');
      if (nombre) this.form.remitente = nombre;

      // Pre-cargar email si está guardado
      const email = localStorage.getItem('email');
      if (email) this.form.emailRemitente = email;
    }
  }

  // ── Detectar tipo de persona ──
  // Si es ciudadano autenticado: usa el rol guardado (más fiable)
  // Si es anónimo: infiere por longitud del DNI/RUC
  // Fuente: DocumentoRequestDTO.tipoPersona — "NATURAL" | "JURIDICA"
  private detectarTipoPersona(): 'NATURAL' | 'JURIDICA' {
    if (this.tipoPersonaActual) return this.tipoPersonaActual;
    return this.form.dniRuc.length === 11 ? 'JURIDICA' : 'NATURAL';
  }

  // Getter para usar en el template sin llamar el método privado
  get tipoPersona(): 'NATURAL' | 'JURIDICA' {
    return this.detectarTipoPersona();
  }

  // ── Selección de archivos ──
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) { this.archivo = file; this.archivoNombre = file.name; }
  }

  onAnexoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) { this.anexo = file; this.anexoNombre = file.name; }
  }

  // ── Validación ──
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
    // Fuente: DocumentoRequestDTO.asunto @Size(max=900)
    if (this.form.asunto.length > 900) {
      this.error = 'El asunto no puede superar los 900 caracteres.'; return false;
    }
    if (!this.form.emailRemitente.trim()) {
      this.error = 'El correo electrónico es obligatorio.'; return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.emailRemitente)) {
      this.error = 'El correo electrónico no tiene un formato válido.'; return false;
    }
    // Fuente: DocumentoRequestDTO.numeroFolios @Min(1) @NotNull
    if (this.form.numeroFolios < 1) {
      this.error = 'El número de folios debe ser al menos 1.'; return false;
    }
    return true;
  }

  continuar(): void {
    this.error = '';
    if (this.validarFormulario()) {
      this.etapa = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cancelar(): void {
    this.etapa = 1;
    this.error = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirmarEnvio(): void {
    this.error    = '';
    this.cargando = true;

    const tipo = this.detectarTipoPersona();

    // ── Construir datos exactamente como DocumentoRequestDTO ──
    // Los campos opcionales solo se incluyen si tienen valor,
    // para no enviar strings vacíos que el backend valida con @Email
    const datos: Record<string, unknown> = {
      tipoPersona:    tipo,
      remitente:      this.form.remitente,
      dniRuc:         this.form.dniRuc,
      tipoDocumento:  this.form.tipoDocumento,
      numeroFolios:   this.form.numeroFolios,
      asunto:         this.form.asunto,
      emailRemitente: this.form.emailRemitente
    };

    // CAMPO NUEVO: emailNotificacionAdicional — solo Persona Natural
    // Fuente: DocumentoRequestDTO.emailNotificacionAdicional @Email (opcional)
    if (tipo === 'NATURAL' && this.form.emailNotificacionAdicional.trim()) {
      datos['emailNotificacionAdicional'] = this.form.emailNotificacionAdicional.trim();
    }

    // CAMPO NUEVO: contactosNotificacionIds — solo Persona Jurídica
    // Fuente: DocumentoRequestDTO.contactosNotificacionIds List<UUID> (opcional)
    if (tipo === 'JURIDICA' && this.form.contactosNotificacionIds.length > 0) {
      datos['contactosNotificacionIds'] = this.form.contactosNotificacionIds;
    }

    const formData = new FormData();
    // Part "datos" como Blob application/json — @RequestPart("datos") lo requiere
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
        this.error    = this.interpretarError(err);
      }
    });
  }

  // ── Interpreta cada código HTTP que GlobalExceptionHandler puede emitir ──
  // Fuente: GlobalExceptionHandler.java — estructura ApiErrorResponse
  // { timestamp, status, error, message, path } o { campos: {} } para @Valid
  private interpretarError(err: HttpErrorResponse): string {
    const body = err.error;

    switch (err.status) {
      case 0:
        return 'No se pudo conectar con el servidor. Verifique su conexión.';

      case 400:
        // Puede venir con "campos" (errores @Valid de campo) o "message" (BadRequestException)
        if (body?.campos) {
          const primerMensaje = Object.values(body.campos)[0] as string;
          return `Dato inválido: ${primerMensaje}`;
        }
        return body?.message || 'Datos del formulario incorrectos.';

      case 413:
        return 'El archivo supera el tamaño permitido (principal: 50 MB, anexo: 20 MB).';

      case 415:
        // Unsupported Media Type — el FormData no se construyó correctamente
        return 'Formato de envío no válido. Recargue la página e intente nuevamente.';

      case 500:
        // Mostramos el mensaje del backend si es específico, sino uno genérico
        return (body?.message && body.message !== 'Error interno del servidor')
          ? body.message
          : 'Error interno del servidor. Intente en unos momentos.';

      default:
        return body?.message || `Error inesperado (código ${err.status}).`;
    }
  }

  cerrarModal(): void { this.mostrarModal = false; }

  nuevoRegistro(): void {
    this.mostrarModal = false;
    this.etapa        = 1;
    this.form = {
      remitente:                  '',
      dniRuc:                     '',
      emailRemitente:             '',
      asunto:                     '',
      tipoDocumento:              '',
      numeroFolios:               1,
      emailNotificacionAdicional: '',
      contactosNotificacionIds:   []
    };
    this.archivo      = null;  this.archivoNombre = '';
    this.anexo        = null;  this.anexoNombre   = '';
    this.error        = '';
    this.numeroTramite = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cerrarSesion(): void {
  this.authService.logout();          // limpia localStorage
  this.router.navigate(['/ciudadano']); // vuelve a la pantalla de selección
}
}


