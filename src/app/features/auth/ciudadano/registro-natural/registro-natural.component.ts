// =============================================================
// registro-natural.component.ts — VERSIÓN CORREGIDA
//
// CORRECCIONES vs versión anterior:
//   1. HttpClient directo → CiudadanoService (URL relativa, proxy)
//      El componente NO debe conocer la URL del backend.
//   2. form tipado con RegistroNaturalRequest en lugar de objeto
//      anónimo — el compilador de TypeScript detecta campos faltantes
//      o con nombre incorrecto antes de llegar al servidor.
//   3. Respuesta tipada con RegistroResponse (no 'any').
//      res.tipoPersna (con typo) es el campo real del backend — NO corregir.
// =============================================================

import { Component } from '@angular/core';
import { Router, RouterLink }   from '@angular/router';
import { CommonModule }          from '@angular/common';
import { FormsModule }           from '@angular/forms';
import { HttpErrorResponse }     from '@angular/common/http';

import { CiudadanoService }      from '../../../../core/services/ciudadano.service';
import {
  RegistroNaturalRequest,
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
  selector: 'app-registro-natural',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    SoloNumerosDirective, SoloLetrasDirective, TrimInputDirective
  ],
  templateUrl: './registro-natural.component.html',
  styleUrl:    './registro-natural.component.css'
})
export class RegistroNaturalComponent {

  // ── Formulario tipado 1:1 con RegistroNaturalRequestDTO ──────
  // 📚 LECCIÓN: tipamos el form con la interfaz del modelo.
  // TypeScript nos avisará si un campo del DTO no está en el form
  // o si tiene el nombre incorrecto — antes de llegar al servidor.
  form: RegistroNaturalRequest = {
    tipoDocumento:      '' as TipoDocumento,
    numeroDocumento:    '',
    nombres:            '',
    apellidoPaterno:    '',
    apellidoMaterno:    '',
    departamento:       '',
    provincia:          '',
    distrito:           '',
    direccion:          '',
    telefono:           '',
    email:              '',
    password:           '',
    preguntaSeguridad:  '' as PreguntaSeguridad,
    respuestaSeguridad: '',
    afiliadoBuzon:      false
  };

  // Confirmación de contraseña — solo vive en el frontend, no va al backend
  confirmarPassword = '';

  // ── Estado UI ────────────────────────────────────────────────
  loading    = false;
  errorMsg   = '';
  showPw     = false;
  showPwConf = false;

  // ── Opciones tipadas desde el modelo — Cero Hardcoding ───────
  // Contract-First: estos valores vienen del enum TipoDocumento del backend
  readonly tiposDoc: { label: string; value: TipoDocumento }[] = [
    { label: 'DNI',                value: 'DNI'               },
    { label: 'Carné de Extranjería', value: 'CARNET_EXTRANJERIA' },
  ];

  // Contract-First: estos valores vienen del enum PreguntaSeguridad del backend
  readonly preguntas = PREGUNTAS_SEGURIDAD;

  constructor(
    // CORRECCIÓN: CiudadanoService en vez de HttpClient directo
    // CiudadanoService usa URL relativa /api/auth → el proxy lo reenvía
    private ciudadanoService: CiudadanoService,
    private router:           Router
  ) {}

  registrar(): void {
    this.errorMsg = '';

    // Validar contraseña (reglas del backend: @Size(min=8))
    const pwVal = validarPassword(this.form.password);
    if (!pwVal.valido) { this.errorMsg = pwVal.mensaje; return; }

    if (this.form.password !== this.confirmarPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    if (!validarEmail(this.form.email)) {
      this.errorMsg = 'El correo electrónico no tiene un formato válido.';
      return;
    }

    this.loading = true;

    // CORRECCIÓN: CiudadanoService.registrarNatural()
    // → POST /api/auth/registro/natural (URL relativa — proxy activo)
    // Body: RegistroNaturalRequestDTO (serializado como JSON)
    this.ciudadanoService.registrarNatural(this.form).subscribe({
      next: (res: RegistroResponse) => {
        // Navegar a verificación pasando el estado necesario
        // tipoPersna viene del backend — respetamos el typo intencional
        this.router.navigate(['/ciudadano/verificar'], {
          state: {
            identificador: res.identificador,
            tipoPersna:    res.tipoPersna
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        // 409 = email o documento ya en uso (BusinessConflictException)
        // 400 = validación de @Valid falló en el backend
        if (err.status === 409) {
          this.errorMsg = 'Ya existe una cuenta con ese documento o correo.';
        } else if (err.status === 400) {
          // El backend devuelve { campos: { field: message } } para validaciones
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
