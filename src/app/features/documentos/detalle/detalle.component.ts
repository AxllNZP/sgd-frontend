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

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  mostrarModalEstado = false;
  mostrarModalArea = false;
  mostrarModalDerivacion = false;
  mostrarModalRespuesta = false;

  cambioEstado: CambioEstado = { estado: 'EN_PROCESO', observacion: '', usuarioResponsable: '' };
  areaSeleccionada = '';
  derivacionForm: DerivacionRequest = { areaDestinoId: '', motivo: '', usuarioResponsable: '' };
  respuestaForm: RespuestaRequest = { contenido: '', usuarioResponsable: '', enviarEmail: true };

  estados = [
    { label: 'Recibido',   value: 'RECIBIDO' },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Observado',  value: 'OBSERVADO' },
    { label: 'Archivado',  value: 'ARCHIVADO' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentoService: DocumentoService,
    private historialService: HistorialService,
    private derivacionService: DerivacionService,
    private respuestaService: RespuestaService,
    private areaService: AreaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.numeroTramite = this.route.snapshot.paramMap.get('numeroTramite') || '';
    this.nombreUsuario = this.authService.getNombre();
    this.cambioEstado.usuarioResponsable = this.nombreUsuario;
    this.derivacionForm.usuarioResponsable = this.nombreUsuario;
    this.respuestaForm.usuarioResponsable = this.nombreUsuario;
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando = true;
    this.documentoService.consultarPorNumeroTramite(this.numeroTramite).subscribe({
      next: (doc) => { this.documento = doc; this.cargando = false; }
    });
    this.historialService.obtenerPorTramite(this.numeroTramite).subscribe({
      next: (h) => this.historial = h
    });
    this.derivacionService.obtenerPorTramite(this.numeroTramite).subscribe({
      next: (d) => this.derivaciones = d
    });
    this.respuestaService.obtenerPorTramite(this.numeroTramite).subscribe({
      next: (r) => this.respuestas = r
    });
    this.areaService.listar().subscribe({
      next: (a) => this.areas = a
    });
  }

  abrirModalEstado(): void    { this.mostrarModalEstado = true; }
  abrirModalArea(): void      { this.mostrarModalArea = true; }
  abrirModalDerivacion(): void { this.mostrarModalDerivacion = true; }
  abrirModalRespuesta(): void  { this.mostrarModalRespuesta = true; }

  cerrarModales(): void {
    this.mostrarModalEstado = false;
    this.mostrarModalArea = false;
    this.mostrarModalDerivacion = false;
    this.mostrarModalRespuesta = false;
  }

  guardarEstado(): void {
    this.documentoService.cambiarEstado(this.numeroTramite, this.cambioEstado).subscribe({
      next: () => { this.mostrarModalEstado = false; this.cargarTodo(); }
    });
  }

  guardarArea(): void {
    this.documentoService.asignarArea(this.numeroTramite, this.areaSeleccionada).subscribe({
      next: () => { this.mostrarModalArea = false; this.cargarTodo(); }
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
    this.documentoService.descargarArchivo(this.numeroTramite).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.numeroTramite}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'RECIBIDO':   return 'badge-info';
      case 'EN_PROCESO': return 'badge-warn';
      case 'OBSERVADO':  return 'badge-danger';
      case 'ARCHIVADO':  return 'badge-success';
      default:           return 'badge-info';
    }
  }

  getAreasParaDerivacion(): AreaResponse[] {
    return this.areas.filter(a => a.id !== this.documento?.areaId);
  }

  irAtras(): void { this.router.navigate(['/documentos']); }
}