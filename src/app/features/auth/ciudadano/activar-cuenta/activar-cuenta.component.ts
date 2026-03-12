// =============================================================
// activar-cuenta.component.ts
// CORRECCIONES CRÍTICAS:
//   1. ELIMINADO: import HttpClient, HttpParams — componente no debe llamar la API directo
//   2. ELIMINADO: URLs hardcodeadas 'http://localhost:8080/...'
//   3. AÑADIDO: CiudadanoService inyectado — centraliza llamadas a:
//      - POST /api/auth/reenviar-codigo (reenviarCodigo)
//      - POST /api/auth/verificar (verificarCodigo)
//   4. AÑADIDO: manejo específico de códigos HTTP por etapa:
//      - 404 → Cuenta no encontrada
//      - 409 → Cuenta ya verificada
//      - 400 → Código inválido o expirado
// =============================================================

import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CiudadanoService } from '../../../../core/services/ciudadano.service';
import { SoloNumerosDirective } from '../../../../shared/directives/solo-numeros.directive';
import { validarDniRuc } from '../../../../shared/validators/validators';

@Component({
  selector: 'app-activar-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SoloNumerosDirective],
  templateUrl: './activar-cuenta.component.html',
  styleUrl: './activar-cuenta.component.css'
})
export class ActivarCuentaComponent implements OnDestroy {

  // Etapa 1 = ingresar datos para recibir/reenviar código
  // Etapa 2 = ingresar el código para activar
  etapa: 1 | 2 = 1;

  // 'tipoPersna' mantiene el typo intencional del backend — NO corregir
  // Fuente: @RequestParam String tipoPersna en POST /api/auth/reenviar-codigo
  form = {
    tipoPersna: 'NATURAL' as 'NATURAL' | 'JURIDICA',
    identificador: ''
  };

  codigo = '';
  loading = false;
  errorMsg = '';
  successMsg = '';

  // Countdown para reenvío
  reenvioDisabled = false;
  countdown = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  // CORRECCIÓN: CiudadanoService en lugar de HttpClient
  constructor(private ciudadanoService: CiudadanoService, private router: Router) {}

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // ── ETAPA 1: Reenviar código ──────────────────────────────
  enviarCodigo(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.form.identificador.trim()) {
      this.errorMsg = this.form.tipoPersna === 'NATURAL'
        ? 'Ingrese su número de documento.'
        : 'Ingrese su RUC.';
      return;
    }

    const { valido, tipo } = validarDniRuc(this.form.identificador);
    if (!valido) {
      this.errorMsg = this.form.tipoPersna === 'NATURAL'
        ? 'El DNI debe tener 8 dígitos.'
        : 'El RUC debe tener 11 dígitos.';
      return;
    }

    // Sincronizar tipoPersna con lo que el usuario realmente ingresó
    this.form.tipoPersna = tipo!;
    this.loading = true;

    // CiudadanoService.reenviarCodigo() usa URL relativa /api/auth/reenviar-codigo
    this.ciudadanoService.reenviarCodigo(
      this.form.tipoPersna,
      this.form.identificador.trim()
    ).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Código enviado a su correo registrado.';
        this.etapa = 2;
        this.iniciarCountdown();
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMsg = this.resolverErrorEnvio(err);
      }
    });
  }

  // ── ETAPA 2: Verificar código ─────────────────────────────
  verificar(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.codigo.trim() || this.codigo.length !== 6) {
      this.errorMsg = 'Ingrese el código de 6 dígitos.';
      return;
    }

    this.loading = true;

    // CiudadanoService.verificarCodigo() usa URL relativa /api/auth/verificar
    // Body: VerificacionCodigoDTO { tipoPersna, identificador, codigo }
    this.ciudadanoService.verificarCodigo({
      tipoPersna:    this.form.tipoPersna,
      identificador: this.form.identificador.trim(),
      codigo:        this.codigo.trim()
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = '¡Cuenta activada! Redirigiendo...';
        if (this.timer) {
          clearInterval(this.timer);
        }
        setTimeout(() => this.router.navigate(['/ciudadano/login']), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMsg = this.resolverErrorVerificacion(err);
      }
    });
  }

  reenviarCodigo(): void {
    if (this.reenvioDisabled) return;
    this.etapa = 1;
    this.codigo = '';
    this.errorMsg = '';
    this.successMsg = '';
  }

  // Requerido por el HTML: (click)="volver()" en etapa 2
  // Permite corregir los datos volviendo a la etapa 1
  volver(): void {
    this.etapa = 1;
    this.codigo = '';
    this.errorMsg = '';
    this.successMsg = '';
    if (this.timer) {
      clearInterval(this.timer);
      this.reenvioDisabled = false;
      this.countdown = 0;
    }
  }

  private iniciarCountdown(): void {
    this.countdown = 60;
    this.reenvioDisabled = true;
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.reenvioDisabled = false;
        if (this.timer) {
          clearInterval(this.timer);
        }
      }
    }, 1000);
  }

  // Códigos HTTP específicos para el reenvío de código
  private resolverErrorEnvio(err: HttpErrorResponse): string {
    if (err.status === 404) {
      return 'No existe una cuenta registrada con ese DNI/RUC.';
    }
    if (err.status === 409) {
      return 'Esta cuenta ya ha sido verificada. Puede iniciar sesión.';
    }
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique su conexión.';
    }
    return err.error?.message || 'No se encontró la cuenta o ya está verificada.';
  }

  // Códigos HTTP específicos para la verificación del código
  private resolverErrorVerificacion(err: HttpErrorResponse): string {
    if (err.status === 400) {
      return 'Código inválido o expirado. Solicite uno nuevo.';
    }
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique su conexión.';
    }
    return err.error?.message || 'Error al verificar el código. Intente nuevamente.';
  }
}