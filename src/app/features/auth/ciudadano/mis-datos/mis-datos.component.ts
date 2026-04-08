// =============================================================
// mis-datos.component.ts — VERSIÓN COMPLETA
//
// AGREGADO para Persona Jurídica:
//   1. Sección Contactos de notificación:
//      - listarContactos()  → GET  /api/cuenta/juridica/{ruc}/contactos
//      - agregarContacto()  → POST /api/cuenta/juridica/{ruc}/contactos
//      - toggleContacto()   → PATCH .../contactos/{id}/estado
//      - eliminarContacto() → DELETE .../contactos/{id}
//   2. Campo afiliadoBuzon (solo lectura — no está en EditarJuridicaRequestDTO)
//   3. Campo fechaCreacion (solo lectura)
//
// REGLA: EditarJuridicaRequestDTO solo acepta:
//   direccion, telefono, departamento, provincia, distrito
//   No se envía nada más — contrato con el backend inamovible.
// =============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CuentaService } from '../../../../core/services/cuenta.service';
import { AuthService }   from '../../../../core/services/auth.service';
import {
  PerfilNaturalResponse,
  PerfilJuridicaResponse,
  EditarNaturalRequest,
  EditarJuridicaRequest,
  CambiarPasswordRequest,
  ContactoNotificacionResponse,
  ContactoNotificacionRequest,
} from '../../../../core/models/cuenta.model';
import {
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

  readonly preguntasSeguridad = PREGUNTAS_SEGURIDAD;

  // ── Pestañas ──────────────────────────────────────────────
  pestanaActiva: 'perfil' | 'contactos' | 'password' = 'perfil';

  // ── Sesión ────────────────────────────────────────────────
  tipoPersna    = '';
  identificador = '';

  // ── Perfiles ──────────────────────────────────────────────
  perfilNatural:  PerfilNaturalResponse  | null = null;
  perfilJuridica: PerfilJuridicaResponse | null = null;

  // ── Formulario editable Natural ───────────────────────────
  editNatural: EditarNaturalRequest = {
    direccion: '', telefono: '', email: '',
    preguntaSeguridad: 'NOMBRE_MASCOTA', respuestaSeguridad: ''
  };

  // ── Formulario editable Jurídica ──────────────────────────
  // Solo los campos que acepta EditarJuridicaRequestDTO
  editJuridica: EditarJuridicaRequest = {
    direccion: '', telefono: '',
    departamento: '', provincia: '', distrito: ''
  };

  // ── Contactos de notificación (solo Jurídica) ─────────────
  contactos: ContactoNotificacionResponse[] = [];
  cargandoContactos = false;
  errorContactos    = '';

  // Formulario para agregar nuevo contacto
  nuevoContacto: ContactoNotificacionRequest = { nombres: '', email: '' };
  mostrarFormContacto = false;
  guardandoContacto   = false;
  errorNuevoContacto  = '';

  // ── Cambio de contraseña ──────────────────────────────────
  passwords = { passwordActual: '', nuevaPassword: '', confirmarPassword: '' };

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
    private authService:   AuthService
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
    this.errorPerfil    = '';

    if (this.tipoPersna === 'NATURAL') {
      this.cuentaService.getPerfilNatural(this.identificador).subscribe({
        next: (data: PerfilNaturalResponse) => {
          this.cargandoPerfil = false;
          this.perfilNatural  = data;
          this.editNatural = {
            direccion:          data.direccion,
            telefono:           data.telefono,
            email:              data.email,
            preguntaSeguridad:  data.preguntaSeguridad,
            respuestaSeguridad: ''
          };
        },
        error: () => {
          this.cargandoPerfil = false;
          this.errorPerfil    = 'No se pudieron cargar sus datos.';
        }
      });
    } else {
      this.cuentaService.getPerfilJuridica(this.identificador).subscribe({
        next: (data: PerfilJuridicaResponse) => {
          this.cargandoPerfil = false;
          this.perfilJuridica = data;
          // Solo mapeamos los campos que EditarJuridicaRequestDTO acepta
          this.editJuridica = {
            direccion:    data.direccion,
            telefono:     data.telefono,
            departamento: data.departamento,
            provincia:    data.provincia,
            distrito:     data.distrito
          };
          // Cargamos contactos al mismo tiempo que el perfil
          this.cargarContactos();
        },
        error: () => {
          this.cargandoPerfil = false;
          this.errorPerfil    = 'No se pudieron cargar sus datos.';
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
      if (!this.editNatural.email.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editNatural.email)) {
        this.errorPerfil = 'El correo no tiene un formato válido.'; return;
      }

      const respNorm = this.editNatural.respuestaSeguridad.trim().toLowerCase();
      if (respNorm.length < 3) {
        this.errorPerfil = 'La respuesta de seguridad debe tener al menos 3 caracteres.'; return;
      }

      this.guardandoPerfil = true;
      this.cuentaService.editarPerfilNatural(this.identificador, {
        ...this.editNatural,
        respuestaSeguridad: respNorm
      }).subscribe({
        next: () => {
          this.guardandoPerfil                = false;
          this.exitoPerfil                    = 'Datos actualizados correctamente.';
          this.editNatural.respuestaSeguridad = '';
        },
        error: (err) => {
          this.guardandoPerfil = false;
          this.errorPerfil     = err.error?.message || 'Error al guardar los datos.';
        }
      });

    } else {

      if (!this.editJuridica.direccion.trim()) {
        this.errorPerfil = 'La dirección es obligatoria.'; return;
      }
      if (!this.editJuridica.telefono.trim()) {
        this.errorPerfil = 'El teléfono es obligatorio.'; return;
      }
      if (!this.editJuridica.departamento.trim() ||
          !this.editJuridica.provincia.trim()    ||
          !this.editJuridica.distrito.trim()) {
        this.errorPerfil = 'Departamento, provincia y distrito son obligatorios.'; return;
      }

      this.guardandoPerfil = true;
      this.cuentaService.editarPerfilJuridica(this.identificador, this.editJuridica).subscribe({
        next: () => {
          this.guardandoPerfil = false;
          this.exitoPerfil     = 'Datos actualizados correctamente.';
        },
        error: (err) => {
          this.guardandoPerfil = false;
          this.errorPerfil     = err.error?.message || 'Error al guardar los datos.';
        }
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // CONTACTOS DE NOTIFICACIÓN — solo Jurídica
  // ══════════════════════════════════════════════════════════

  // GET /api/cuenta/juridica/{ruc}/contactos
  cargarContactos(): void {
    this.cargandoContactos = true;
    this.errorContactos    = '';

    this.cuentaService.listarContactos(this.identificador).subscribe({
      next: (data: ContactoNotificacionResponse[]) => {
        this.cargandoContactos = false;
        this.contactos         = data;
      },
      error: () => {
        this.cargandoContactos = false;
        this.errorContactos    = 'No se pudieron cargar los contactos.';
      }
    });
  }

  // POST /api/cuenta/juridica/{ruc}/contactos
  agregarContacto(): void {
    this.errorNuevoContacto = '';

    if (!this.nuevoContacto.nombres.trim()) {
      this.errorNuevoContacto = 'El nombre del contacto es obligatorio.'; return;
    }
    if (!this.nuevoContacto.email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoContacto.email)) {
      this.errorNuevoContacto = 'El correo del contacto no es válido.'; return;
    }

    this.guardandoContacto = true;
    this.cuentaService.agregarContacto(this.identificador, {
      nombres: this.nuevoContacto.nombres.trim(),
      email:   this.nuevoContacto.email.trim()
    }).subscribe({
      next: () => {
        this.guardandoContacto      = false;
        this.mostrarFormContacto    = false;
        this.nuevoContacto          = { nombres: '', email: '' };
        this.cargarContactos();    // recargar lista
      },
      error: (err) => {
        this.guardandoContacto  = false;
        this.errorNuevoContacto = err.error?.message || 'Error al agregar el contacto.';
      }
    });
  }

  // PATCH /api/cuenta/juridica/{ruc}/contactos/{id}/estado
  toggleContacto(contacto: ContactoNotificacionResponse): void {
    this.cuentaService.toggleContacto(
      this.identificador,
      contacto.id,
      !contacto.activo
    ).subscribe({
      next: () => this.cargarContactos(),
      error: () => this.errorContactos = 'Error al cambiar el estado del contacto.'
    });
  }

  // DELETE /api/cuenta/juridica/{ruc}/contactos/{id}
  eliminarContacto(id: string): void {
    if (!confirm('¿Eliminar este contacto de notificación?')) return;

    this.cuentaService.eliminarContacto(this.identificador, id).subscribe({
      next: () => this.cargarContactos(),
      error: () => this.errorContactos = 'Error al eliminar el contacto.'
    });
  }

  cancelarNuevoContacto(): void {
    this.mostrarFormContacto = false;
    this.nuevoContacto       = { nombres: '', email: '' };
    this.errorNuevoContacto  = '';
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
        this.exitoPass     = 'Contraseña actualizada correctamente.';
        this.passwords     = { passwordActual: '', nuevaPassword: '', confirmarPassword: '' };
      },
      error: (err) => {
        this.guardandoPass = false;
        this.errorPass     = err.error?.message || 'Error al cambiar la contraseña.';
      }
    });
  }
}
