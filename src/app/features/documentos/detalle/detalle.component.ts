// =============================================================
// detalle.component.ts
// CORRECCIONES:
//   1. guardarRespuesta(): añadido error handler + guardandoRespuesta
//      flag para bloquear múltiples envíos mientras la petición está en vuelo.
//   2. Manejo específico del error 422: ocurre cuando el backend intenta
//      enviar el email ANTES de guardar la respuesta y el SMTP falla.
//      El backend lanza BusinessException → exception handler → 422.
//      El frontend ahora muestra un mensaje claro y sugiere desmarcar "Enviar email".
//   3. errorRespuesta: string para mostrar el error dentro del modal
//      (el modal ya está abierto, no es necesario cerrarlo).
// =============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { DocumentoService }   from '../../../core/services/documento.service';
import { HistorialService }   from '../../../core/services/historial.service';
import { DerivacionService }  from '../../../core/services/derivacion.service';
import { RespuestaService }   from '../../../core/services/respuesta.service';
import { AreaService }        from '../../../core/services/area.service';
import { AuthService }        from '../../../core/services/auth.service';

import { DocumentoResponse, CambioEstado }    from '../../../core/models/documento.model';
import { HistorialResponse }                  from '../../../core/models/historial.model';
import { DerivacionRequest, DerivacionResponse } from '../../../core/models/derivacion.model';
import { RespuestaRequest, RespuestaResponse }   from '../../../core/models/respuesta.model';
import { AreaResponse }                       from '../../../core/models/area.model';

import { CambiarEstadoComponent }    from './modales/cambiar-estado/cambiar-estado.component';
import { AsignarAreaComponent }      from './modales/asignar-area/asignar-area.component';
import { DerivarDocumentoComponent } from './modales/derivar-documento/derivar-documento.component';
import { EmitirRespuestaComponent }  from './modales/emitir-respuesta/emitir-respuesta.component';
import { EstadoBadgeComponent }      from '../../../shared/components/estado-badge/estado-badge.component';
import { SpinnerComponent }          from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CambiarEstadoComponent,
    AsignarAreaComponent,
    DerivarDocumentoComponent,
    EmitirRespuestaComponent,
    EstadoBadgeComponent,
    SpinnerComponent
  ],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.css'
})
export class DetalleComponent implements OnInit {

  numeroTramite  = '';
  documento: DocumentoResponse | null = null;
  historial:   HistorialResponse[]  = [];
  derivaciones: DerivacionResponse[] = [];
  respuestas:   RespuestaResponse[]  = [];
  areas:        AreaResponse[]       = [];
  nombreUsuario = '';
  cargando      = false;

  mostrarModalEstado     = false;
  mostrarModalArea       = false;
  mostrarModalDerivacion = false;
  mostrarModalRespuesta  = false;

  cambioEstado:  CambioEstado     = { estado: 'EN_PROCESO', observacion: '', usuarioResponsable: '' };
  areaSeleccionada = '';
  derivacionForm: DerivacionRequest = { areaDestinoId: '', motivo: '', usuarioResponsable: '' };
  respuestaForm:  RespuestaRequest  = { contenido: '', usuarioResponsable: '', enviarEmail: true };

  // ── NUEVO: estado de la petición de respuesta ────────────
  // Bloquea el botón mientras la petición está en vuelo →
  // evita los múltiples 422 que ocurrían por clicks repetidos.
  guardandoRespuesta = false;
  errorRespuesta     = '';   // se muestra dentro del modal

  estados = [
    { label: 'Recibido',   value: 'RECIBIDO'   },
    { label: 'En Proceso', value: 'EN_PROCESO'  },
    { label: 'Observado',  value: 'OBSERVADO'   },
    { label: 'Archivado',  value: 'ARCHIVADO'   }
  ];

  constructor(
    private route:             ActivatedRoute,
    private router:            Router,
    private documentoService:  DocumentoService,
    private historialService:  HistorialService,
    private derivacionService: DerivacionService,
    private respuestaService:  RespuestaService,
    private areaService:       AreaService,
    private authService:       AuthService
  ) {}

