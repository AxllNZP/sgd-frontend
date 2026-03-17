// registro.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';           // RouterLink ya estaba
import { HttpErrorResponse } from '@angular/common/http';
import { DocumentoService } from '../../../core/services/documento.service';
import { AuthService } from '../../../core/services/auth.service'; // ← AÑADIDO
import { DocumentoResponse } from '../../../core/models/documento.model';
import { SoloNumerosDirective } from '../../../shared/directives/solo-numeros.directive';
import { ModalDocumentoComponent } from '../../../shared/modal-documento/modal-documento.component';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,          // ← NECESARIO para routerLink="/ciudadano/mis-datos"
    SoloNumerosDirective,
    ModalDocumentoComponent
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {

  etapa: 1 | 2 = 1;
  mostrarModal = false;

  form = {
    remitente:                   '',
    dniRuc:                      '',
    emailRemitente:              '',
    asunto:                      '',
    tipoDocumento:               '',
    numeroFolios:                1,
    emailNotificacionAdicional:  '',
    contactosNotificacionIds:    [] as string[]
  };

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
  descargandoCargo  = false;
  numeroTramite     = '';
  emailConfirmacion = '';

  esCiudadanoAutenticado = false;
  tipoPersonaActual: 'NATURAL' | 'JURIDICA' | null = null;

  errorArchivo = '';
  errorAnexo = '';

  subiendoArchivo = false;
  progresoArchivo = 0;

  subiendoAnexo = false;
  progresoAnexo = 0;

  constructor(
    private documentoService: DocumentoService,
    private router: Router,
    private authService: AuthService   // ← AÑADIDO
  ) {}

  ngOnInit(): void {
    const tipoPersna    = localStorage.getItem('tipoPersna');
    const identificador = localStorage.getItem('identificador');
    const rol           = localStorage.getItem('rol');

    if (rol === 'CIUDADANO' && tipoPersna && identificador) {
      this.esCiudadanoAutenticado = true;
      this.tipoPersonaActual      = tipoPersna as 'NATURAL' | 'JURIDICA';
      this.form.dniRuc            = identificador;

      const nombre = localStorage.getItem('nombre');
      if (nombre) this.form.remitente = nombre;

      const email = localStorage.getItem('email');
      if (email) this.form.emailRemitente = email;
    }
  }

  get tipoPersona(): 'NATURAL' | 'JURIDICA' {
    return this.detectarTipoPersona();
  }

  private detectarTipoPersona(): 'NATURAL' | 'JURIDICA' {
    if (this.tipoPersonaActual) return this.tipoPersonaActual;
    return this.form.dniRuc.length === 11 ? 'JURIDICA' : 'NATURAL';
  }

  onArchivoSeleccionado(event: any) {
  const file = event.target.files[0];
  this.procesarArchivo(file, 'principal');
}

onAnexoSeleccionado(event: any) {
  const file = event.target.files[0];
  this.procesarArchivo(file, 'anexo');
}

onDropArchivo(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  this.procesarArchivo(file!, 'principal');
}

onDropAnexo(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  this.procesarArchivo(file!, 'anexo');
}

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

    const datos: Record<string, unknown> = {
      tipoPersona:    tipo,
      remitente:      this.form.remitente,
      dniRuc:         this.form.dniRuc,
      tipoDocumento:  this.form.tipoDocumento,
      numeroFolios:   this.form.numeroFolios,
      asunto:         this.form.asunto,
      emailRemitente: this.form.emailRemitente
    };

    if (tipo === 'NATURAL' && this.form.emailNotificacionAdicional.trim()) {
      datos['emailNotificacionAdicional'] = this.form.emailNotificacionAdicional.trim();
    }
    if (tipo === 'JURIDICA' && this.form.contactosNotificacionIds.length > 0) {
      datos['contactosNotificacionIds'] = this.form.contactosNotificacionIds;
    }

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
        this.error    = this.interpretarError(err);
      }
    });
  }

  private interpretarError(err: HttpErrorResponse): string {
    const body = err.error;
    switch (err.status) {
      case 0:    return 'No se pudo conectar con el servidor.';
      case 400:
        if (body?.campos) return `Dato inválido: ${Object.values(body.campos)[0]}`;
        return body?.message || 'Datos del formulario incorrectos.';
      case 413:  return 'El archivo supera el tamaño permitido (principal: 50 MB, anexo: 20 MB).';
      case 415:  return 'Formato de envío no válido. Recargue la página.';
      case 500:
        return (body?.message && body.message !== 'Error interno del servidor')
          ? body.message : 'Error interno del servidor. Intente en unos momentos.';
      default:   return body?.message || `Error inesperado (código ${err.status}).`;
    }
  }

  // ── Navega a /ciudadano/mis-datos ─────────────────────────
  // El botón "Mis Datos" del header usa routerLink directamente en el HTML,
  // este método es solo para el botón "Cerrar Sesión"
  cerrarSesion(): void {
    this.authService.logout();            // limpia todo el localStorage
    this.router.navigate(['/ciudadano']); // vuelve a selección de tipo
  }

  cerrarModal(): void { this.mostrarModal = false; }

  nuevoRegistro(): void {
  this.mostrarModal = false;
  this.etapa = 1;

  // Reset formulario
  this.form = {
    remitente: '',
    dniRuc: '',
    emailRemitente: '',
    asunto: '',
    tipoDocumento: '',
    numeroFolios: 1,
    emailNotificacionAdicional: '',
    contactosNotificacionIds: []
  };

  // Reset archivos
  this.archivo = null;
  this.archivoNombre = '';
  this.anexo = null;
  this.anexoNombre = '';

  // Reset estados
  this.error = '';
  this.numeroTramite = '';
  this.emailConfirmacion = '';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  this.ngOnInit();
}

