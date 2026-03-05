import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-activar-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './activar-cuenta.component.html',
  styleUrl: './activar-cuenta.component.css'

})
export class ActivarCuentaComponent {

  // Etapa 1 = ingresar datos para recibir/reenviar código
  // Etapa 2 = ingresar el código para activar
  etapa: 1 | 2 = 1;

  form = {
    tipoPersna: 'NATURAL',
    identificador: ''
  };

  codigo = '';
  loading = false;
  errorMsg = '';
  successMsg = '';

  // Countdown para reenvío
  reenvioDisabled = false;
  countdown = 0;
  private timer: any;

  constructor(private http: HttpClient, private router: Router) {}

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

    this.loading = true;

    const params = new HttpParams()
      .set('tipoPersna', this.form.tipoPersna)
      .set('identificador', this.form.identificador.trim());

    this.http.post('http://localhost:8080/api/auth/reenviar-codigo', null, { params })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = 'Código enviado a su correo registrado.';
          this.etapa = 2;
          this.iniciarCountdown();
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err.error?.message || 'No se encontró la cuenta o ya está verificada.';
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

    this.http.post('http://localhost:8080/api/auth/verificar', {
      tipoPersna: this.form.tipoPersna,
      identificador: this.form.identificador.trim(),
      codigo: this.codigo.trim()
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = '¡Cuenta activada! Redirigiendo al inicio de sesión...';
        setTimeout(() => this.router.navigate(['/ciudadano/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Código incorrecto o expirado.';
      }
    });
  }

  // ── Reenviar código desde etapa 2 ────────────────────────
  reenviarCodigo(): void {
    if (this.reenvioDisabled) return;
    this.errorMsg = '';
    this.successMsg = '';

    const params = new HttpParams()
      .set('tipoPersna', this.form.tipoPersna)
      .set('identificador', this.form.identificador.trim());

    this.http.post('http://localhost:8080/api/auth/reenviar-codigo', null, { params })
      .subscribe({
        next: () => {
          this.successMsg = 'Código reenviado. Revise su correo.';
          this.codigo = '';
          this.iniciarCountdown();
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'No se pudo reenviar el código.';
        }
      });
  }

  volver(): void {
    this.etapa = 1;
    this.codigo = '';
    this.errorMsg = '';
    this.successMsg = '';
    if (this.timer) clearInterval(this.timer);
  }

  private iniciarCountdown(): void {
    this.reenvioDisabled = true;
    this.countdown = 60;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.reenvioDisabled = false;
      }
    }, 1000);
  }
}