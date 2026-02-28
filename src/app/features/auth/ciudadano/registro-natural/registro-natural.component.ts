import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registro-natural',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

    if (this.form.password !== this.confirmarPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
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