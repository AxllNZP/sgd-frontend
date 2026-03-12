// =============================================================
// auth.interceptor.ts
// CORRECCIÓN CRÍTICA:
//   El interceptor anterior inyectaba el Bearer token en TODAS
//   las requests sin excepción, incluidos los endpoints públicos
//   de autenticación (/api/auth/**).
//
//   Problema: si hay un token antiguo en localStorage (de una
//   sesión ciudadana expirada o de otro rol), el JwtFilter lo
//   procesa, pone el rol anterior en el SecurityContext, y cuando
//   el AuthService de Spring internamente llama a métodos con
//   @PreAuthorize("hasRole('ADMINISTRADOR')"), Spring lanza 403.
//
//   Solución: excluir los endpoints públicos definidos en
//   SecurityConfig como .permitAll() — nunca necesitan token.
//
// Rutas públicas del backend (fuente: SecurityConfig.java):
//   POST /api/auth/login
//   POST /api/auth/login/ciudadano
//   POST /api/auth/registrar/natural
//   POST /api/auth/registrar/juridica
//   POST /api/auth/verificar
//   POST /api/auth/recuperar/**
//   POST /api/documentos           (registro público)
//   GET  /api/documentos/{id}      (consulta pública)
//   GET  /api/documentos/{id}/cargo
// =============================================================

import { HttpInterceptorFn } from '@angular/common/http';

// Prefijos de rutas que NO deben llevar token de Authorization.
// Coincide con los .permitAll() declarados en SecurityConfig.java.
const PUBLIC_URL_PREFIXES = [
  '/api/auth/',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Si la URL es pública, pasa sin token aunque haya uno en storage.
  const isPublic = PUBLIC_URL_PREFIXES.some(prefix => req.url.includes(prefix));
  if (isPublic) {
    return next(req);
  }

  const token = localStorage.getItem('token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq);
};