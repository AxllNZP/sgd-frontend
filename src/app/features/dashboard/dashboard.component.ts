// =============================================================
// dashboard.component.ts — CORRECCIÓN: forkJoin condicional por rol
//
// 📚 LECCIÓN — "El problema del forkJoin rígido"
//
//   forkJoin({ a, b, c }) emite SOLO cuando los 3 completan.
//   Si CUALQUIERA lanza error (403 incluido), forkJoin cancela
//   TODO y ejecuta el bloque error(). Por eso MESA_PARTES veía
//   "No se pudieron cargar los datos del panel" con todos los
//   KPI en 0, aunque SÍ tenía permiso para /api/documentos.
//
// SOLUCIÓN: dos capas de defensa
//   1. Si el rol NO es ADMINISTRADOR → sustituir áreas y usuarios
//      por of([]) y of([]) antes de hacer cualquier HTTP call.
//      Esto evita el 403 por completo.
//   2. catchError en cada observable como última línea de defensa,
//      por si en el futuro cambian los permisos sin avisar.
//
// REGLA INVIOLABLE: NO se toca SecurityConfig.java ni ningún
// archivo del backend. El frontend se adapta al servidor.
// =============================================================

import {
  Component, OnInit, AfterViewInit,
  ElementRef, ViewChild, OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';
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

interface ActividadDia {
  fecha: string;
  total: number;
}

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

  @ViewChild('graficoEstados')   graficoEstadosRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoAreas')     graficoAreasRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoActividad') graficoActividadRef!: ElementRef<HTMLCanvasElement>;

  nombre = '';
  rol    = '';

  // ── KPI counters ─────────────────────────────────────────
  totalDocumentos = 0;
  recibidos       = 0;
  enProceso       = 0;
  observados      = 0;
  archivados      = 0;
  totalAreas      = 0;
  totalUsuarios   = 0;

  // ── Tabla / búsqueda ─────────────────────────────────────
  documentosTabla:    DocumentoResponse[] = [];
  todosLosDocumentos: DocumentoResponse[] = [];

  terminoBusqueda = '';
  filtroEstado: EstadoDocumento | '' = '';

  paginaActual   = 0;
  itemsPorPagina = 10;
  totalPaginas   = 0;
  totalElementos = 0;

  cargando   = false;
  errorCarga = '';

  private  actividadUltimos7Dias: ActividadDia[] = [];
  protected docsPorArea: DocsPorArea[] = [];

  protected hoyISO = new Date().toISOString();

  private chartEstados:   Chart | null = null;
  private chartAreas:     Chart | null = null;
  private chartActividad: Chart | null = null;
  private datosCargados = false;

  private destroy$ = new Subject<void>();

  protected Math = Math;

  readonly estadosFiltro: Array<{ label: string; value: EstadoDocumento | '' }> = [
    { label: 'Todos',      value: ''           },
    { label: 'Recibido',   value: 'RECIBIDO'   },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Observado',  value: 'OBSERVADO'  },
    { label: 'Archivado',  value: 'ARCHIVADO'  },
  ];

  // 📚 LECCIÓN — getter calculado
  // En lugar de guardar un booleano extra, derivamos si el usuario
  // es admin directamente del rol. Un solo punto de verdad.
  get esAdmin(): boolean {
    return this.rol === 'ADMINISTRADOR';
  }

  constructor(
    private authService:      AuthService,
    private documentoService: DocumentoService,
    private areaService:      AreaService,
    private usuarioService:   UsuarioService,
    private router:           Router,
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

  // ── CORRECCIÓN PRINCIPAL ──────────────────────────────────
  // 📚 LECCIÓN — "Observables condicionales con of()"
  //
  // of([]) crea un observable que emite inmediatamente un array
  // vacío y completa. Es el "valor neutro" para forkJoin cuando
  // no queremos (o no podemos) hacer la llamada HTTP real.
  //
  // Estructura:
  //   this.esAdmin ? this.areaService.listar() : of([])
  //   └─ Si es admin → hace el GET /api/areas
  //   └─ Si NO es admin → devuelve [] sin ninguna llamada HTTP
  //
  // catchError como segunda línea de defensa: si por alguna
  // razón el 403 llega de todos modos, lo capturamos y
  // devolvemos [] en lugar de propagar el error al forkJoin.
  cargarTodo(): void {
    this.cargando   = true;
    this.errorCarga = '';

    // Observables condicionales según el rol
    const areas$ = this.esAdmin
      ? this.areaService.listar().pipe(
          catchError(() => of([] as AreaResponse[]))
        )
      : of([] as AreaResponse[]);

    const usuarios$ = this.esAdmin
      ? this.usuarioService.listar().pipe(
          catchError(() => of([] as UsuarioResponse[]))
        )
      : of([] as UsuarioResponse[]);

    forkJoin({
      docs:     this.documentoService.listarTodos(0, 500).pipe(
        catchError(() => {
          // Si falla documentos (no debería), devolvemos página vacía
          return of({
            content: [], totalElements: 0, totalPages: 0,
            number: 0, size: 0, first: true, last: true, empty: true
          } as PageResponse<DocumentoResponse>);
        })
      ),
      areas:    areas$,
      usuarios: usuarios$
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ docs, areas, usuarios }) => {
        this.procesarDocumentos(docs);
        this.procesarAreas(areas);
        this.procesarUsuarios(usuarios);

        this.cargando      = false;
        this.datosCargados = true;

        this.cdr.detectChanges();
        this.crearTodosLosGraficos();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando   = false;
        this.errorCarga = 'No se pudieron cargar los datos del panel.';
      }
    });
  }

  private procesarDocumentos(page: PageResponse<DocumentoResponse>): void {
    const docs = page.content;

    this.totalDocumentos = page.totalElements;
    this.recibidos  = docs.filter(d => d.estado === 'RECIBIDO').length;
    this.enProceso  = docs.filter(d => d.estado === 'EN_PROCESO').length;
    this.observados = docs.filter(d => d.estado === 'OBSERVADO').length;
    this.archivados = docs.filter(d => d.estado === 'ARCHIVADO').length;

    this.todosLosDocumentos = docs;

    this.paginaActual   = page.number;
    this.totalPaginas   = page.totalPages;
    this.totalElementos = page.totalElements;
    this.aplicarFiltroLocal();

    const mapaAreas = docs.reduce<Record<string, number>>((acc, doc) => {
      const nombre = doc.areaNombre ?? 'Sin área';
      acc[nombre] = (acc[nombre] ?? 0) + 1;
      return acc;
    }, {});
    this.docsPorArea = Object.entries(mapaAreas)
      .map(([area, total]) => ({ area, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

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

  // 📚 LECCIÓN — cuando el array llega vacío (MESA_PARTES),
  // filter() devuelve 0, lo que es correcto: no se muestran
  // áreas activas en la KPI, en lugar de lanzar un error.
  private procesarAreas(areas: AreaResponse[]): void {
    this.totalAreas = areas.filter(a => a.activa).length;
  }

  private procesarUsuarios(usuarios: UsuarioResponse[]): void {
    this.totalUsuarios = usuarios.filter(u => u.activo).length;
  }

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

    if (this.filtroEstado) {
      filtrados = filtrados.filter(d => d.estado === this.filtroEstado);
    }

    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (termino) {
      filtrados = filtrados.filter(d =>
        d.remitente.toLowerCase().includes(termino)     ||
        d.asunto.toLowerCase().includes(termino)        ||
        d.numeroTramite.toLowerCase().includes(termino) ||
        (d.areaNombre?.toLowerCase().includes(termino) ?? false)
      );
    }

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
        indexAxis: 'y',
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

  verDetalle(numeroTramite: string): void {
    this.router.navigate(['/documentos', numeroTramite]);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatearFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartEstados?.destroy();
    this.chartAreas?.destroy();
    this.chartActividad?.destroy();
  }
}
