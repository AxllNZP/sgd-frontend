// =============================================================
// registro-juridica.component.ts — VERSIÓN CORREGIDA
//
// CORRECCIONES vs versión anterior:
//   1. HttpClient directo con URL absoluta → CiudadanoService
//      (URL relativa /api/auth → proxy reenvía a localhost:8080)
//   2. form: any → tipado con RegistroJuridicaRequest
//      El backend espera exactamente estos campos — TypeScript
//      nos avisará si alguno falta o está mal nombrado.
//   3. contactosNotificacion tipado con ContactoNotificacionRegistro[]
//      en lugar de any[] — mapeo 1:1 con ContactoNotificacionDTO
// =============================================================

import { Component } from '@angular/core';
import { Router, RouterLink }   from '@angular/router';
import { CommonModule }          from '@angular/common';
import { FormsModule }           from '@angular/forms';
import { HttpErrorResponse }     from '@angular/common/http';

import { CiudadanoService }      from '../../../../core/services/ciudadano.service';
import {
  RegistroJuridicaRequest,
  ContactoNotificacionRegistro,
  RegistroResponse,
  PREGUNTAS_SEGURIDAD,
  TipoDocumento,
  PreguntaSeguridad
} from '../../../../core/models/ciudadano.model';
import { SoloNumerosDirective }  from '../../../../shared/directives/solo-numeros.directive';
import { SoloLetrasDirective }   from '../../../../shared/directives/solo-letras.directive';
import { TrimInputDirective }    from '../../../../shared/directives/trim-input.directive';
import { validarEmail, validarPassword } from '../../../../shared/validators/validators';

@Component({
  selector: 'app-registro-juridica',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    SoloNumerosDirective, SoloLetrasDirective, TrimInputDirective
  ],
  templateUrl: './registro-juridica.component.html',
  styleUrl:    './registro-juridica.component.css'
})
export class RegistroJuridicaComponent {

  // ── Formulario tipado 1:1 con RegistroJuridicaRequestDTO ─────
  form: RegistroJuridicaRequest = {
    ruc:                          '',
    razonSocial:                  '',
    password:                     '',
    preguntaSeguridad:            '' as PreguntaSeguridad,
    respuestaSeguridad:           '',
    tipoDocRepresentante:         '' as TipoDocumento,
    numDocRepresentante:          '',
    nombresRepresentante:         '',
    apellidoPaternoRepresentante: '',
    apellidoMaternoRepresentante: '',
    emailRepresentante:           '',
    departamento:                 '',
    provincia:                    '',
    distrito:                     '',
    direccion:                    '',
    telefono:                     '',
    contactosNotificacion:        [],   // @Valid List<ContactoNotificacionDTO>
    afiliadoBuzon:                false
  };

  // Confirmación — solo frontend, no va al backend
  confirmarPassword = '';

  // ── Estado UI ────────────────────────────────────────────────
  loading    = false;
  errorMsg   = '';
  showPw     = false;
  showPwConf = false;

  // ── Opciones tipadas desde el modelo — Cero Hardcoding ───────
  readonly tiposDoc: { label: string; value: TipoDocumento }[] = [
    { label: 'DNI',                  value: 'DNI'                },
    { label: 'Carné de Extranjería', value: 'CARNET_EXTRANJERIA' },
  ];

  readonly preguntas = PREGUNTAS_SEGURIDAD;

  constructor(
    // CORRECCIÓN: CiudadanoService en vez de HttpClient directo
    private ciudadanoService: CiudadanoService,
    private router:           Router
  ) {}

  // ── Gestión de contactos de notificación ─────────────────────
  // El backend acepta List<ContactoNotificacionDTO> — podría estar vacío
  agregarContacto(): void {
    this.form.contactosNotificacion.push({
      nombres: '',
      email:   '',
      activo:  true   // siempre true al crear
    });
  }

  eliminarContacto(index: number): void {
    this.form.contactosNotificacion.splice(index, 1);
  }

  registrar(): void {
    this.errorMsg = '';
    // ── Validaciones adicionales ──
  if (!this.form.ruc || this.form.ruc.length !== 11) {
    this.errorMsg = 'El RUC debe tener exactamente 11 dígitos.'; return;
  }
  if (!this.form.razonSocial.trim()) {
    this.errorMsg = 'La razón social es obligatoria.'; return;
  }
  if (!this.form.tipoDocRepresentante) {
    this.errorMsg = 'Seleccione el tipo de documento del representante.'; return;
  }
  if (!this.form.numDocRepresentante.trim()) {
    this.errorMsg = 'Ingrese el número de documento del representante.'; return;
  }
  if (!this.form.preguntaSeguridad) {
    this.errorMsg = 'Seleccione una pregunta de seguridad.'; return;
  }

    // Validar contraseña (@Size(min=8) en el backend)
    const pwVal = validarPassword(this.form.password);
    if (!pwVal.valido) { this.errorMsg = pwVal.mensaje; return; }

    if (this.form.password !== this.confirmarPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    if (!validarEmail(this.form.emailRepresentante)) {
      this.errorMsg = 'El correo del representante no tiene un formato válido.';
      return;
    }

    // Limpiar contactos vacíos antes de enviar al backend
    // (no enviamos objetos con campos en blanco)
    const payload: RegistroJuridicaRequest = {
      ...this.form,
      contactosNotificacion: this.form.contactosNotificacion.filter(
        (c: ContactoNotificacionRegistro) => c.nombres.trim() && c.email.trim()
      )
    };

    this.loading = true;

    // CORRECCIÓN: CiudadanoService.registrarJuridica()
    // → POST /api/auth/registro/juridica (URL relativa — proxy activo)
    this.ciudadanoService.registrarJuridica(payload).subscribe({
      next: (res: RegistroResponse) => {
        // Navegar a verificación con el estado necesario
        // tipoPersna viene del backend — mantenemos el typo intencional
        this.router.navigate(['/ciudadano/verificar'], {
          state: {
            identificador: res.identificador ?? this.form.ruc,
            tipoPersna:    res.tipoPersna ?? 'JURIDICA'
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMsg = 'Ya existe una empresa registrada con ese RUC o correo.';
        } else if (err.status === 400) {
          const campos = err.error?.campos;
          if (campos) {
            this.errorMsg = Object.values(campos).join(' ');
          } else {
            this.errorMsg = err.error?.message || 'Datos inválidos. Revise el formulario.';
          }
        } else {
          this.errorMsg = err.error?.message || 'Error al registrar. Inténtelo de nuevo.';
        }
      }
    });
  }
}
