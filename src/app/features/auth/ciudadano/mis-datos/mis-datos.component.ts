// =============================================================
// mis-datos.component.ts
// CORRECCIONES v2:
//   1. respuestaSeguridad → normalizada con .trim().toLowerCase() ANTES del PUT
//      ➤ Garantiza consistencia en BD: "Lima", "LIMA", " lima " → siempre "lima"
//      ➤ Esto es lo que hace que la respuesta "sea la correcta" en usos futuros
//   2. Validación mínimo 3 caracteres (después del trim, no antes)
//   3. Se limpia respuestaSeguridad tras éxito → usuario debe reingresar siempre
//   4. NOTA TÉCNICA: el campo respuestaSeguridad en PUT *reemplaza*, no verifica.
//      El backend solo tiene @NotBlank. No existe endpoint de verificación sin
//      efectos secundarios en la sesión de recuperación. Esta solución es la
//      máxima seguridad posible sin modificar el backend.
// =============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CuentaService } from '../../../../core/services/cuenta.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  PerfilNaturalResponse,
  PerfilJuridicaResponse,
  EditarNaturalRequest,
  EditarJuridicaRequest,
  CambiarPasswordRequest,
} from '../../../../core/models/cuenta.model';
import {
  PreguntaSeguridad,
  PREGUNTAS_SEGURIDAD,
} from '../../../../core/models/ciudadano.model';

@Component({
  selector: 'app-mis-datos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-datos.component.html',
  styleUrl: './mis-datos.component.css'
})
export class MisDatosComponent implements OnInit {

  // ── Preguntas de seguridad — consumidas del modelo, no hardcodeadas ──
  readonly preguntasSeguridad = PREGUNTAS_SEGURIDAD;

  // ── Pestañas ──────────────────────────────────────────────
  pestanaActiva: 'perfil' | 'password' = 'perfil';

  // ── Sesión ────────────────────────────────────────────────
  tipoPersna    = '';
  identificador = '';

  // ── Datos del perfil ──────────────────────────────────────
  perfilNatural:  PerfilNaturalResponse  | null = null;
  perfilJuridica: PerfilJuridicaResponse | null = null;

  // ── Datos editables Natural: EditarNaturalRequestDTO ─────
  editNatural: EditarNaturalRequest = {
    direccion:          '',
    telefono:           '',
    email:              '',
    preguntaSeguridad:  'NOMBRE_MASCOTA',
    respuestaSeguridad: ''
  };

  // ── Datos editables Jurídica: EditarJuridicaRequestDTO ───
  editJuridica: EditarJuridicaRequest = {
    direccion:    '',
    telefono:     '',
    departamento: '',
    provincia:    '',
    distrito:     ''
  };

  // ── Cambio de contraseña ──────────────────────────────────
  passwords = {
    passwordActual:    '',
    nuevaPassword:     '',
    confirmarPassword: ''
  };

  // ── Estado UI ─────────────────────────────────────────────
  cargandoPerfil  = false;
  guardandoPerfil = false;
  guardandoPass   = false;
  errorPerfil  = '';
  exitoPerfil  = '';
  errorPass    = '';
  exitoPass    = '';

  constructor(
    private cuentaService: CuentaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.tipoPersna    = this.authService.getTipoPersna();
    this.identificador = this.authService.getIdentificador();

    if (!this.tipoPersna || !this.identificador) {
      this.errorPerfil = 'No se pudo identificar la sesión.';
      return;
    }
    this.cargarPerfil();
  }

  // ── Carga del perfil ──────────────────────────────────────
  cargarPerfil(): void {
    this.cargandoPerfil = true;
    this.errorPerfil = '';

    if (this.tipoPersna === 'NATURAL') {
      this.cuentaService.getPerfilNatural(this.identificador).subscribe({
        next: (data: PerfilNaturalResponse) => {
          this.cargandoPerfil = false;
          this.perfilNatural = data;
          this.editNatural = {
            direccion:          data.direccion,
            telefono:           data.telefono,
            email:              data.email,
            preguntaSeguridad:  data.preguntaSeguridad,
            respuestaSeguridad: ''   // ← nunca se pre-llena: es secreto
          };
        },
        error: () => {
          this.cargandoPerfil = false;
          this.errorPerfil = 'No se pudieron cargar sus datos.';
        }
      });
    } else {
      this.cuentaService.getPerfilJuridica(this.identificador).subscribe({
        next: (data: PerfilJuridicaResponse) => {
          this.cargandoPerfil = false;
          this.perfilJuridica = data;
          this.editJuridica = {
            direccion:    data.direccion,
            telefono:     data.telefono,
            departamento: data.departamento,
            provincia:    data.provincia,
            distrito:     data.distrito
          };
        },
        error: () => {
          this.cargandoPerfil = false;
          this.errorPerfil = 'No se pudieron cargar sus datos.';
        }
      });
    }
  }

