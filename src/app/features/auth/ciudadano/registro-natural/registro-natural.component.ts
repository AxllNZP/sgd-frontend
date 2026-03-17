// registro-natural.component.ts — versión completa corregida

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CiudadanoService } from '../../../../core/services/ciudadano.service';
import { SoloNumerosDirective } from '../../../../shared/directives/solo-numeros.directive';
import { SoloLetrasDirective } from '../../../../shared/directives/solo-letras.directive';
import { TrimInputDirective } from '../../../../shared/directives/trim-input.directive';
import { validarEmail, validarPassword } from '../../../../shared/validators/validators';
import { PREGUNTAS_SEGURIDAD } from '../../../../core/models/ciudadano.model'; // ← AÑADIR

@Component({
  selector: 'app-registro-natural',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,
            SoloNumerosDirective, SoloLetrasDirective, TrimInputDirective],
  templateUrl: './registro-natural.component.html',
  styleUrl:    './registro-natural.component.css'
})
export class RegistroNaturalComponent {

  form = {
    tipoDocumento:      '',
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
    preguntaSeguridad:  '',
    respuestaSeguridad: '',
    afiliadoBuzon:      false
  };

  // ← AÑADIR: el HTML usa tiposDoc en *ngFor
  // Fuente: TipoDocumento enum del backend — solo 2 valores
  tiposDoc = [
    { value: 'DNI',               label: 'DNI' },
    { value: 'CARNET_EXTRANJERIA', label: 'Carné de Extranjería' }
  ];

  // ← AÑADIR: el HTML usa preguntas en *ngFor
  // Importado de ciudadano.model.ts — no hardcodeado aquí
  preguntas = PREGUNTAS_SEGURIDAD;

  confirmarPassword = '';
  loading      = false;
  errorMsg     = '';
  showPw       = false;
  showPwConfirm = false;   // ← El HTML usa showPwConf — hay que corregir el HTML también

  constructor(
    private ciudadanoService: CiudadanoService,
    private router: Router
  ) {}

  registrar(): void {
    this.errorMsg = '';

    if (!this.form.tipoDocumento) {
      this.errorMsg = 'Seleccione el tipo de documento.'; return;
    }
    if (!this.form.numeroDocumento.trim()) {
      this.errorMsg = 'Ingrese el número de documento.'; return;
    }
    if (this.form.tipoDocumento === 'DNI' && this.form.numeroDocumento.length !== 8) {
      this.errorMsg = 'El DNI debe tener exactamente 8 dígitos.'; return;
    }
    if (!this.form.nombres.trim()) {
      this.errorMsg = 'Ingrese sus nombres.'; return;
    }
    if (!this.form.apellidoPaterno.trim()) {
      this.errorMsg = 'Ingrese el apellido paterno.'; return;
    }
    if (!this.form.apellidoMaterno.trim()) {
      this.errorMsg = 'Ingrese el apellido materno.'; return;
    }
    if (!this.form.departamento.trim() || !this.form.provincia.trim() || !this.form.distrito.trim()) {
      this.errorMsg = 'Complete todos los campos de ubicación.'; return;
    }
    if (!this.form.direccion.trim()) {
      this.errorMsg = 'Ingrese su dirección.'; return;
    }
    if (!this.form.telefono.trim()) {
      this.errorMsg = 'Ingrese su teléfono.'; return;
    }
    if (!validarEmail(this.form.email)) {
      this.errorMsg = 'El correo electrónico no tiene un formato válido.'; return;
    }
    if (!this.form.preguntaSeguridad) {
      this.errorMsg = 'Seleccione una pregunta de seguridad.'; return;
    }
    if (!this.form.respuestaSeguridad.trim()) {
      this.errorMsg = 'Ingrese la respuesta de seguridad.'; return;
    }
    const pwVal = validarPassword(this.form.password);
    if (!pwVal.valido) { this.errorMsg = pwVal.mensaje; return; }
    if (this.form.password !== this.confirmarPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.'; return;
    }

    this.loading = true;

    this.ciudadanoService.registrarNatural({
      tipoDocumento:      this.form.tipoDocumento as any,
      numeroDocumento:    this.form.numeroDocumento,
      nombres:            this.form.nombres,
      apellidoPaterno:    this.form.apellidoPaterno,
      apellidoMaterno:    this.form.apellidoMaterno,
      departamento:       this.form.departamento,
      provincia:          this.form.provincia,
      distrito:           this.form.distrito,
      direccion:          this.form.direccion,
      telefono:           this.form.telefono,
      email:              this.form.email,
      password:           this.form.password,
      preguntaSeguridad:  this.form.preguntaSeguridad as any,
      respuestaSeguridad: this.form.respuestaSeguridad,
      afiliadoBuzon:      this.form.afiliadoBuzon
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/ciudadano/verificar'], {
          state: {
            identificador: res.identificador,
            tipoPersna:    res.tipoPersna
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMsg = this.interpretarError(err);
      }
    });
  }

  private interpretarError(err: HttpErrorResponse): string {
    const body = err.error;
    switch (err.status) {
      case 400:
        if (body?.campos) return `Dato inválido: ${Object.values(body.campos)[0]}`;
        return body?.message || 'Datos del formulario incorrectos.';
      case 409: return body?.message || 'Ya existe una cuenta con estos datos.';
      case 0:   return 'No se pudo conectar con el servidor.';
      default:  return body?.message || 'Error al registrar. Intente nuevamente.';
    }
  }
}
