// =============================================================
// mis-datos.component.ts
// CORRECCIONES:
//   1. PREGUNTAS_SEGURIDAD: valores corregidos al enum real del backend
//      ❌ 'COLEGIO'    → ✅ 'NOMBRE_COLEGIO'
//      ❌ 'MEJOR_AMIGO' → ✅ 'APODO_INFANCIA'
//      ❌ label 'nombre de soltera de tu madre' → ✅ 'primer nombre de tu madre'
//   2. Usa CuentaService en vez de HttpClient directo
//   3. Tipado estricto con interfaces de cuenta.model.ts
//   4. editNatural.preguntaSeguridad tipado como PreguntaSeguridad (no string)
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
  PREGUNTAS_SEGURIDAD,   // ← Importado del modelo, no hardcodeado
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
  tipoPersna    = '';   // 'NATURAL' | 'JURIDICA'
  identificador = '';

  // ── Datos del perfil (tipados con interfaces del backend) ─
  perfilNatural:  PerfilNaturalResponse  | null = null;
  perfilJuridica: PerfilJuridicaResponse | null = null;

  // ── Datos editables Natural: EditarNaturalRequestDTO ─────
  editNatural: EditarNaturalRequest = {
    direccion:          '',
    telefono:           '',
    email:              '',
    preguntaSeguridad:  'NOMBRE_MASCOTA',   // valor por defecto válido del enum
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

  // ── Cambio de contraseña: CambiarPasswordRequestDTO ──────
  // tipoPersna e identificador se inyectan al enviar
  passwords = {
    passwordActual:    '',
    nuevaPassword:     '',
    confirmarPassword: ''
  };

  // ── Estado ────────────────────────────────────────────────
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

  // ── Carga del perfil vía servicio ────────────────────────
  cargarPerfil(): void {
    this.cargandoPerfil = true;
    this.errorPerfil = '';

    if (this.tipoPersna === 'NATURAL') {
      this.cuentaService.getPerfilNatural(this.identificador).subscribe({
        next: (data: PerfilNaturalResponse) => {
          this.cargandoPerfil = false;
          this.perfilNatural = data;
          // Pre-poblar campos editables
          this.editNatural = {
            direccion:          data.direccion,
            telefono:           data.telefono,
            email:              data.email,
            preguntaSeguridad:  data.preguntaSeguridad,
            respuestaSeguridad: ''   // no se pre-pobla por seguridad
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
          // Pre-poblar campos editables
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
      if (!this.editNatural.respuestaSeguridad.trim()) {
        this.errorPerfil = 'La respuesta de seguridad es obligatoria.'; return;
      }

      this.guardandoPerfil = true;
      this.cuentaService.editarPerfilNatural(this.identificador, this.editNatural).subscribe({
        next: () => {
          this.guardandoPerfil = false;
          this.exitoPerfil = 'Datos actualizados correctamente.';
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
      tipoPersna:       this.tipoPersna,      // campo del contrato del backend
      identificador:    this.identificador,
      passwordActual:   this.passwords.passwordActual,
      nuevaPassword:    this.passwords.nuevaPassword,
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