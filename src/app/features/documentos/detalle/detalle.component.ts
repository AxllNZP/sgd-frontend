// =============================================================
// detalle.component.ts
// CORRECCIONES v2:
//   1. descargarAnexo() — método AÑADIDO.
//      Llama a documentoService.descargarAnexo() que existe en
//      el servicio pero nunca fue conectado al template.
//      GET /api/documentos/{numeroTramite}/descargar-anexo
//      Requiere: isAuthenticated() — ya tiene token.
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

import { DocumentoResponse, CambioEstado }       from '../../../core/models/documento.model';
import { HistorialResponse }                     from '../../../core/models/historial.model';
import { DerivacionRequest, DerivacionResponse } from '../../../core/models/derivacion.model';
import { RespuestaRequest, RespuestaResponse }   from '../../../core/models/respuesta.model';
import { AreaResponse }                          from '../../../core/models/area.model';

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
  historial:    HistorialResponse[]  = [];
  derivaciones: DerivacionResponse[] = [];
  respuestas:   RespuestaResponse[]  = [];
  areas:        AreaResponse[]       = [];
  nombreUsuario = '';
  cargando      = false;

  mostrarModalEstado     = false;
  mostrarModalArea       = false;
  mostrarModalDerivacion = false;
  mostrarModalRespuesta  = false;

  cambioEstado:   CambioEstado     = { estado: 'EN_PROCESO', observacion: '', usuarioResponsable: '' };
  areaSeleccionada = '';
  derivacionForm: DerivacionRequest = { areaDestinoId: '', motivo: '', usuarioResponsable: '' };
  respuestaForm:  RespuestaRequest  = { contenido: '', usuarioResponsable: '', enviarEmail: true };

  guardandoRespuesta = false;
  errorRespuesta     = '';

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
    this.errorRespuesta          = '';
    this.respuestaForm.contenido = '';
    this.mostrarModalRespuesta   = true;
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

  guardarRespuesta(): void {
    if (!this.respuestaForm.contenido.trim()) {
      this.errorRespuesta = 'El contenido de la respuesta es obligatorio.';
      return;
    }

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
      }
    });
  }

  private interpretarErrorRespuesta(err: HttpErrorResponse): string {
    const msg = err.error?.message || '';
    switch (err.status) {
      case 422:
        return msg.includes('correo') || msg.includes('email')
          ? `Error al enviar el email: ${msg}. Desmarque "Enviar notificación" e intente nuevamente.`
          : 'No se pudo guardar la respuesta. Desmarque "Enviar notificación por email" e intente nuevamente.';
      case 400:  return msg || 'Datos inválidos. Verifique el contenido.';
      case 403:  return 'No tiene permisos para emitir respuestas.';
      case 404:  return 'No se encontró el trámite. Recargue la página.';
      case 0:    return 'Sin conexión con el servidor.';
      default:   return msg || 'Error al emitir la respuesta. Intente nuevamente.';
    }
  }

  // ── Descarga del archivo principal ────────────────────────
  // GET /api/documentos/{numeroTramite}/descargar
  descargar(): void {
    this.documentoService.descargarArchivo(this.numeroTramite).subscribe({
      next: (blob: Blob) => {
        const nombre = this.documento?.nombreArchivoOriginal || `${this.numeroTramite}.pdf`;
        this.triggerDescarga(blob, nombre);
      }
    });
  }

  // ── Descarga del anexo ─────────────────────────────────────
  // GET /api/documentos/{numeroTramite}/descargar-anexo
  // 📚 LECCIÓN: el método existía en documento.service.ts pero
  // nunca fue conectado al template. Se añade aquí y en el HTML.
  descargarAnexo(): void {
    this.documentoService.descargarAnexo(this.numeroTramite).subscribe({
      next: (blob: Blob) => {
        const nombre = this.documento?.nombreAnexoOriginal || `${this.numeroTramite}-anexo.pdf`;
        this.triggerDescarga(blob, nombre);
      }
    });
  }

  // ── Helper compartido para disparar la descarga ───────────
  // 📚 LECCIÓN: extraemos la lógica repetida a un método privado.
  // Antes estaba duplicada entre descargar() y (hipotético) descargarAnexo().
  private triggerDescarga(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getAreasParaDerivacion(): AreaResponse[] {
    return this.areas.filter(a => a.id !== this.documento?.areaId);
  }

  irAtras(): void {
    this.router.navigate(['/documentos']);
  }
}
