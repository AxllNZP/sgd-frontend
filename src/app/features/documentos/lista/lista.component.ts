// =============================================================
// lista.component.ts
// CORRECCIONES:
//   1. listarTodos() ahora consume PageResponse<DocumentoResponse>
//      La paginación se delega al servidor (no más slice en frontend)
//   2. buscar() usa POST /api/documentos/buscar con body
//      (no era GET como tenía antes)
//   3. Se elimina la paginación manual en cliente (calcularPaginacion)
//      El servidor ya retorna totalPages, number, totalElements
//   4. El conteo de documentos usa page.totalElements
// =============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentoService } from '../../../core/services/documento.service';
import {
  DocumentoResponse,
  DocumentoFiltro,
  PageResponse
} from '../../../core/models/documento.model';
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
  documentos: DocumentoResponse[] = [];

  // ===== PAGINACIÓN DEL SERVIDOR =====
  paginaActual = 0;           // 0-based (Spring Pageable)
  itemsPorPagina = 10;
  totalPaginas = 0;
  totalElementos = 0;

  cargando = false;
  enModoBusqueda = false;    // true cuando hay filtros activos

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
    this.listarTodos(0);
  }

  // ===== CARGA PAGINADA DEL SERVIDOR =====
  listarTodos(pagina: number): void {
    this.cargando = true;
    this.enModoBusqueda = false;
    this.documentoService.listarTodos(pagina, this.itemsPorPagina).subscribe({
      next: (page: PageResponse<DocumentoResponse>) => {
        this.documentos = page.content;
        this.paginaActual = page.number;
        this.totalPaginas = page.totalPages;
        this.totalElementos = page.totalElements;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  // ===== BÚSQUEDA CON FILTROS (POST /buscar) =====
  buscar(): void {
    this.cargando = true;
    this.enModoBusqueda = true;
    // Construir filtro limpio (no enviar campos vacíos)
    const filtroLimpio: DocumentoFiltro = {};
    if (this.filtro.remitente) filtroLimpio.remitente = this.filtro.remitente;
    if (this.filtro.asunto)    filtroLimpio.asunto    = this.filtro.asunto;
    if (this.filtro.estado)    filtroLimpio.estado    = this.filtro.estado;

    // Siempre empieza en página 0 al buscar
    this.documentoService.buscarPorFiltros(filtroLimpio, 0, this.itemsPorPagina).subscribe({
      next: (page: PageResponse<DocumentoResponse>) => {
        this.documentos = page.content;
        this.paginaActual = page.number;
        this.totalPaginas = page.totalPages;
        this.totalElementos = page.totalElements;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  // ===== CAMBIO DE PÁGINA =====
  cambiarPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas) return;
    if (this.enModoBusqueda) {
      this.buscarEnPagina(pagina);
    } else {
      this.listarTodos(pagina);
    }
  }

  private buscarEnPagina(pagina: number): void {
    this.cargando = true;
    const filtroLimpio: DocumentoFiltro = {};
    if (this.filtro.remitente) filtroLimpio.remitente = this.filtro.remitente;
    if (this.filtro.asunto)    filtroLimpio.asunto    = this.filtro.asunto;
    if (this.filtro.estado)    filtroLimpio.estado    = this.filtro.estado;

    this.documentoService.buscarPorFiltros(filtroLimpio, pagina, this.itemsPorPagina).subscribe({
      next: (page: PageResponse<DocumentoResponse>) => {
        this.documentos = page.content;
        this.paginaActual = page.number;
        this.totalPaginas = page.totalPages;
        this.totalElementos = page.totalElements;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  // ===== LIMPIAR FILTROS =====
  limpiar(): void {
    this.filtro = { remitente: '', asunto: '', estado: undefined };
    this.listarTodos(0);
  }

  // ===== HELPERS DE PAGINACIÓN PARA TEMPLATE =====
  // Genera array de índices de página visibles (0-based)
  getPaginas(): number[] {
    const rango = 2;
    const inicio = Math.max(0, this.paginaActual - rango);
    const fin    = Math.min(this.totalPaginas - 1, this.paginaActual + rango);
    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  // Número de página 1-based para mostrar en UI
  get paginaMostrada(): number {
    return this.paginaActual + 1;
  }

  getDesde(): number {
    return this.paginaActual * this.itemsPorPagina + 1;
  }

  getHasta(): number {
    return Math.min(
      (this.paginaActual + 1) * this.itemsPorPagina,
      this.totalElementos
    );
  }

  // ===== NAVEGACIÓN =====
  verDetalle(numeroTramite: string): void {
    this.router.navigate(['/documentos', numeroTramite]);
  }

  irDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}