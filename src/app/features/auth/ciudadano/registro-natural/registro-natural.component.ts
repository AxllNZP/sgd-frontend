import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SoloNumerosDirective } from '../../../../shared/directives/solo-numeros.directive';
import { SoloLetrasDirective } from '../../../../shared/directives/solo-letras.directive';
import { TrimInputDirective } from '../../../../shared/directives/trim-input.directive';
import { validarEmail, validarPassword } from '../../../../shared/validators/validators';


@Component({
  selector: 'app-registro-natural',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SoloNumerosDirective, SoloLetrasDirective, TrimInputDirective],
  templateUrl: './registro-natural.component.html',
  styleUrl: './registro-natural.component.css'
})
export class RegistroNaturalComponent {

  form = {
    tipoDocumento: '',
    numeroDocumento: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    telefono: '',
    email: '',
    password: '',
    preguntaSeguridad: '',
    respuestaSeguridad: '',
    afiliadoBuzon: false
  };

  confirmarPassword = '';
  loading = false;
  errorMsg = '';
  showPw = false;
  showPwConfirm = false;

  constructor(private http: HttpClient, private router: Router) {}

  registrar(): void {
  this.errorMsg = '';

  const pwVal = validarPassword(this.form.password);
  if (!pwVal.valido) { this.errorMsg = pwVal.mensaje; return; }

  if (this.form.password !== this.confirmarPassword) {
    this.errorMsg = 'Las contraseñas no coinciden.'; return;
  }

  if (!validarEmail(this.form.email)) {
    this.errorMsg = 'El correo electrónico no tiene un formato válido.'; return;
  }

  this.loading = true;

    this.http.post<any>('http://localhost:8080/api/auth/registro/natural', this.form)
      .subscribe({
        next: (res) => {
          // res: { mensaje, identificador, tipoPersna, requiereVerificacion }
          this.router.navigate(['/ciudadano/verificar'], {
            state: {
              identificador: res.identificador,
              tipoPersna: res.tipoPersna
            }
          });
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Error al registrar. Intente nuevamente.';
          this.loading = false;
        }
      });
  }
}