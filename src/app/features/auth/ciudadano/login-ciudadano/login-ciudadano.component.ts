import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  form = {
    tipoPersna: 'NATURAL',
    identificador: '',
    password: ''
  };

  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(private http: HttpClient, private router: Router) {}

  login(): void {
    this.errorMsg = '';

    if (!this.form.identificador || !this.form.password) {
      this.errorMsg = 'Complete todos los campos.';
      return;
    }

    const { valido } = validarDniRuc(this.form.identificador);
    if (!valido) {
      this.errorMsg = 'El DNI debe tener 8 dígitos o el RUC 11 dígitos.';
      return;
    }

    this.loading = true;

    this.http.post<any>('http://localhost:8080/api/auth/login/ciudadano', this.form)
      .subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('rol', res.rol);
          localStorage.setItem('nombre', res.nombre);
          localStorage.setItem('email', res.email);
          const tipoPersna = this.form.tipoPersna === 'NATURAL' ? 'NATURAL' : 'JURIDICA';
          localStorage.setItem('tipoPersna', tipoPersna);
          localStorage.setItem('identificador', this.form.identificador);
          this.router.navigate(['/registro-documento']);
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Credenciales incorrectas.';
          this.loading = false;
        }
      });
  }
}