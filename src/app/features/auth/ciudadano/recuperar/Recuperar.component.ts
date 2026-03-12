// =============================================================
// Recuperar.component.ts
// CORRECCIONES:
//   1. ELIMINADO: import HttpClient — el componente no debe llamar
//      a la API directamente.
//   2. AÑADIDO: RecuperacionService inyectado — ya existía en el
//      proyecto con todos los métodos tipados. El componente lo
//      ignoraba completamente y llamaba a HttpClient con URLs
//      literales y objetos sin tipo.
//   3. Toda la lógica de negocio de las 3 etapas se delega al
//      servicio, respetando el tipado de recuperacion.model.ts:
//        - RecuperacionSolicitarRequest   → solicitarCodigo()
//        - RecuperacionVerificarCodigoRequest → verificarCodigo()
//        - NuevaPasswordRequest           → cambiarPassword()
//   4. El manejo de error 429 (Too Many Requests) fue añadido.
//      El backend retorna 429 + header Retry-After: 900 cuando
//      se supera el rate limit de RateLimitService.
//   5. 'tipoPersna' se mantiene con el typo intencional del backend.
//      NO corregir: es el nombre del campo en el contrato real.
// =============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RecuperacionService } from '../../../../core/services/recuperacion.service';
import {
  RecuperacionSolicitarRequest,
  RecuperacionVerificarCodigoRequest,
  NuevaPasswordRequest,
} from '../../../../core/models/recuperacion.model';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar.component.html',
  styleUrls: ['./Recuperar.component.css']
})
export class RecuperarComponent {

  // 1 = solicitar código   (POST /api/auth/recuperar/solicitar)
  // 2 = verificar código   (POST /api/auth/recuperar/verificar-codigo)
  // 3 = nueva contraseña   (POST /api/auth/recuperar/nueva-password)
  // 4 = éxito
  etapa: 1 | 2 | 3 | 4 = 1;

  // ── Etapa 1 → RecuperacionSolicitarRequest ─────────────────
  // Fuente: com.mesapartes.sgd.dto.RecuperacionSolicitarDTO
  // NOTA: 'tipoPersna' con typo es el contrato real — no corregir
  solicitud: RecuperacionSolicitarRequest = {
    tipoPersna:    '',   // 'NATURAL' | 'JURIDICA'
    identificador: '',   // DNI (natural) o RUC (jurídica)
    email:         ''
  };

  // ── Etapa 2 → RecuperacionVerificarCodigoRequest ───────────
  // Fuente: com.mesapartes.sgd.dto.RecuperacionVerificarCodigoDTO
  codigo = '';

  // ── Etapa 3 → NuevaPasswordRequest ────────────────────────
  // Fuente: com.mesapartes.sgd.dto.NuevaPasswordDTO
  // tipoPersna e identificador se inyectan desde solicitud al enviar
  nuevaPassword     = '';
  confirmarPassword = '';

  error    = '';
  cargando = false;

  // CORRECCIÓN: RecuperacionService inyectado — HttpClient eliminado
  constructor(
    private recuperacionService: RecuperacionService,
    private router: Router
  ) {}

