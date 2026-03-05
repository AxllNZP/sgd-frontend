import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
      error: () => {
        this.cargando = false;
        this.error = 'Credenciales incorrectas';
      }
    });
  }

  // ---- LOGIN CIUDADANO ----
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
    const tipoPersna = tipo!;

    this.cargando = true;
    this.error = '';

    this.ciudadanoService.login({
      tipoPersna,
      identificador: this.identificador,
      password: this.passwordCiudadano
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        // Guardar token igual que AuthService
        localStorage.setItem('token', res.token);
        localStorage.setItem('email', res.email);
        localStorage.setItem('rol', res.rol);
        localStorage.setItem('nombre', res.nombre);
        localStorage.setItem('tipoPersna', tipoPersna);
        localStorage.setItem('identificador', this.identificador);
        // Ciudadano va a registrar su documento
        this.router.navigate(['/registro-documento']);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.message || 'DNI/RUC o contraseña incorrectos';
      }
    });
  }
}