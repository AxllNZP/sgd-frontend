// =============================================================
// dashboard.component.ts — VERSIÓN MEJORADA
//
// 📚 LECCIÓN DE ARQUITECTURA — "Derivar vs. Pedir"
//   En lugar de crear un endpoint especial en el backend para
//   cada estadística, derivamos los datos en el frontend desde
//   los endpoints que ya existen. Esto respeta la regla de
//   Inviolabilidad del Backend.
//
//   forkJoin() = "ejecuta N observables en paralelo y emite
//   cuando TODOS completan". Perfecto para cargar datos
//   independientes (docs + áreas + usuarios) sin waterfalls.
// =============================================================

import {
  Component, OnInit, AfterViewInit,
  ElementRef, ViewChild, OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

import { AuthService }     from '../../core/services/auth.service';
import { DocumentoService } from '../../core/services/documento.service';
import { AreaService }      from '../../core/services/area.service';
import { UsuarioService }   from '../../core/services/usuario.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';

import {
  DocumentoResponse,
  PageResponse,
  EstadoDocumento,
  DocumentoFiltro
} from '../../core/models/documento.model';
import { AreaResponse }    from '../../core/models/area.model';
import { UsuarioResponse } from '../../core/models/usuario.model';

Chart.register(...registerables);

// ── Tipo local para el gráfico de línea ─────────────────────
// Derivado de DocumentoResponse.fechaHoraRegistro (ISO string)
interface ActividadDia {
  fecha: string;   // "DD/MM"
  total: number;
}

// ── Tipo local para el gráfico de barras ────────────────────
// Derivado agrupando DocumentoResponse por areaNombre
interface DocsPorArea {
  area: string;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EstadoBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Refs a los canvas de Chart.js ────────────────────────
  @ViewChild('graficoEstados')  graficoEstadosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoAreas')    graficoAreasRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoActividad') graficoActividadRef!: ElementRef<HTMLCanvasElement>;

  // ── Info del usuario ─────────────────────────────────────
  nombre = '';
  rol    = '';

  // ── Tarjetas de resumen ──────────────────────────────────
  totalDocumentos = 0;
  recibidos       = 0;
  enProceso       = 0;
  observados      = 0;
  archivados      = 0;
  totalAreas      = 0;
  totalUsuarios   = 0;

  // ── Tabla / búsqueda ─────────────────────────────────────
  documentosTabla:    DocumentoResponse[] = [];
  todosLosDocumentos: DocumentoResponse[] = []; // caché para filtrado local

  // Búsqueda en tiempo real (local, sin round-trip al servidor)
  terminoBusqueda = '';
  filtroEstado: EstadoDocumento | '' = '';

  // Paginación — Spring usa índices 0-based
  paginaActual   = 0;
  itemsPorPagina = 10;
  totalPaginas   = 0;
  totalElementos = 0;

  // ── Estado de carga ──────────────────────────────────────
  cargando      = false;
  errorCarga    = '';

  // ── Datos derivados para gráficos ────────────────────────
  // 📚 LECCIÓN: 'protected' es visible en el template pero no
  // fuera del componente. Más semántico que 'public' para datos
  // que solo el template propio necesita leer.
  private  actividadUltimos7Dias: ActividadDia[] = [];
  protected docsPorArea: DocsPorArea[] = [];

  // 📚 LECCIÓN: Angular NO permite expresiones como `new Date()`
  // dentro del template porque el compilador de Angular (Ivy)
  // solo puede acceder a miembros de la clase del componente.
  // Solución: pre-calcular el valor como propiedad.
  protected hoyISO = new Date().toISOString();

  // ── Charts ───────────────────────────────────────────────
  private chartEstados:   Chart | null = null;
  private chartAreas:     Chart | null = null;
  private chartActividad: Chart | null = null;
  private datosCargados = false;

  // ── Para limpiar suscripciones en ngOnDestroy ─────────────
  // 📚 LECCIÓN: Subject + takeUntil es el patrón recomendado en
  // Angular para evitar memory leaks al destruir un componente.
  private destroy$ = new Subject<void>();

  protected Math = Math;

  // ── Estados disponibles para el filtro ──────────────────
  // Contract-First: estos valores mapean con EstadoDocumento del backend
  readonly estadosFiltro: Array<{ label: string; value: EstadoDocumento | '' }> = [
    { label: 'Todos',      value: ''           },
    { label: 'Recibido',   value: 'RECIBIDO'   },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Observado',  value: 'OBSERVADO'  },
    { label: 'Archivado',  value: 'ARCHIVADO'  },
  ];

  constructor(
    private authService:      AuthService,
    private documentoService: DocumentoService,
    private areaService:      AreaService,
    private usuarioService:   UsuarioService,
    private router:           Router,
    // 📚 LECCIÓN: ChangeDetectorRef.detectChanges() ejecuta change
    // detection de forma síncrona. Útil cuando necesitas que el DOM
    // se actualice AHORA MISMO antes de continuar con código que
    // depende de elementos del DOM (como los canvas de Chart.js).
    private cdr:              ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.nombre = this.authService.getNombre();
    this.rol    = this.authService.getRol();
    this.cargarTodo();
  }

  ngAfterViewInit(): void {
    if (this.datosCargados) this.crearTodosLosGraficos();
  }

  // ── Carga paralela de las 3 fuentes de datos ─────────────
  // 📚 LECCIÓN forkJoin: dispara los 3 GET simultáneamente.
  // El tiempo total = MAX(t1, t2, t3), no t1+t2+t3.
  cargarTodo(): void {
    this.cargando   = true;
    this.errorCarga = '';

    forkJoin({
      docs:     this.documentoService.listarTodos(0, 500),  // muestra grande para estadísticas
      areas:    this.areaService.listar(),
      usuarios: this.usuarioService.listar()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ docs, areas, usuarios }) => {
        this.procesarDocumentos(docs);
        this.procesarAreas(areas);
        this.procesarUsuarios(usuarios);

        this.cargando      = false;
        this.datosCargados = true;

        // 📚 LECCIÓN — cdr.detectChanges() vs setTimeout:
        //
        // PROBLEMA: los <canvas> viven dentro de *ngIf="!cargando".
        // setTimeout(0) funciona en la primera carga pero falla en
        // back navigation porque Angular puede necesitar más de un
        // microtask para re-hidratar la vista destruida.
        //
        // cdr.detectChanges() es la solución correcta:
        //   → Ejecuta change detection SÍNCRONAMENTE ahora mismo
        //   → El *ngIf renderiza el canvas ANTES de que Chart.js lo busque
        //   → Funciona en primera carga Y en back navigation ✓
        this.cdr.detectChanges();
        this.crearTodosLosGraficos();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando   = false;
        this.errorCarga = 'No se pudieron cargar los datos del panel.';
      }
    });
  }

  // ── Procesar página de documentos ────────────────────────
  private procesarDocumentos(page: PageResponse<DocumentoResponse>): void {
    const docs = page.content;

    // Contadores por estado
    this.totalDocumentos = page.totalElements;
    this.recibidos  = docs.filter(d => d.estado === 'RECIBIDO').length;
    this.enProceso  = docs.filter(d => d.estado === 'EN_PROCESO').length;
    this.observados = docs.filter(d => d.estado === 'OBSERVADO').length;
    this.archivados = docs.filter(d => d.estado === 'ARCHIVADO').length;

    // Caché para búsqueda/filtrado local
    this.todosLosDocumentos = docs;

    // Paginación inicial
    this.paginaActual   = page.number;
    this.totalPaginas   = page.totalPages;
    this.totalElementos = page.totalElements;
    this.aplicarFiltroLocal(); // rellena documentosTabla

    // ── Derivar docs por área ────────────────────────────────
    // 📚 LECCIÓN: reduce() agrupa un array en un mapa de conteos.
    // Object.entries() convierte ese mapa en pares [clave, valor].
    const mapaAreas = docs.reduce<Record<string, number>>((acc, doc) => {
      const nombre = doc.areaNombre ?? 'Sin área';
      acc[nombre] = (acc[nombre] ?? 0) + 1;
      return acc;
    }, {});
    this.docsPorArea = Object.entries(mapaAreas)
      .map(([area, total]) => ({ area, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // máximo 8 áreas en el gráfico

    // ── Derivar actividad de los últimos 7 días ───────────────
    // fechaHoraRegistro viene como ISO-8601 string desde Spring Boot
    const hoy = new Date();
    const dias: ActividadDia[] = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const label = `${fecha.getDate().toString().padStart(2,'0')}/${(fecha.getMonth()+1).toString().padStart(2,'0')}`;
      const total = docs.filter(d => {
        const f = new Date(d.fechaHoraRegistro);
        return f.getDate() === fecha.getDate()
          && f.getMonth()  === fecha.getMonth()
          && f.getFullYear() === fecha.getFullYear();
      }).length;
      dias.push({ fecha: label, total });
    }
    this.actividadUltimos7Dias = dias;
  }

  private procesarAreas(areas: AreaResponse[]): void {
    this.totalAreas = areas.filter(a => a.activa).length;
  }

  private procesarUsuarios(usuarios: UsuarioResponse[]): void {
    this.totalUsuarios = usuarios.filter(u => u.activo).length;
  }

  // ── Búsqueda y filtrado local ─────────────────────────────
  // 📚 LECCIÓN: Filtrado local vs. servidor.
  // Para un dataset < 1000 registros, filtrar en memoria es
  // instantáneo y evita round-trips. Para datasets grandes
  // (> 10k), se usa POST /api/documentos/buscar con paginación.
  onBusquedaCambio(): void {
    this.paginaActual = 0;
    this.aplicarFiltroLocal();
  }

  onFiltroCambio(estado: EstadoDocumento | ''): void {
    this.filtroEstado  = estado;
    this.paginaActual  = 0;
    this.aplicarFiltroLocal();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado    = '';
    this.paginaActual    = 0;
    this.aplicarFiltroLocal();
  }

  private aplicarFiltroLocal(): void {
    let filtrados = [...this.todosLosDocumentos];

    // Filtro por estado (exacto — mapea con EstadoDocumento del backend)
    if (this.filtroEstado) {
      filtrados = filtrados.filter(d => d.estado === this.filtroEstado);
    }

    // Búsqueda por texto en campos: remitente, asunto, numeroTramite
    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (termino) {
      filtrados = filtrados.filter(d =>
        d.remitente.toLowerCase().includes(termino)     ||
        d.asunto.toLowerCase().includes(termino)        ||
        d.numeroTramite.toLowerCase().includes(termino) ||
        (d.areaNombre?.toLowerCase().includes(termino) ?? false)
      );
    }

    // Paginación local
    const inicio = this.paginaActual * this.itemsPorPagina;
    this.documentosTabla  = filtrados.slice(inicio, inicio + this.itemsPorPagina);
    this.totalElementos   = filtrados.length;
    this.totalPaginas     = Math.ceil(filtrados.length / this.itemsPorPagina);
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas) return;
    this.paginaActual = pagina;
    this.aplicarFiltroLocal();
  }

  getPaginas(): number[] {
    const rango = 2;
    const inicio = Math.max(0, this.paginaActual - rango);
    const fin    = Math.min(this.totalPaginas - 1, this.paginaActual + rango);
    const p: number[] = [];
    for (let i = inicio; i <= fin; i++) p.push(i);
    return p;
  }

  getDesde(): number { return this.paginaActual * this.itemsPorPagina + 1; }
  getHasta(): number {
    return Math.min((this.paginaActual + 1) * this.itemsPorPagina, this.totalElementos);
  }

  // ── Gráficos ─────────────────────────────────────────────
  private crearTodosLosGraficos(): void {
    this.crearGraficoEstados();
    this.crearGraficoAreas();
    this.crearGraficoActividad();
  }

  private crearGraficoEstados(): void {
    this.chartEstados?.destroy();
    const ctx = this.graficoEstadosRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    this.chartEstados = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Recibido', 'En Proceso', 'Observado', 'Archivado'],
        datasets: [{
          data: [this.recibidos, this.enProceso, this.observados, this.archivados],
          backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'],
          borderColor: 'rgba(0,0,0,0)',
          hoverBorderColor: '#fff',
          borderWidth: 0,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 16, font: { size: 12, family: 'Sora' }, boxWidth: 12, borderRadius: 3 }
          }
        }
      }
    });
  }

  private crearGraficoAreas(): void {
    this.chartAreas?.destroy();
    const ctx = this.graficoAreasRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    this.chartAreas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.docsPorArea.map(d => d.area),
        datasets: [{
          label: 'Documentos',
          data: this.docsPorArea.map(d => d.total),
          backgroundColor: 'rgba(59,130,246,0.7)',
          hoverBackgroundColor: '#3b82f6',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',   // barras horizontales — más legible con nombres largos
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid:  { color: 'rgba(255,255,255,0.04)' }
          },
          y: {
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
              // Truncar nombres largos en el label del eje
              callback: (val, idx) => {
                const label = this.docsPorArea[idx]?.area ?? '';
                return label.length > 18 ? label.slice(0, 18) + '…' : label;
              }
            },
            grid: { display: false }
          }
        }
      }
    });
  }

  private crearGraficoActividad(): void {
    this.chartActividad?.destroy();
    const ctx = this.graficoActividadRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    // Gradiente azul de arriba hacia abajo para el área del gráfico
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0,   'rgba(59,130,246,0.4)');
    gradient.addColorStop(1,   'rgba(59,130,246,0.0)');

    this.chartActividad = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.actividadUltimos7Dias.map(d => d.fecha),
        datasets: [{
          label: 'Documentos registrados',
          data: this.actividadUltimos7Dias.map(d => d.total),
          borderColor: '#3b82f6',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid:  { color: 'rgba(255,255,255,0.04)' }
          },
          y: {
            ticks: { color: '#64748b', stepSize: 1 },
            grid:  { color: 'rgba(255,255,255,0.04)' },
            min: 0
          }
        }
      }
    });
  }

  // ── Navegación ───────────────────────────────────────────
  verDetalle(numeroTramite: string): void {
    this.router.navigate(['/documentos', numeroTramite]);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ── Fecha formateada legible ─────────────────────────────
  formatearFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Cleanup ──────────────────────────────────────────────
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartEstados?.destroy();
    this.chartAreas?.destroy();
    this.chartActividad?.destroy();
  }
}