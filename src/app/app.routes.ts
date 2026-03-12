// =============================================================
// app.routes.ts
// CORRECCIÓN:
//   - Eliminada ruta duplicada 'ciudadano/mis-datos'
//     La definición repetida causaba que Angular Router registrara
//     solo la primera y descartara la segunda silenciosamente,
//     pudiendo generar comportamiento indefinido en producción.
// =============================================================

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // ── STAFF ──────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  // ── CIUDADANO (punto de entrada) ───────────────────────
  {
    path: 'ciudadano',
    loadComponent: () =>
      import('./features/auth/ciudadano/seleccion/seleccion.component')
        .then(m => m.SeleccionComponent)
  },

  // ── CIUDADANO: CAMINO A – sin cuenta ───────────────────
  {
    path: 'registro-documento',
    loadComponent: () =>
      import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
  },

  // ── CIUDADANO: CAMINO B – con cuenta ───────────────────
  {
    path: 'ciudadano/login',
    loadComponent: () =>
      import('./features/auth/ciudadano/login-ciudadano/login-ciudadano.component')
        .then(m => m.LoginCiudadanoComponent)
  },
  {
    path: 'ciudadano/registro-natural',
    loadComponent: () =>
      import('./features/auth/ciudadano/registro-natural/registro-natural.component')
        .then(m => m.RegistroNaturalComponent)
  },
  {
    // CORREGIDO: definición única (era duplicada — segunda copia eliminada)
    path: 'ciudadano/mis-datos',
    loadComponent: () =>
      import('./features/auth/ciudadano/mis-datos/mis-datos.component')
        .then(m => m.MisDatosComponent)
  },
  {
    path: 'ciudadano/recuperar',
    loadComponent: () =>
      import('./features/auth/ciudadano/recuperar/Recuperar.component')
        .then(m => m.RecuperarComponent)
  },
  {
    path: 'ciudadano/registro-juridica',
    loadComponent: () =>
      import('./features/auth/ciudadano/registro-juridica/registro-juridica.component')
        .then(m => m.RegistroJuridicaComponent)
  },
  {
    path: 'ciudadano/verificar',
    loadComponent: () =>
      import('./features/auth/ciudadano/verificar/verificar.component')
        .then(m => m.VerificarComponent)
  },
  {
    path: 'ciudadano/activar-cuenta',
    loadComponent: () =>
      import('./features/auth/ciudadano/activar-cuenta/activar-cuenta.component')
        .then(m => m.ActivarCuentaComponent)
  },

  // ── PANEL INTERNO (requiere autenticación) ─────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'documentos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/documentos/lista/lista.component').then(m => m.ListaComponent)
  },
  {
    path: 'documentos/:numeroTramite',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/documentos/detalle/detalle.component').then(m => m.DetalleComponent)
  },

  // ── ADMINISTRACIÓN (requiere rol ADMINISTRADOR) ────────
  {
    path: 'areas',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/areas/areas.component').then(m => m.AreasComponent)
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
  },

  // ── FALLBACK ───────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'login'
  }
];