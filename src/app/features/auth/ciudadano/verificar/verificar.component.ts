// verificar.component.ts — CORREGIDO COMPLETO

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CiudadanoService } from '../../../../core/services/ciudadano.service';

@Component({
  selector: 'app-verificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verificar.component.html',
  styleUrl:    './verificar.component.css'
})
export class VerificarComponent implements OnInit, OnDestroy {

  tipoPersna    = '';
  identificador = '';

  // CORRECCIÓN CRÍTICA: 8 dígitos — el backend genera códigos de 8 dígitos
  // generarCodigo() → 10_000_000 + nextInt(90_000_000) → siempre 8 chars
  digits: string[] = ['', '', '', '', '', '', '', ''];

  loading         = false;
  errorMsg        = '';
  successMsg      = '';
  reenvioDisabled = true;   // empieza bloqueado — se inicia el countdown
  countdown       = 60;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private ciudadanoService: CiudadanoService,
    private router: Router
  ) {
    // CORRECCIÓN: leer el state en el CONSTRUCTOR, no en ngOnInit
    // getCurrentNavigation() solo funciona durante la navegación activa,
    // que es el momento en que el constructor se ejecuta.
    // En ngOnInit la navegación ya terminó y devuelve null.
    const nav   = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as
      { identificador: string; tipoPersna: string } | undefined;

    if (state?.identificador && state?.tipoPersna) {
      this.identificador = state.identificador;
      this.tipoPersna    = state.tipoPersna;
    }
  }

  ngOnInit(): void {
    // Fallback: si no vino state del constructor (ej: recarga de página),
    // leer de history.state que el browser conserva entre renders
    if (!this.identificador) {
      const hs = history.state as { identificador?: string; tipoPersna?: string };
      this.identificador = hs?.identificador || '';
      this.tipoPersna    = hs?.tipoPersna    || 'NATURAL';
    }

    this.iniciarCountdown();
    setTimeout(() => document.getElementById('digit-0')?.focus(), 200);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  get codigoCompleto(): boolean {
    // 8 dígitos completos
    return this.digits.every(d => d !== '');
  }

  private get codigoValor(): string {
    return this.digits.join('');
  }

  // HTML: (input)="onInput($event, i)"
  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = val;
    input.value = val;  // forzar sincronía visual

    if (val && index < 7) {   // 7 = último índice para 8 dígitos
      setTimeout(() => document.getElementById(`digit-${index + 1}`)?.focus(), 0);
    }

    if (this.codigoCompleto) {
      setTimeout(() => this.verificar(), 100);
    }
  }

  // HTML: (keydown)="onKeyDown($event, i)"
  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        document.getElementById(`digit-${index - 1}`)?.focus();
      }
      this.digits[index] = '';
    }
  }

  // HTML: (paste)="onPaste($event)"
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const texto      = event.clipboardData?.getData('text') || '';
    const soloNums   = texto.replace(/\D/g, '').slice(0, 8);  // 8 dígitos
    soloNums.split('').forEach((d, i) => { this.digits[i] = d; });
    const ultimo = Math.min(soloNums.length - 1, 7);
    setTimeout(() => document.getElementById(`digit-${ultimo}`)?.focus(), 0);
    if (this.codigoCompleto) setTimeout(() => this.verificar(), 100);
  }

  verificar(): void {
    this.errorMsg   = '';
    this.successMsg = '';

    if (!this.codigoCompleto) {
      this.errorMsg = 'Ingrese el código completo de 8 dígitos.'; return;
    }

    this.loading = true;

    this.ciudadanoService.verificarCodigo({
      tipoPersna:    this.tipoPersna,
      identificador: this.identificador,
      codigo:        this.codigoValor
    }).subscribe({
      next: () => {
        this.loading    = false;
        this.successMsg = '¡Cuenta activada correctamente! Redirigiendo...';
        setTimeout(() => this.router.navigate(['/ciudadano/login']), 1800);
      },
      error: (err: HttpErrorResponse) => {
        this.loading  = false;
        this.errorMsg = err.error?.message || 'Código incorrecto o expirado.';
        this.digits   = ['', '', '', '', '', '', '', ''];  // limpiar 8 cajas
        setTimeout(() => document.getElementById('digit-0')?.focus(), 100);
      }
    });
  }

  reenviarCodigo(): void {
    if (this.reenvioDisabled) return;

    this.errorMsg   = '';
    this.successMsg = '';

    this.ciudadanoService.reenviarCodigo(this.tipoPersna, this.identificador)
      .subscribe({
        next: () => {
          this.successMsg = 'Código reenviado. Revise su correo.';
          setTimeout(() => this.successMsg = '', 4000);
          this.iniciarCountdown();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.status === 500
            ? 'El código fue generado pero el correo no se pudo enviar. Intente más tarde.'
            : err.error?.message || 'No se pudo reenviar el código.';
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
        clearInterval(this.timer!);
        this.reenvioDisabled = false;
      }
    }, 1000);
  }
}