  ngOnInit(): void {
    this.numeroTramite = this.route.snapshot.paramMap.get('numeroTramite') || '';
    this.nombreUsuario = this.authService.getNombre();

    this.cambioEstado.usuarioResponsable   = this.nombreUsuario;
    this.derivacionForm.usuarioResponsable = this.nombreUsuario;
    this.respuestaForm.usuarioResponsable  = this.nombreUsuario;

    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando = true;

    this.documentoService.consultarPorNumeroTramite(this.numeroTramite).subscribe({
      next: (doc: DocumentoResponse) => {
        this.documento = doc;
        this.cargando  = false;
      }
    });

    this.historialService.obtenerPorTramite(this.numeroTramite).subscribe({
      next: (h: HistorialResponse[]) => this.historial = h
    });

    this.derivacionService.obtenerPorTramite(this.numeroTramite).subscribe({
      next: (d: DerivacionResponse[]) => this.derivaciones = d
    });

    this.respuestaService.obtenerPorTramite(this.numeroTramite).subscribe({
      next: (r: RespuestaResponse[]) => this.respuestas = r
    });

    this.areaService.listar().subscribe({
      next: (a: AreaResponse[]) => this.areas = a
    });
  }

  abrirModalEstado():     void { this.mostrarModalEstado     = true; }
  abrirModalArea():       void { this.mostrarModalArea       = true; }
  abrirModalDerivacion(): void { this.mostrarModalDerivacion = true; }

  abrirModalRespuesta(): void {
    // Limpiar error anterior cada vez que se abre el modal
    this.errorRespuesta    = '';
    this.respuestaForm.contenido = '';
    this.mostrarModalRespuesta  = true;
  }

  cerrarModales(): void {
    this.mostrarModalEstado     = false;
    this.mostrarModalArea       = false;
    this.mostrarModalDerivacion = false;
    this.mostrarModalRespuesta  = false;
    this.errorRespuesta         = '';
  }

  guardarEstado(): void {
    this.documentoService.cambiarEstado(this.numeroTramite, this.cambioEstado).subscribe({
      next: () => { this.mostrarModalEstado = false; this.cargarTodo(); }
    });
  }

  guardarArea(areaId: string): void {
    if (!areaId) return;
    this.documentoService.asignarArea(this.numeroTramite, areaId).subscribe({
      next: () => { this.mostrarModalArea = false; this.cargarTodo(); }
    });
  }

  guardarDerivacion(): void {
    this.derivacionService.derivar(this.numeroTramite, this.derivacionForm).subscribe({
      next: () => { this.mostrarModalDerivacion = false; this.cargarTodo(); }
    });
  }

  // ── CORREGIDO ────────────────────────────────────────────
  guardarRespuesta(): void {
    // Validación mínima en el frontend — @NotBlank en el DTO del backend
    if (!this.respuestaForm.contenido.trim()) {
      this.errorRespuesta = 'El contenido de la respuesta es obligatorio.';
      return;
    }

    // Bloquear envíos múltiples mientras la petición está en vuelo.
    // Sin esto, el usuario podía hacer clic varias veces y generar
    // múltiples llamadas simultáneas (todos fallaban con 422).
    if (this.guardandoRespuesta) return;

    this.guardandoRespuesta = true;
    this.errorRespuesta     = '';

    this.respuestaService.emitir(this.numeroTramite, this.respuestaForm).subscribe({
      next: () => {
        this.guardandoRespuesta    = false;
        this.mostrarModalRespuesta = false;
        this.errorRespuesta        = '';
        this.cargarTodo();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoRespuesta = false;
        this.errorRespuesta     = this.interpretarErrorRespuesta(err);
        // El modal permanece abierto para que el usuario pueda corregir
        // (por ejemplo, desmarcar "Enviar email" si el SMTP no está listo)
      }
    });
  }

  // ── Interpretación de errores específica para respuestas ─
  // 422: el backend intenta enviar el email ANTES de guardar.
  //      Si el SMTP falla → BusinessException → 422.
  //      Solución: desmarcar "Enviar notificación por email".
  private interpretarErrorRespuesta(err: HttpErrorResponse): string {
    const msg = err.error?.message || '';
    switch (err.status) {
      case 422:
        return msg.includes('correo') || msg.includes('email')
          ? `Error al enviar el email: ${msg}. Desmarque "Enviar notificación" e intente nuevamente.`
          : 'No se pudo guardar la respuesta. Desmarque "Enviar notificación por email" e intente nuevamente.';
      case 400:
        return msg || 'Datos inválidos. Verifique el contenido.';
      case 403:
        return 'No tiene permisos para emitir respuestas.';
      case 404:
        return 'No se encontró el trámite. Recargue la página.';
      case 0:
        return 'Sin conexión con el servidor.';
      default:
        return msg || 'Error al emitir la respuesta. Intente nuevamente.';
    }
  }

  descargar(): void {
    this.documentoService.descargarArchivo(this.numeroTramite).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `${this.numeroTramite}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  getAreasParaDerivacion(): AreaResponse[] {
    return this.areas.filter(a => a.id !== this.documento?.areaId);
  }

  irAtras(): void {
    this.router.navigate(['/documentos']);
  }
}
