import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro-documento',
    loadComponent: () =>
      import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
  },
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
  {
    path: 'usuarios',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
  },
  {
    path: 'areas',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/areas/areas.component').then(m => m.AreasComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];