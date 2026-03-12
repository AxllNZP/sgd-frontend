// =============================================================
// dashboard.component.ts — versión final con getDesde/getHasta/getPaginas
// =============================================================

import {
  Component, OnInit, AfterViewInit,
  ElementRef, ViewChild, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentoService } from '../../core/services/documento.service';
import { DocumentoResponse, PageResponse } from '../../core/models/documento.model';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, EstadoBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('graficoEstados') graficoRef!: ElementRef<HTMLCanvasElement>;

  nombre = '';
  rol = '';

  totalDocumentos = 0;
  recibidos = 0;
  enProceso = 0;
  observados = 0;
  archivados = 0;

  documentosRecientes: DocumentoResponse[] = [];

  // Paginación del servidor (0-based — Spring Pageable)
  paginaActual  = 0;
  itemsPorPagina = 10;
  totalPaginas  = 0;
  totalElementos = 0;

  protected Math = Math;

  private chart: Chart | null = null;
  private datosCargados = false;

  constructor(
    private authService: AuthService,
    private documentoService: DocumentoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.nombre = this.authService.getNombre();
    this.rol    = this.authService.getRol();
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    if (this.datosCargados) {
      this.crearGrafico();
    }
  }

  // ── Carga inicial: size=100 para estadísticas representativas ──
  cargarEstadisticas(): void {
    this.documentoService.listarTodos(0, 100).subscribe({
      next: (page: PageResponse<DocumentoResponse>) => {
        const docs = page.content;
        this.totalDocumentos = page.totalElements;
        this.recibidos  = docs.filter(d => d.estado === 'RECIBIDO').length;
        this.enProceso  = docs.filter(d => d.estado === 'EN_PROCESO').length;
        this.observados = docs.filter(d => d.estado === 'OBSERVADO').length;
        this.archivados = docs.filter(d => d.estado === 'ARCHIVADO').length;

        // Tabla: primeros 10 de la carga
        this.documentosRecientes = docs.slice(0, this.itemsPorPagina);
        this.paginaActual   = page.number;
        this.totalPaginas   = page.totalPages;
        this.totalElementos = page.totalElements;

        this.datosCargados = true;
        if (this.graficoRef) {
          this.crearGrafico();
        }
      },
      error: () => { /* manejar error */ }
    });
  }

  // ── Navegar a una página del servidor ─────────────────────
  cargarPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas) return;
    this.documentoService.listarTodos(pagina, this.itemsPorPagina).subscribe({
      next: (page: PageResponse<DocumentoResponse>) => {
        this.documentosRecientes = page.content;
        this.paginaActual        = page.number;
        this.totalPaginas        = page.totalPages;
        this.totalElementos      = page.totalElements;
      }
    });
  }

  // ── Helpers de paginación para el template ─────────────────

  /** Índices de página visibles (0-based) */
  getPaginas(): number[] {
    const rango = 2;
    const inicio = Math.max(0, this.paginaActual - rango);
    const fin    = Math.min(this.totalPaginas - 1, this.paginaActual + rango);
    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  /** Primer registro de la página actual (1-based para mostrar) */
  getDesde(): number {
    return this.paginaActual * this.itemsPorPagina + 1;
  }

  /** Último registro de la página actual */
  getHasta(): number {
    return Math.min(
      (this.paginaActual + 1) * this.itemsPorPagina,
      this.totalElementos
    );
  }

  // ── Gráfico ────────────────────────────────────────────────
  crearGrafico(): void {
    if (this.chart) { this.chart.destroy(); }
    const ctx = this.graficoRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Recibido', 'En Proceso', 'Observado', 'Archivado'],
        datasets: [{
          data: [this.recibidos, this.enProceso, this.observados, this.archivados],
          backgroundColor: ['#60a5fa', '#fbbf24', '#f87171', '#34d399'],
          borderColor: '#1e293b',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e2e8f0', padding: 16, font: { size: 13 } }
          }
        }
      }
    });
  }

  verDetalle(numeroTramite: string): void {
    this.router.navigate(['/documentos', numeroTramite]);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}