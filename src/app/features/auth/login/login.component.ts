// =============================================================
// login.component.ts
// CORRECCIONES:
//   1. BUG CRÍTICO: 'const tipoPersna = tipo!' estaba truncado/incompleto.
//      Corregido a: 'const tipoPersna: "NATURAL" | "JURIDICA" = tipo!;'
//   2. AÑADIDO: manejo específico de códigos HTTP del backend en ambos logins:
//      - 401 → Credenciales incorrectas
//      - 403 → Sin permiso / cuenta no verificada
//      - 404 → Usuario no encontrado
//      - 0   → Sin conexión al servidor
//   3. login() usa AuthService (URL relativa ✓) — ya era correcto
//   4. loginCiudadano() usa CiudadanoService (URL relativa ✓ tras corrección del service)
// =============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CiudadanoService } from '../../../core/services/ciudadano.service';
import { SoloNumerosDirective } from '../../../shared/directives/solo-numeros.directive';
import { TrimInputDirective } from '../../../shared/directives/trim-input.directive';
import { validarDniRuc } from '../../../shared/validators/validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SoloNumerosDirective, TrimInputDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  // ---- TABS ----
  tabActivo: 'sistema' | 'ciudadano' = 'sistema';

  // ---- FORMULARIO PERSONAL INTERNO ----
  email = '';
  password = '';

  // ---- FORMULARIO CIUDADANO ----
  identificador = '';
  passwordCiudadano = '';

  // ---- ESTADO COMPARTIDO ----
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private ciudadanoService: CiudadanoService,
    private router: Router
  ) {}

  cambiarTab(tab: 'sistema' | 'ciudadano'): void {
    this.tabActivo = tab;
    this.error = '';
    this.email = '';
    this.password = '';
    this.identificador = '';
    this.passwordCiudadano = '';
  }

  // ---- LOGIN PERSONAL INTERNO ----
  // Usa AuthService.login() → POST /api/auth/login (URL relativa ✓)
  // Body: LoginRequestDTO { email, password }
  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Por favor ingrese email y contraseña';
      return;
    }
    this.cargando = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = this.resolverErrorInterno(err);
      }
    });
  }

  // ---- LOGIN CIUDADANO ----
  // Usa CiudadanoService.login() → POST /api/auth/login/ciudadano (URL relativa ✓)
  // Body: LoginCiudadanoRequestDTO { tipoPersna, identificador, password }
  loginCiudadano(): void {
    if (!this.identificador || !this.passwordCiudadano) {
      this.error = 'Por favor ingrese su DNI/RUC y contraseña';
      return;
    }

    const { valido, tipo } = validarDniRuc(this.identificador);
    if (!valido) {
      this.error = 'El DNI debe tener 8 dígitos o el RUC 11 dígitos';
      return;
    }

    // CORRECCIÓN: línea estaba truncada en 'const tipoPersna = tipo!'
    // tipo es 'NATURAL' | 'JURIDICA' | null — al llegar aquí (valido=true) nunca es null
    const tipoPersna: 'NATURAL' | 'JURIDICA' = tipo!;

    this.cargando = true;
    this.error = '';

    this.ciudadanoService.login({
      tipoPersna,
      identificador: this.identificador,
      password:      this.passwordCiudadano
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        // Guardar sesión idéntico a AuthService.loginCiudadano()
        localStorage.setItem('token',        res.token);
        localStorage.setItem('email',        res.email);
        localStorage.setItem('rol',          res.rol);
        localStorage.setItem('nombre',       res.nombre);
        localStorage.setItem('tipoPersna',   tipoPersna);
        localStorage.setItem('identificador', this.identificador);
        // Ciudadano va a registrar su documento
        this.router.navigate(['/registro-documento']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = this.resolverErrorCiudadano(err);
      }
    });
  }

  // Mensajes específicos para login de personal interno
  // NOTA: un 404 aquí significa que el proxy no está activo (ng serve sin --proxy-config)
  // porque el backend devuelve 401 para credenciales incorrectas, nunca 404 para usuarios
  private resolverErrorInterno(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Correo o contraseña incorrectos.';
    if (err.status === 403) return 'Su cuenta no tiene permiso para acceder.';
    if (err.status === 429) return 'Demasiados intentos. Espere 15 minutos.';
    if (err.status === 404 || err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique que el backend esté corriendo e inicie el frontend con "npm start".';
    }
    return err.error?.message || 'Error inesperado. Intente nuevamente.';
  }

  // Mensajes específicos para login ciudadano
  private resolverErrorCiudadano(err: HttpErrorResponse): string {
    if (err.status === 401) return 'DNI/RUC o contraseña incorrectos.';
    if (err.status === 403) return 'Cuenta no verificada. Active su cuenta primero.';
    if (err.status === 429) return 'Demasiados intentos. Espere 15 minutos.';
    if (err.status === 404 || err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique que el backend esté corriendo e inicie el frontend con "npm start".';
    }
    return err.error?.message || 'Error inesperado. Intente nuevamente.';
  }
}