  // ── Validación etapa 1 ────────────────────────────────────
  private validarSolicitud(): boolean {
    if (!this.solicitud.tipoPersna) {
      this.error = 'Seleccione el tipo de persona.'; return false;
    }
    if (!this.solicitud.identificador.trim()) {
      this.error = this.solicitud.tipoPersna === 'JURIDICA'
        ? 'Ingrese su RUC.'
        : 'Ingrese su número de documento.';
      return false;
    }
    if (!this.solicitud.email.trim()) {
      this.error = 'Ingrese su correo electrónico.'; return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.solicitud.email)) {
      this.error = 'El formato del correo no es válido.'; return false;
    }
    return true;
  }

  // ── ETAPA 1: POST /api/auth/recuperar/solicitar ───────────
  // CORRECCIÓN: RecuperacionService.solicitarCodigo() — tipado correcto
  // Backend retorna: 200 OK (void) | 429 Too Many Requests (rate limit)
  solicitarCodigo(): void {
    this.error = '';
    if (!this.validarSolicitud()) return;

    this.cargando = true;

    // solicitud ya es RecuperacionSolicitarRequest — sin objeto literal
    this.recuperacionService.solicitarCodigo(this.solicitud).subscribe({
      next: () => {
        this.cargando = false;
        this.etapa = 2;
      },
      error: (err) => {
        this.cargando = false;
        // 429 = rate limit — backend envía header Retry-After: 900 (15 min)
        if (err.status === 429) {
          this.error = 'Demasiados intentos. Espere 15 minutos antes de volver a intentarlo.';
        } else {
          this.error = err.error?.message || 'No se encontró la cuenta o el correo no coincide.';
        }
      }
    });
  }

  // ── ETAPA 2: POST /api/auth/recuperar/verificar-codigo ────
  // CORRECCIÓN: RecuperacionService.verificarCodigo() — tipado correcto
  // Backend retorna: 200 OK (void) | 400/500 si código inválido/expirado
  verificarCodigo(): void {
    this.error = '';
    if (!this.codigo.trim()) { this.error = 'Ingrese el código recibido.'; return; }
    if (this.codigo.length !== 6) { this.error = 'El código debe tener 6 dígitos.'; return; }

    this.cargando = true;

    const request: RecuperacionVerificarCodigoRequest = {
      tipoPersna:    this.solicitud.tipoPersna,
      identificador: this.solicitud.identificador,
      codigo:        this.codigo
    };

    this.recuperacionService.verificarCodigo(request).subscribe({
      next: () => {
        this.cargando = false;
        this.etapa = 3;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.message || 'El código es incorrecto o ha expirado.';
      }
    });
  }

  // ── Reenviar: vuelve a llamar /solicitar ─────────────────
  reenviarCodigo(): void {
    this.codigo = '';
    this.error  = '';
    this.cargando = true;

    this.recuperacionService.solicitarCodigo(this.solicitud).subscribe({
      next: () => { this.cargando = false; },
      error: (err) => {
        this.cargando = false;
        if (err.status === 429) {
          this.error = 'Demasiados intentos. Espere 15 minutos.';
        } else {
          this.error = 'No se pudo reenviar el código.';
        }
      }
    });
  }

  // ── ETAPA 3: POST /api/auth/recuperar/nueva-password ─────
  // CORRECCIÓN: RecuperacionService.establecerNuevaPassword() — tipado correcto
  // Fuente: NuevaPasswordDTO { tipoPersna, identificador, nuevaPassword, confirmarPassword }
  // Backend valida: @Size(min=8) en nuevaPassword, coincidencia de passwords
  cambiarPassword(): void {
    this.error = '';
    if (!this.nuevaPassword) { this.error = 'Ingrese la nueva contraseña.'; return; }
    // Fuente: @Size(min=8) en NuevaPasswordDTO.nuevaPassword
    if (this.nuevaPassword.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.'; return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.error = 'Las contraseñas no coinciden.'; return;
    }

    this.cargando = true;

    const request: NuevaPasswordRequest = {
      tipoPersna:        this.solicitud.tipoPersna,
      identificador:     this.solicitud.identificador,
      nuevaPassword:     this.nuevaPassword,
      confirmarPassword: this.confirmarPassword
    };

    this.recuperacionService.establecerNuevaPassword(request).subscribe({
      next: () => {
        this.cargando = false;
        this.etapa = 4;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.message || 'No se pudo cambiar la contraseña.';
      }
    });
  }

  irAlLogin(): void {
    this.router.navigate(['/ciudadano/login']);
  }

  get labelIdentificador(): string {
    return this.solicitud.tipoPersna === 'JURIDICA' ? 'RUC' : 'Número de documento (DNI)';
  }
}