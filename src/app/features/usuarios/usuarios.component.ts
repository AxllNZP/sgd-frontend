// =============================================================
// usuarios.component.ts — VERSIÓN MEJORADA
//
// 📚 LECCIÓN — "Derive estadísticas del array, no del servidor"
//   El backend devuelve List<UsuarioResponseDTO> completo.
//   En lugar de pedir un endpoint de estadísticas, derivamos
//   los contadores filtrando el array en memoria.
//   Esto es O(n) y para < 1000 usuarios es imperceptible.
// =============================================================

import {
  Component, OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router }        from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { UsuarioService }              from '../../core/services/usuario.service';
import { UsuarioResponse, UsuarioRequest } from '../../core/models/usuario.model';

// ── Tipo de los roles disponibles ────────────────────────────
// Contract-First: mapea con el enum Rol del backend
type RolBackend = 'ADMINISTRADOR' | 'MESA_PARTES' | 'CIUDADANO';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl:    './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  // ── Data ─────────────────────────────────────────────────
  todos:    UsuarioResponse[] = [];   // caché completo para filtrado local
  tabla:    UsuarioResponse[] = [];   // lo que se muestra en la tabla

  // ── KPIs derivados del array ─────────────────────────────
  totalUsuarios  = 0;
  totalActivos   = 0;
  totalInactivos = 0;
  totalAdmins    = 0;
  totalMesa      = 0;

  // ── Búsqueda y filtros ───────────────────────────────────
  terminoBusqueda = '';
  filtroRol: RolBackend | '' = '';
  filtroEstado: 'activo' | 'inactivo' | '' = '';

  // ── Paginación local ─────────────────────────────────────
  paginaActual   = 0;
  itemsPorPagina = 10;
  totalPaginas   = 0;
  totalFiltrados = 0;
  protected Math = Math;

  // ── Estado UI ────────────────────────────────────────────
  cargando      = false;
  errorMsg      = '';
  mostrarDialog = false;
  guardando     = false;

  // ── Formulario nuevo usuario ─────────────────────────────
  // Contract-First: campos mapean 1:1 con UsuarioRequestDTO del backend
  nuevoUsuario: UsuarioRequest = {
    nombre:   '',
    email:    '',
    password: '',
    rol:      'MESA_PARTES'   // default más útil para este panel
  };
  errorDialog = '';

  // ── Opciones de rol para el select ───────────────────────
  // Contract-First: valores exactos del enum Rol del backend
  readonly rolesSelect: Array<{ label: string; value: RolBackend }> = [
    { label: 'Mesa de Partes',  value: 'MESA_PARTES'   },
    { label: 'Administrador',   value: 'ADMINISTRADOR' },
  ];

  // ── Filtros de rol para la tabla ─────────────────────────
  readonly rolesFiltro: Array<{ label: string; value: RolBackend | '' }> = [
    { label: 'Todos',         value: ''              },
    { label: 'Administrador', value: 'ADMINISTRADOR' },
    { label: 'Mesa de Partes',value: 'MESA_PARTES'   },
  ];

  constructor(
    private usuarioService: UsuarioService,
    private router:         Router,
    private cdr:            ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.listar();
  }

  // ── Carga desde el backend ────────────────────────────────
  listar(): void {
    this.cargando = true;
    this.errorMsg = '';
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.todos    = usuarios;
        this.cargando = false;
        this.calcularKpis();
        this.cdr.detectChanges();
        this.aplicarFiltro();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.errorMsg = 'No se pudieron cargar los usuarios.';
      }
    });
  }

  // ── Derivar KPIs del array completo ──────────────────────
  // 📚 LECCIÓN: filter() + length es la forma idiomática de
  // contar elementos que cumplan una condición en TypeScript.
  private calcularKpis(): void {
    this.totalUsuarios  = this.todos.length;
    this.totalActivos   = this.todos.filter(u => u.activo).length;
    this.totalInactivos = this.todos.filter(u => !u.activo).length;
    this.totalAdmins    = this.todos.filter(u => u.rol === 'ADMINISTRADOR').length;
    this.totalMesa      = this.todos.filter(u => u.rol === 'MESA_PARTES').length;
  }

  // ── Filtrado local ────────────────────────────────────────
  onBusquedaCambio(): void {
    this.paginaActual = 0;
    this.aplicarFiltro();
  }

  onFiltroCambio(): void {
    this.paginaActual = 0;
    this.aplicarFiltro();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroRol       = '';
    this.filtroEstado    = '';
    this.paginaActual    = 0;
    this.aplicarFiltro();
  }

  get hayFiltrosActivos(): boolean {
    return !!(this.terminoBusqueda || this.filtroRol || this.filtroEstado);
  }

  private aplicarFiltro(): void {
    let resultado = [...this.todos];

    // Filtro por rol
    if (this.filtroRol) {
      resultado = resultado.filter(u => u.rol === this.filtroRol);
    }

    // Filtro por estado
    if (this.filtroEstado === 'activo')   resultado = resultado.filter(u => u.activo);
    if (this.filtroEstado === 'inactivo') resultado = resultado.filter(u => !u.activo);

    // Búsqueda por texto
    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      resultado = resultado.filter(u =>
        u.nombre.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t)
      );
    }

    // Paginación local
    this.totalFiltrados = resultado.length;
    this.totalPaginas   = Math.ceil(resultado.length / this.itemsPorPagina);
    const inicio        = this.paginaActual * this.itemsPorPagina;
    this.tabla          = resultado.slice(inicio, inicio + this.itemsPorPagina);
  }

  irAPagina(p: number): void {
    if (p < 0 || p >= this.totalPaginas) return;
    this.paginaActual = p;
    this.aplicarFiltro();
  }

  getPaginas(): number[] {
    const r = 2;
    const ini = Math.max(0, this.paginaActual - r);
    const fin = Math.min(this.totalPaginas - 1, this.paginaActual + r);
    const p: number[] = [];
    for (let i = ini; i <= fin; i++) p.push(i);
    return p;
  }

  getDesde(): number { return this.paginaActual * this.itemsPorPagina + 1; }
  getHasta(): number {
    return Math.min((this.paginaActual + 1) * this.itemsPorPagina, this.totalFiltrados);
  }

  // ── Dialog de nuevo usuario ───────────────────────────────
  abrirDialog(): void {
    this.nuevoUsuario = { nombre: '', email: '', password: '', rol: 'MESA_PARTES' };
    this.errorDialog  = '';
    this.mostrarDialog = true;
  }

  cerrarDialog(): void {
    this.mostrarDialog = false;
  }

  crear(): void {
    const { nombre, email, password } = this.nuevoUsuario;
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      this.errorDialog = 'Todos los campos son obligatorios.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorDialog = 'El correo no tiene un formato válido.';
      return;
    }
    if (password.length < 6) {
      this.errorDialog = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.guardando   = true;
    this.errorDialog = '';

    this.usuarioService.crear(this.nuevoUsuario).subscribe({
      next: () => {
        this.guardando     = false;
        this.mostrarDialog = false;
        this.listar();   // recarga y recalcula KPIs
      },
      error: (err: HttpErrorResponse) => {
        this.guardando   = false;
        // 409 = email ya en uso (BusinessConflictException del backend)
        this.errorDialog = err.status === 409
          ? 'Ya existe un usuario con ese correo.'
          : 'Error al crear el usuario. Inténtelo de nuevo.';
      }
    });
  }

  // ── Desactivar usuario ────────────────────────────────────
  desactivar(id: string, nombre: string): void {
    if (!confirm(`¿Desactivar a "${nombre}"? Esta acción no puede deshacerse.`)) return;
    this.usuarioService.desactivar(id).subscribe({
      next: () => this.listar()
    });
  }

  // ── Helpers de UI ────────────────────────────────────────
  getRolLabel(rol: string): string {
    if (rol === 'ADMINISTRADOR') return 'Admin';
    if (rol === 'MESA_PARTES')   return 'Mesa de Partes';
    return rol;
  }

  // Clase CSS del badge de rol — mismo sistema que el dashboard
  getRolClass(rol: string): string {
    if (rol === 'ADMINISTRADOR') return 'badge-admin';
    if (rol === 'MESA_PARTES')   return 'badge-mesa';
    return 'badge-default';
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }
}