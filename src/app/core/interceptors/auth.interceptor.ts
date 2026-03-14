import { HttpInterceptorFn } from '@angular/common/http';

// Rutas que NUNCA deben llevar Authorization header.
// Mapeadas desde SecurityConfig.java → .permitAll()
const PUBLIC_URL_PREFIXES = [
  '/api/auth/login',
  '/api/auth/login/ciudadano',
  '/api/auth/registro',
  '/api/auth/verificar',
  '/api/auth/recuperar',
  '/api/auth/reenviar-codigo',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Verificación exacta por startsWith — más segura que includes()
  // porque evita falsos positivos si algún endpoint privado
  // tuviera "auth" en otra parte de la URL.
  const isPublic = PUBLIC_URL_PREFIXES.some(prefix =>
    req.url.startsWith(prefix)
  );

  if (isPublic) {
    // Ruta pública: pasa sin token, aunque haya uno en storage.
    // Esto previene que el JwtFilter del backend rechace la request
    // con 403 por un token expirado de sesión anterior.
    return next(req);
  }

  const token = localStorage.getItem('token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq);
};