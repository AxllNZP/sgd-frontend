import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentoService } from '../../../core/services/documento.service';
import { DocumentoResponse, DocumentoFiltro } from '../../../core/models/documento.model';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, EstadoBadgeComponent, SpinnerComponent],
  templateUrl: './lista.component.html',
  styleUrl: './lista.component.css'
})
export class ListaComponent implements OnInit {
  documentos: DocumentoResponse[] = [];
  cargando = false;

  filtro: DocumentoFiltro = {
    remitente: '',
    asunto: '',
    estado: undefined
  };

  estados = [
    { label: 'Todos',      value: '' },
    { label: 'Recibido',   value: 'RECIBIDO' },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Observado',  value: 'OBSERVADO' },
    { label: 'Archivado',  value: 'ARCHIVADO' }
  ];

  constructor(
    private documentoService: DocumentoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listarTodos();
  }

  listarTodos(): void {
    this.cargando = true;
    this.documentoService.listarTodos().subscribe({
      next: (docs) => { this.documentos = docs; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  buscar(): void {
    this.cargando = true;
    const filtroLimpio: DocumentoFiltro = {};
    if (this.filtro.remitente) filtroLimpio.remitente = this.filtro.remitente;
    if (this.filtro.asunto)    filtroLimpio.asunto    = this.filtro.asunto;
    if (this.filtro.estado)    filtroLimpio.estado    = this.filtro.estado;

    this.documentoService.buscarPorFiltros(filtroLimpio).subscribe({
      next: (docs) => { this.documentos = docs; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  limpiar(): void {
    this.filtro = { remitente: '', asunto: '', estado: undefined };
    this.listarTodos();
  }

  verDetalle(numeroTramite: string): void {
    this.router.navigate(['/documentos', numeroTramite]);
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

  irDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}