// auth.interceptor.ts — VERSIÓN DEFINITIVA
// Fuente de verdad: SecurityConfig.java

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // ── 1. Todo /api/auth/** es público ──────────────────────
  const esAuth = req.url.includes('/api/auth/');

  // ── 2. POST /api/documentos — registro público ───────────
  // Solo el endpoint raíz, sin sub-ruta.
  // El $ al final asegura que no haya nada después (ni /buscar)
  // Fuente: .requestMatchers(HttpMethod.POST, "/api/documentos").permitAll()
  const esRegistroPublico =
    req.method === 'POST' &&
    /\/api\/documentos(\?.*)?$/.test(req.url);

  // ── 3. GET /api/documentos/{id} — consulta pública ───────
  // Solo cuando el número de trámite es el ÚLTIMO segmento de la URL.
  // El $ final excluye: /descargar, /descargar-anexo, /estado, /area, etc.
  // Fuente: .requestMatchers(HttpMethod.GET, "/api/documentos/*").permitAll()
  //
  // ✅ coincide:  /api/documentos/MP-20260305-ABC123
  // ❌ no coincide: /api/documentos/MP-20260305-ABC123/descargar  ← protegido
  // ❌ no coincide: /api/documentos/MP-20260305-ABC123/cargo      ← tratado aparte
  const esConsultaPublica =
    req.method === 'GET' &&
    /\/api\/documentos\/[^/?]+(\?.*)?$/.test(req.url);

  // ── 4. GET /api/documentos/{id}/cargo — cargo público ────
  // Fuente: .requestMatchers(HttpMethod.GET, "/api/documentos/*/cargo").permitAll()
  const esCargo =
    req.method === 'GET' &&
    /\/api\/documentos\/[^/?]+\/cargo(\?.*)?$/.test(req.url);

  if (esAuth || esRegistroPublico || esConsultaPublica || esCargo) {
    return next(req);  // pasa SIN token
  }

  // ── Todo lo demás lleva token si existe ──────────────────
  // Incluye: descargar, descargar-anexo, estado, area, listar, buscar...
  const token = localStorage.getItem('token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq);
};
