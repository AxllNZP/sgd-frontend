import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar.component.html',
  styleUrl: './recuperar.component.css'
})
export class RecuperarComponent {

  // 1 = solicitar código
  // 2 = verificar código
  // 3 = nueva contraseña
  // 4 = éxito
  etapa: 1 | 2 | 3 | 4 = 1;

  // ── Etapa 1: RecuperacionSolicitarDTO ─────────────────────
  // { tipoPersna, identificador, email }
  solicitud = {
    tipoPersna:    '',   // 'NATURAL' | 'JURIDICA'
    identificador: '',   // DNI (natural) o RUC (jurídica)
    email:         ''
  };

  // ── Etapa 2: RecuperacionVerificarCodigoDTO ───────────────
  // { tipoPersna, identificador, codigo }
  codigo = '';

  // ── Etapa 3: NuevaPasswordDTO ─────────────────────────────
  // { tipoPersna, identificador, nuevaPassword, confirmarPassword }
  nuevaPassword     = '';
  confirmarPassword = '';

  error    = '';
  cargando = false;

  constructor(private http: HttpClient, private router: Router) {}

  // ── Validación etapa 1 ────────────────────────────────────
  private validarSolicitud(): boolean {
    if (!this.solicitud.tipoPersna) {
      this.error = 'Seleccione el tipo de persona.'; return false;
    }
    if (!this.solicitud.identificador.trim()) {
      this.error = this.solicitud.tipoPersna === 'NATURAL'
        ? 'Ingrese su número de documento.'
        : 'Ingrese su RUC.';
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
  // Body: { tipoPersna, identificador, email }
  solicitarCodigo(): void {
    this.error = '';
    if (!this.validarSolicitud()) return;

    this.cargando = true;
    this.http.post<void>('http://localhost:8080/api/auth/recuperar/solicitar', {
      tipoPersna:    this.solicitud.tipoPersna,
      identificador: this.solicitud.identificador,
      email:         this.solicitud.email
    }).subscribe({
      next:  () => { this.cargando = false; this.etapa = 2; },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.message || 'No se encontró la cuenta o el correo no coincide.';
      }
    });
  }

  // ── ETAPA 2: POST /api/auth/recuperar/verificar-codigo ────
  // Body: { tipoPersna, identificador, codigo }
  verificarCodigo(): void {
    this.error = '';
    if (!this.codigo.trim()) { this.error = 'Ingrese el código recibido.'; return; }
    if (this.codigo.length !== 6) { this.error = 'El código debe tener 6 dígitos.'; return; }

    this.cargando = true;
    this.http.post<void>('http://localhost:8080/api/auth/recuperar/verificar-codigo', {
      tipoPersna:    this.solicitud.tipoPersna,
      identificador: this.solicitud.identificador,
      codigo:        this.codigo
    }).subscribe({
      next:  () => { this.cargando = false; this.etapa = 3; },
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
    this.http.post<void>('http://localhost:8080/api/auth/recuperar/solicitar', {
      tipoPersna:    this.solicitud.tipoPersna,
      identificador: this.solicitud.identificador,
      email:         this.solicitud.email
    }).subscribe({
      next:  () => { this.cargando = false; },
      error: () => { this.cargando = false; this.error = 'No se pudo reenviar el código.'; }
    });
  }

  // ── ETAPA 3: POST /api/auth/recuperar/nueva-password ─────
  // Body: { tipoPersna, identificador, nuevaPassword, confirmarPassword }
  cambiarPassword(): void {
    this.error = '';
    if (!this.nuevaPassword) { this.error = 'Ingrese la nueva contraseña.'; return; }
    if (this.nuevaPassword.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.'; return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.error = 'Las contraseñas no coinciden.'; return;
    }

    this.cargando = true;
    this.http.post<void>('http://localhost:8080/api/auth/recuperar/nueva-password', {
      tipoPersna:       this.solicitud.tipoPersna,
      identificador:    this.solicitud.identificador,
      nuevaPassword:    this.nuevaPassword,
      confirmarPassword: this.confirmarPassword
    }).subscribe({
      next:  () => { this.cargando = false; this.etapa = 4; },
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