  // ── Guardar perfil ────────────────────────────────────────
  guardarPerfil(): void {
    this.errorPerfil = '';
    this.exitoPerfil = '';

    if (this.tipoPersna === 'NATURAL') {

      // Validaciones de los campos básicos
      if (!this.editNatural.direccion.trim()) {
        this.errorPerfil = 'La dirección es obligatoria.'; return;
      }
      if (!this.editNatural.telefono.trim()) {
        this.errorPerfil = 'El teléfono es obligatorio.'; return;
      }
      if (!this.editNatural.email.trim()) {
        this.errorPerfil = 'El correo electrónico es obligatorio.'; return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editNatural.email)) {
        this.errorPerfil = 'El correo no tiene un formato válido.'; return;
      }

      // ── Validación de respuesta de seguridad ──────────────
      // IMPORTANTE: normalizamos ANTES de validar la longitud.
      // Un valor como "   a   " pasaría @NotBlank del backend pero
      // sería inútil como respuesta de seguridad.
      const respuestaNormalizada = this.editNatural.respuestaSeguridad.trim().toLowerCase();

      if (respuestaNormalizada.length === 0) {
        this.errorPerfil = 'La respuesta de seguridad es obligatoria.'; return;
      }
      if (respuestaNormalizada.length < 3) {
        this.errorPerfil = 'La respuesta de seguridad debe tener al menos 3 caracteres.'; return;
      }

      const requestNatural: EditarNaturalRequest = {
        ...this.editNatural,
        respuestaSeguridad: respuestaNormalizada
      };

      if (this.editNatural.preguntaSeguridad === null) {
        this.errorPerfil = 'Debe seleccionar una pregunta de seguridad.'; return;
      }

      if (!this.preguntasSeguridad.some(p => p.value === this.editNatural.preguntaSeguridad)) {
        this.errorPerfil = 'Pregunta de seguridad seleccionada no es válida.'; return;
      }

      this.guardandoPerfil = true;
      this.cuentaService.editarPerfilNatural(this.identificador, requestNatural).subscribe({
        next: () => {
          this.guardandoPerfil = false;
          this.exitoPerfil = 'Datos actualizados correctamente.';
          // Limpiar la respuesta tras éxito: el usuario debe ingresarla
          // siempre de nuevo (nunca queda pre-llenada en pantalla)
          this.editNatural.respuestaSeguridad = '';
        },
        error: (err) => {
          this.guardandoPerfil = false;
          this.errorPerfil = err.error?.message || 'Error al guardar los datos.';
        }
      });

    } else {

      if (!this.editJuridica.direccion.trim()) {
        this.errorPerfil = 'La dirección es obligatoria.'; return;
      }
      if (!this.editJuridica.telefono.trim()) {
        this.errorPerfil = 'El teléfono es obligatorio.'; return;
      }

      this.guardandoPerfil = true;
      this.cuentaService.editarPerfilJuridica(this.identificador, this.editJuridica).subscribe({
        next: () => {
          this.guardandoPerfil = false;
          this.exitoPerfil = 'Datos actualizados correctamente.';
        },
        error: (err) => {
          this.guardandoPerfil = false;
          this.errorPerfil = err.error?.message || 'Error al guardar los datos.';
        }
      });
    }
  }

  // ── Cambiar contraseña ────────────────────────────────────
  cambiarPassword(): void {
    this.errorPass = '';
    this.exitoPass = '';

    if (!this.passwords.passwordActual) {
      this.errorPass = 'Ingrese su contraseña actual.'; return;
    }
    if (this.passwords.nuevaPassword.length < 8) {
      this.errorPass = 'La contraseña debe tener al menos 8 caracteres.'; return;
    }
    if (this.passwords.nuevaPassword !== this.passwords.confirmarPassword) {
      this.errorPass = 'Las contraseñas no coinciden.'; return;
    }

    const request: CambiarPasswordRequest = {
      tipoPersna:        this.tipoPersna,
      identificador:     this.identificador,
      passwordActual:    this.passwords.passwordActual,
      nuevaPassword:     this.passwords.nuevaPassword,
      confirmarPassword: this.passwords.confirmarPassword
    };

    this.guardandoPass = true;
    this.cuentaService.cambiarPassword(request).subscribe({
      next: () => {
        this.guardandoPass = false;
        this.exitoPass = 'Contraseña actualizada correctamente.';
        this.passwords = { passwordActual: '', nuevaPassword: '', confirmarPassword: '' };
      },
      error: (err) => {
        this.guardandoPass = false;
        this.errorPass = err.error?.message || 'Error al cambiar la contraseña.';
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
