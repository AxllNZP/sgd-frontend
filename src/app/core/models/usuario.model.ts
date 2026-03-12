// =============================================================
// usuario.model.ts
// Mapeado 1:1 con los DTOs del backend
// Fuente: com.mesapartes.sgd.dto.UsuarioRequestDTO
//         com.mesapartes.sgd.dto.UsuarioResponseDTO
//         com.mesapartes.sgd.dto.LoginRequestDTO
//         com.mesapartes.sgd.dto.LoginResponseDTO
// =============================================================

// ── Enum de roles ─────────────────────────────────────────────
// Fuente: com.mesapartes.sgd.entity.RolUsuario
export type RolUsuario = 'CIUDADANO' | 'MESA_PARTES' | 'ADMINISTRADOR';

// ── UsuarioRequestDTO ────────────────────────────────────────
// Se envía como @RequestBody en POST /api/usuarios
// Solo ADMINISTRADOR puede crear usuarios internos
export interface UsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
}

// ── UsuarioResponseDTO ───────────────────────────────────────
// CORRECCIONES vs versión anterior:
//   ~ id:            string  (UUID serializado como string en JSON)
//   ~ fechaCreacion: string  (LocalDateTime → ISO string en JSON)
export interface UsuarioResponse {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fechaCreacion: string;    // ISO-8601 (LocalDateTime → string en JSON)
}

// ── LoginRequestDTO ──────────────────────────────────────────
// Se envía como @RequestBody en POST /api/auth/login (staff interno)
export interface LoginRequest {
  email: string;
  password: string;
}

// ── LoginResponseDTO ─────────────────────────────────────────
// Respuesta de POST /api/auth/login  Y  POST /api/auth/login/ciudadano
export interface LoginResponse {
  token: string;
  email: string;
  rol: string;
  nombre: string;
}