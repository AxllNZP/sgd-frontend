import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';



@Component({
  selector: 'app-registro-juridica',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-juridica.component.html',
  styleUrl: './registro-juridica.component.css'
})
export class RegistroJuridicaComponent {

  form: any = {
    ruc: '',
    razonSocial: '',
    password: '',
    preguntaSeguridad: '',
    respuestaSeguridad: '',
    tipoDocRepresentante: '',
    numDocRepresentante: '',
    nombresRepresentante: '',
    apellidoPaternoRepresentante: '',
    apellidoMaternoRepresentante: '',
    emailRepresentante: '',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    telefono: '',
    contactosNotificacion: [],
    afiliadoBuzon: false
  };

  confirmarPassword = '';
  loading = false;
  errorMsg = '';
  showPw = false;
  showPwConfirm = false;

  constructor(private http: HttpClient, private router: Router) {}

  agregarContacto(): void {
    this.form.contactosNotificacion.push({ nombres: '', email: '', activo: true });
  }

  eliminarContacto(index: number): void {
    this.form.contactosNotificacion.splice(index, 1);
  }

  registrar(): void {
    this.errorMsg = '';

    if (this.form.password !== this.confirmarPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    // Limpiar contactos vacíos antes de enviar
    const payload = {
      ...this.form,
      contactosNotificacion: this.form.contactosNotificacion.filter(
        (c: any) => c.nombres.trim() && c.email.trim()
      )
    };

    this.loading = true;

    this.http.post<any>('http://localhost:8080/api/auth/registro/juridica', payload)
      .subscribe({
        next: (res) => {
          this.router.navigate(['/ciudadano/verificar'], {
            state: {
              identificador: res.identificador ?? this.form.ruc,
              tipoPersna: res.tipoPersna ?? res.tipoPersona ?? 'JURIDICA'
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