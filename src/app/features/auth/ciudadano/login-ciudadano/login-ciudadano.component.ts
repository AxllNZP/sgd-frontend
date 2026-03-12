// =============================================================
// login-ciudadano.component.ts
// CORRECCIONES CRÍTICAS:
//   1. ELIMINADO: import HttpClient — componente no debe llamar la API directo
//   2. ELIMINADO: URL hardcodeada 'http://localhost:8080/...'
//   3. AÑADIDO: AuthService inyectado — usa loginCiudadano() que ya maneja
//      la URL relativa, el localStorage y el tipado LoginCiudadanoRequest
//   4. AÑADIDO: manejo específico de códigos HTTP del backend:
//      - 401 → Credenciales incorrectas
//      - 403 → Cuenta no verificada / sin permiso
//      - 404 → DNI/RUC no registrado
//      - 423 → Cuenta bloqueada (si aplica)
// =============================================================

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { SoloNumerosDirective } from '../../../../shared/directives/solo-numeros.directive';
import { TrimInputDirective } from '../../../../shared/directives/trim-input.directive';
import { validarDniRuc } from '../../../../shared/validators/validators';

@Component({
  selector: 'app-login-ciudadano',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SoloNumerosDirective, TrimInputDirective],
  templateUrl: './login-ciudadano.component.html',
  styleUrl: './login-ciudadano.component.css'
})
export class LoginCiudadanoComponent {

  // El campo 'tipoPersna' mantiene el typo intencional del backend — NO corregir.
  // Fuente: LoginCiudadanoRequestDTO.tipoPersna
  form = {
    tipoPersna: 'NATURAL' as 'NATURAL' | 'JURIDICA',
    identificador: '',
    password: ''
  };

  loading = false;
  errorMsg = '';
  showPassword = false;

  // CORRECCIÓN: AuthService en lugar de HttpClient
  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.errorMsg = '';

    if (!this.form.identificador || !this.form.password) {
      this.errorMsg = 'Complete todos los campos.';
      return;
    }

    const { valido, tipo } = validarDniRuc(this.form.identificador);
    if (!valido) {
      this.errorMsg = 'El DNI debe tener 8 dígitos o el RUC 11 dígitos.';
      return;
    }

    // Sincronizar tipoPersna con el identificador ingresado
    // Evita inconsistencias si el usuario seleccionó NATURAL pero ingresó un RUC
    this.form.tipoPersna = tipo!;

    this.loading = true;

    // AuthService.loginCiudadano() usa URL relativa /api/auth/login/ciudadano
    // y guarda token, email, rol, nombre, tipoPersna, identificador en localStorage
    this.authService.loginCiudadano(
      {
        tipoPersna:    this.form.tipoPersna,
        identificador: this.form.identificador,
        password:      this.form.password
      },
      this.form.identificador
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/registro-documento']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMsg = this.resolverError(err);
      }
    });
  }

  // NOTA: un 404 aquí significa que el proxy no está activo, no que falte el usuario.
  // El backend devuelve 401 para credenciales incorrectas. Un 404 viene del dev server de Angular.
  private resolverError(err: HttpErrorResponse): string {
    if (err.status === 401) {
      return 'DNI/RUC o contraseña incorrectos.';
    }
    if (err.status === 403) {
      return 'Cuenta no verificada. Revise su correo o active su cuenta.';
    }
    if (err.status === 429) {
      return 'Demasiados intentos. Espere 15 minutos.';
    }
    if (err.status === 404 || err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique que el backend esté corriendo e inicie el frontend con "npm start".';
    }
    return err.error?.message || 'Error inesperado. Intente nuevamente.';
  }
}