selectOpen = false;

toggleSelect() {
  this.selectOpen = !this.selectOpen;
}

selectTipo(valor: string) {
  this.form.tipoDocumento = valor;
  this.selectOpen = false;
}

procesarArchivo(file: File, tipo: 'principal' | 'anexo') {

  if (!file) return;

  const maxSize = tipo === 'principal' ? 50 : 20;
  const allowedTypes = tipo === 'principal'
    ? ['application/pdf']
    : [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip'
      ];

  const sizeMB = file.size / (1024 * 1024);

  // Validar tamaño
  if (sizeMB > maxSize) {
    if (tipo === 'principal') {
      this.errorArchivo = `Máximo ${maxSize}MB`;
    } else {
      this.errorAnexo = `Máximo ${maxSize}MB`;
    }
    return;
  }

  // Validar tipo
  const extension = file.name.split('.').pop()?.toLowerCase();

const allowedExt = tipo === 'principal'
  ? ['pdf']
  : ['pdf', 'doc', 'docx', 'zip'];

if (!allowedExt.includes(extension!)) {
  if (tipo === 'principal') {
    this.errorArchivo = 'Formato no permitido';
  } else {
    this.errorAnexo = 'Formato no permitido';
  }
  return;
}

  // OK
  if (tipo === 'principal') {
    this.archivo = file;
    this.archivoNombre = file.name;
    this.errorArchivo = '';
  } else {
    this.anexo = file;
    this.anexoNombre = file.name;
    this.errorAnexo = '';
  }

  if (tipo === 'principal') {
  this.subiendoArchivo = true;
  this.progresoArchivo = 0;
  this.simularProgreso('principal');
} else {
  this.subiendoAnexo = true;
  this.progresoAnexo = 0;
  this.simularProgreso('anexo');
}
}
onDragOver(event: DragEvent) {
  event.preventDefault();
}
simularProgreso(tipo: 'principal' | 'anexo') {

  let progreso = 0;

  const intervalo = setInterval(() => {
    progreso += 10;

    if (tipo === 'principal') {
      this.progresoArchivo = progreso;
    } else {
      this.progresoAnexo = progreso;
    }

    if (progreso >= 100) {
      clearInterval(intervalo);

      if (tipo === 'principal') {
        this.subiendoArchivo = false;
      } else {
        this.subiendoAnexo = false;
      }
    }

  }, 100);
}
eliminarArchivo(event: Event) {
  event.stopPropagation();
  this.archivo = null;
  this.archivoNombre = '';
}

eliminarAnexo(event: Event) {
  event.stopPropagation();
  this.anexo = null;
  this.anexoNombre = '';
}
getFileSize(file: File): string {
  const size = file.size / (1024 * 1024);
  return size < 1
    ? `${(size * 1024).toFixed(0)} KB`
    : `${size.toFixed(2)} MB`;
}

descargarCargo(): void {
    if (!this.numeroTramite) return;

    this.descargandoCargo = true;

    this.documentoService.descargarCargo(this.numeroTramite).subscribe({
      next: (blob: Blob) => {
        this.descargandoCargo = false;

        // Crear URL temporal para forzar descarga del archivo
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href     = url;
        enlace.download = `cargo-${this.numeroTramite}.html`;
        enlace.click();

        // Liberar la URL temporal inmediatamente
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.descargandoCargo = false;
        // No cerramos el modal — el usuario puede reintentar
        this.error = 'No se pudo descargar el cargo. Intente nuevamente.';
      }
    });
  }

}
