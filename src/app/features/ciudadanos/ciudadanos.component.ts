// ciudadanos.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AdminCiudadanosService } from '../../core/services/admin-ciudadanos.service';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import {
  CiudadanoNaturalResumen,
  CiudadanoJuridicaResumen,
  CiudadanoFiltro,
  EstadisticasCiudadanos,
} from '../../core/models/ciudadano-admin.model';
import { PageResponse } from '../../core/models/documento.model';

@Component({
  selector: 'app-ciudadanos',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './ciudadanos.component.html',
  styleUrl: './ciudadanos.component.css'
})
export class CiudadanosComponent implements OnInit {

  // ── Pestaña activa ────────────────────────────────────────
  // 'naturales' | 'juridicas'
  tab: 'naturales' | 'juridicas' = 'naturales';

  // ── Estadísticas ─────────────────────────────────────────
  stats: EstadisticasCiudadanos | null = null;

  // ── Datos de tabla ────────────────────────────────────────
  naturales:  CiudadanoNaturalResumen[]  = [];
  juridicas:  CiudadanoJuridicaResumen[] = [];

  // ── Paginación (0-based — Spring Pageable) ────────────────
  paginaN = 0; totalPaginasN = 0; totalN = 0;
  paginaJ = 0; totalPaginasJ = 0; totalJ = 0;
  readonly SIZE = 15;

  // ── Búsqueda dinámica ─────────────────────────────────────
  filtro: CiudadanoFiltro = { busqueda: '', activo: null };
  private busqueda$ = new Subject<string>();

  // ── Estado UI ─────────────────────────────────────────────
  cargando = false;
  error    = '';

  constructor(
    private svc: AdminCiudadanosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarNaturales(0);
    this.cargarJuridicas(0);

    // Debounce en el buscador — espera 350ms antes de lanzar la query
    // Evita una petición por cada tecla presionada
    this.busqueda$.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(() => {
      this.tab === 'naturales'
        ? this.cargarNaturales(0)
        : this.cargarJuridicas(0);
    });
  }

  // ── Estadísticas ─────────────────────────────────────────
  cargarEstadisticas(): void {
    this.svc.estadisticas().subscribe({
      next: (s) => this.stats = s,
      error: () => {}
    });
  }

  // ── Carga de tablas ───────────────────────────────────────
  cargarNaturales(pagina: number): void {
    this.cargando = true;
    this.error    = '';

    const tienesFiltro = this.filtro.busqueda.trim() || this.filtro.activo !== null;
    const obs = tienesFiltro
      ? this.svc.buscarNaturales(this.filtro, pagina, this.SIZE)
      : this.svc.listarNaturales(pagina, this.SIZE);

    obs.subscribe({
      next: (page: PageResponse<CiudadanoNaturalResumen>) => {
        this.naturales      = page.content;
        this.paginaN        = page.number;
        this.totalPaginasN  = page.totalPages;
        this.totalN         = page.totalElements;
        this.cargando       = false;
      },
      error: () => { this.error = 'Error al cargar los datos.'; this.cargando = false; }
    });
  }

  cargarJuridicas(pagina: number): void {
    this.cargando = true;
    this.error    = '';

    const tienesFiltro = this.filtro.busqueda.trim() || this.filtro.activo !== null;
    const obs = tienesFiltro
      ? this.svc.buscarJuridicas(this.filtro, pagina, this.SIZE)
      : this.svc.listarJuridicas(pagina, this.SIZE);

    obs.subscribe({
      next: (page: PageResponse<CiudadanoJuridicaResumen>) => {
        this.juridicas      = page.content;
        this.paginaJ        = page.number;
        this.totalPaginasJ  = page.totalPages;
        this.totalJ         = page.totalElements;
        this.cargando       = false;
      },
      error: () => { this.error = 'Error al cargar los datos.'; this.cargando = false; }
    });
  }

  // ── Búsqueda reactiva ─────────────────────────────────────
  onBusquedaCambia(): void {
    this.busqueda$.next(this.filtro.busqueda);
  }

  onFiltroCambia(): void {
    // Cambios en el select de estado son inmediatos
    this.tab === 'naturales'
      ? this.cargarNaturales(0)
      : this.cargarJuridicas(0);
  }

  cambiarTab(t: 'naturales' | 'juridicas'): void {
    this.tab = t;
    this.filtro = { busqueda: '', activo: null };
  }

  // ── Acciones ──────────────────────────────────────────────
  toggleNatural(n: CiudadanoNaturalResumen): void {
    const accion = n.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${accion} a ${n.nombres} ${n.apellidoPaterno}?`)) return;

    this.svc.toggleNatural(n.numeroDocumento, !n.activo).subscribe({
      next: (actualizado) => {
        // Actualiza en memoria sin recargar toda la tabla
        const i = this.naturales.findIndex(x => x.id === n.id);
        if (i >= 0) this.naturales[i] = actualizado;
        this.cargarEstadisticas();
      },
      error: () => this.error = 'Error al cambiar el estado.'
    });
  }

  toggleJuridica(j: CiudadanoJuridicaResumen): void {
    const accion = j.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${accion} a ${j.razonSocial}?`)) return;

    this.svc.toggleJuridica(j.ruc, !j.activo).subscribe({
      next: (actualizado) => {
        const i = this.juridicas.findIndex(x => x.id === j.id);
        if (i >= 0) this.juridicas[i] = actualizado;
        this.cargarEstadisticas();
      },
      error: () => this.error = 'Error al cambiar el estado.'
    });
  }

  eliminarNatural(n: CiudadanoNaturalResumen): void {
    if (!confirm(`⚠️ Eliminar permanentemente a ${n.nombres} ${n.apellidoPaterno}?\nEsta acción no se puede deshacer.`)) return;

    this.svc.eliminarNatural(n.numeroDocumento).subscribe({
      next: () => {
        this.cargarNaturales(this.paginaN);
        this.cargarEstadisticas();
      },
      error: () => this.error = 'Error al eliminar.'
    });
  }

  eliminarJuridica(j: CiudadanoJuridicaResumen): void {
    if (!confirm(`⚠️ Eliminar permanentemente a ${j.razonSocial}?\nEsta acción no se puede deshacer.`)) return;

    this.svc.eliminarJuridica(j.ruc).subscribe({
      next: () => {
        this.cargarJuridicas(this.paginaJ);
        this.cargarEstadisticas();
      },
      error: () => this.error = 'Error al eliminar.'
    });
  }

  // ── Paginación helpers ────────────────────────────────────
  getPaginasN(): number[] { return this.rangoPaginas(this.paginaN, this.totalPaginasN); }
  getPaginasJ(): number[] { return this.rangoPaginas(this.paginaJ, this.totalPaginasJ); }

  private rangoPaginas(actual: number, total: number): number[] {
    const r = 2;
    const inicio = Math.max(0, actual - r);
    const fin    = Math.min(total - 1, actual + r);
    const out: number[] = [];
    for (let i = inicio; i <= fin; i++) out.push(i);
    return out;
  }

  volver(): void { this.router.navigate(['/dashboard']); }
}
