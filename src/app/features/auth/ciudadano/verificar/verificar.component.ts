import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-verificar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verificar.component.html',
  styleUrl: './verificar.component.css'
})
export class VerificarComponent implements OnInit, OnDestroy {

  digits: string[] = ['', '', '', '', '', ''];
  loading = false;
  errorMsg = '';
  successMsg = '';

  // Datos recibidos del registro
  identificador = '';
  tipoPersna = '';

  // Reenvío con countdown
  reenvioDisabled = true;
  countdown = 60;
  private timer: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { identificador: string; tipoPersna: string } | null;
    if (state) {
      this.identificador = state.identificador;
      this.tipoPersna = state.tipoPersna;
    }
  }

  ngOnInit(): void {
    // Si no vino del registro, intentar de history.state
    const state = history.state;
    if (!this.identificador && state?.identificador) {
      this.identificador = state.identificador;
      this.tipoPersna = state.tipoPersna;
    }
    this.iniciarCountdown();
    setTimeout(() => document.getElementById('digit-0')?.focus(), 200);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  get codigoCompleto(): boolean {
    return this.digits.every(d => d !== '');
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    this.digits[index] = value ? value[0] : '';

    if (this.digits[index] && index < 5) {
      document.getElementById('digit-' + (index + 1))?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        document.getElementById('digit-' + (index - 1))?.focus();
      }
      this.digits[index] = '';
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const nums = text.replace(/\D/g, '').slice(0, 6);
    nums.split('').forEach((char, i) => {
      if (i < 6) this.digits[i] = char;
    });
    const focusIdx = Math.min(nums.length, 5);
    document.getElementById('digit-' + focusIdx)?.focus();
  }

  verificar(): void {
    this.errorMsg = '';
    const codigo = this.digits.join('');

    if (codigo.length !== 6) {
      this.errorMsg = 'Ingrese el código completo de 6 dígitos.';
      return;
    }

    this.loading = true;

    const body = {
      tipoPersna: this.tipoPersna,
      identificador: this.identificador,
      codigo
    };

    this.http.post('http://localhost:8080/api/auth/verificar', body)
      .subscribe({
        next: () => {
          this.successMsg = '¡Cuenta activada correctamente! Redirigiendo...';
          setTimeout(() => this.router.navigate(['/ciudadano/login']), 1800);
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Código incorrecto o expirado.';
          this.loading = false;
          this.digits = ['', '', '', '', '', ''];
          setTimeout(() => document.getElementById('digit-0')?.focus(), 100);
        }
      });
  }

  reenviarCodigo(): void {
    if (this.reenvioDisabled) return;

    const params = new HttpParams()
      .set('tipoPersna', this.tipoPersna)
      .set('identificador', this.identificador);

    this.http.post('http://localhost:8080/api/auth/reenviar-codigo', null, { params })
      .subscribe({
        next: () => {
          this.successMsg = 'Código reenviado. Revise su correo.';
          setTimeout(() => this.successMsg = '', 4000);
          this.iniciarCountdown();
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'No se pudo reenviar el código.';
        }
      });
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