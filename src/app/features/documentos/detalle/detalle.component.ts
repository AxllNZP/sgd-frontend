// =============================================================
// detalle.component.ts
// CORRECCIONES:
//   1. cargarTodo() → next: (doc) tipado como DocumentoResponse
//      Era: next: (doc) => {...}   →  TS7006 parámetro implícitamente any
//   2. descargar()  → next: (blob) tipado como Blob
//      Era: next: (blob) => {...}  →  TS7006 parámetro implícitamente any
//   3. Sin otros cambios — toda la lógica y estructura es correcta
// =============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentoService } from '../../../core/services/documento.service';
import { HistorialService } from '../../../core/services/historial.service';
import { DerivacionService } from '../../../core/services/derivacion.service';
import { RespuestaService } from '../../../core/services/respuesta.service';
import { AreaService } from '../../../core/services/area.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentoResponse, CambioEstado } from '../../../core/models/documento.model';
import { HistorialResponse } from '../../../core/models/historial.model';
import { DerivacionRequest, DerivacionResponse } from '../../../core/models/derivacion.model';
import { RespuestaRequest, RespuestaResponse } from '../../../core/models/respuesta.model';
import { AreaResponse } from '../../../core/models/area.model';
import { CambiarEstadoComponent } from './modales/cambiar-estado/cambiar-estado.component';
import { AsignarAreaComponent } from './modales/asignar-area/asignar-area.component';
import { DerivarDocumentoComponent } from './modales/derivar-documento/derivar-documento.component';
import { EmitirRespuestaComponent } from './modales/emitir-respuesta/emitir-respuesta.component';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

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

  numeroTramite = '';
  documento: DocumentoResponse | null = null;
  historial: HistorialResponse[] = [];
  derivaciones: DerivacionResponse[] = [];
  respuestas: RespuestaResponse[] = [];
  areas: AreaResponse[] = [];
  nombreUsuario = '';
  cargando = false;

  mostrarModalEstado    = false;
  mostrarModalArea      = false;
  mostrarModalDerivacion = false;
  mostrarModalRespuesta = false;

  cambioEstado: CambioEstado = { estado: 'EN_PROCESO', observacion: '', usuarioResponsable: '' };
  areaSeleccionada = '';
  derivacionForm: DerivacionRequest = { areaDestinoId: '', motivo: '', usuarioResponsable: '' };
  respuestaForm: RespuestaRequest   = { contenido: '', usuarioResponsable: '', enviarEmail: true };

  estados = [
    { label: 'Recibido',   value: 'RECIBIDO'   },
    { label: 'En Proceso', value: 'EN_PROCESO'  },
    { label: 'Observado',  value: 'OBSERVADO'   },
    { label: 'Archivado',  value: 'ARCHIVADO'   }
  ];

  constructor(
    private route:            ActivatedRoute,
    private router:           Router,
    private documentoService: DocumentoService,
    private historialService: HistorialService,
    private derivacionService: DerivacionService,
    private respuestaService:  RespuestaService,
    private areaService:       AreaService,
    private authService:       AuthService
  ) {}

  ngOnInit(): void {
    this.numeroTramite = this.route.snapshot.paramMap.get('numeroTramite') || '';
    this.nombreUsuario = this.authService.getNombre();
    this.cambioEstado.usuarioResponsable  = this.nombreUsuario;
    this.derivacionForm.usuarioResponsable = this.nombreUsuario;
    this.respuestaForm.usuarioResponsable  = this.nombreUsuario;
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando = true;

    // CORRECCIÓN: parámetro tipado como DocumentoResponse (era implícitamente 'any')
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
  abrirModalRespuesta():  void { this.mostrarModalRespuesta  = true; }

  cerrarModales(): void {
    this.mostrarModalEstado    = false;
    this.mostrarModalArea      = false;
    this.mostrarModalDerivacion = false;
    this.mostrarModalRespuesta = false;
  }

  guardarEstado(): void {
    this.documentoService.cambiarEstado(this.numeroTramite, this.cambioEstado).subscribe({
      next: () => { this.mostrarModalEstado = false; this.cargarTodo(); }
    });
  }

guardarArea(areaId: string): void {
  // areaId llega directamente del $event emitido por AsignarAreaComponent
  // Ya no depende de this.areaSeleccionada (que siempre estaba vacío)
  if (!areaId) return;

  this.documentoService.asignarArea(this.numeroTramite, areaId).subscribe({
    next: () => {
      this.mostrarModalArea = false;
      this.cargarTodo();
    },
    error: (err) => {
      console.error('Error al asignar área:', err);
      // Opcional: mostrar mensaje de error en la UI
    }
  });
}

  guardarDerivacion(): void {
    this.derivacionService.derivar(this.numeroTramite, this.derivacionForm).subscribe({
      next: () => { this.mostrarModalDerivacion = false; this.cargarTodo(); }
    });
  }

  guardarRespuesta(): void {
    this.respuestaService.emitir(this.numeroTramite, this.respuestaForm).subscribe({
      next: () => { this.mostrarModalRespuesta = false; this.cargarTodo(); }
    });
  }

  descargar(): void {
    // CORRECCIÓN: parámetro tipado como Blob (era implícitamente 'any')
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
