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

  // ===== DATOS =====
  documentos: DocumentoResponse[] = [];         // Lista completa
  documentosPaginados: DocumentoResponse[] = []; // Solo la página actual
  cargando = false;

  // ===== PAGINACIÓN =====
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;

  // ===== FILTROS =====
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

  // ===== CARGA INICIAL =====
  listarTodos(): void {
    this.cargando = true;
    this.documentoService.listarTodos().subscribe({
      next: (docs) => {
        this.documentos = docs;
        this.paginaActual = 1;
        this.calcularPaginacion();
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  // ===== BUSCAR CON FILTROS =====
  buscar(): void {
    this.cargando = true;
    const filtroLimpio: DocumentoFiltro = {};
    if (this.filtro.remitente) filtroLimpio.remitente = this.filtro.remitente;
    if (this.filtro.asunto)    filtroLimpio.asunto    = this.filtro.asunto;
    if (this.filtro.estado)    filtroLimpio.estado    = this.filtro.estado;

    this.documentoService.buscarPorFiltros(filtroLimpio).subscribe({
      next: (docs) => {
        this.documentos = docs;
        this.paginaActual = 1;        // Siempre vuelve a página 1 al buscar
        this.calcularPaginacion();
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  // ===== LIMPIAR FILTROS =====
  limpiar(): void {
    this.filtro = { remitente: '', asunto: '', estado: undefined };
    this.listarTodos();
  }

  // ===== PAGINACIÓN =====

  /** Calcula cuántas páginas hay y extrae el slice correcto */
  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.documentos.length / this.itemsPorPagina);
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin    = inicio + this.itemsPorPagina;
    this.documentosPaginados = this.documentos.slice(inicio, fin);
  }

  /** Cambia a una página específica */
  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.calcularPaginacion();
  }

  /** Genera el array de números de página para el *ngFor del HTML */
  getPaginas(): number[] {
    // Muestra máximo 5 páginas alrededor de la actual
    const rango = 2;
    const inicio = Math.max(1, this.paginaActual - rango);
    const fin    = Math.min(this.totalPaginas, this.paginaActual + rango);
    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  // ===== NAVEGACIÓN =====
  verDetalle(numeroTramite: string): void {
    this.router.navigate(['/documentos', numeroTramite]);
  }

  irDashboard(): void {
    this.router.navigate(['/dashboard']);
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

  // Agrega este método en la clase ListaComponent
  getHasta(): number {
  return Math.min(this.paginaActual * this.itemsPorPagina, this.documentos.length);
}
}