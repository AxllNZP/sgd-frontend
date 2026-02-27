import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentoService } from '../../../core/services/documento.service';
import { SoloNumerosDirective } from '../../../shared/directives/solo-numeros.directive';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SoloNumerosDirective],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  form = {
    remitente: '',
    dniRuc: '',
    emailRemitente: '',
    asunto: '',
    tipoDocumento: ''
  };

  tiposDocumento = [
    { label: 'Solicitud', value: 'SOLICITUD' },
    { label: 'Informe', value: 'INFORME' },
    { label: 'Oficio', value: 'OFICIO' },
    { label: 'Memorando', value: 'MEMORANDO' },
    { label: 'Carta', value: 'CARTA' }
  ];

  archivo: File | null = null;
  archivoNombre = '';
  error = '';
  exito = false;
  numeroTramite = '';
  cargando = false;

  constructor(private documentoService: DocumentoService) {}

  onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivo = file;
      this.archivoNombre = file.name;
    }
  }

  registrar(): void {
  if (!this.form.remitente || !this.form.dniRuc || !this.form.asunto || !this.form.emailRemitente) {
    this.error = 'Por favor complete todos los campos obligatorios';
    return;
  }

  const soloNumeros = /^\d+$/.test(this.form.dniRuc);
  if (!soloNumeros) {
    this.error = 'El DNI o RUC solo debe contener números';
    return;
  }

  if (this.form.dniRuc.length !== 8 && this.form.dniRuc.length !== 11) {
    this.error = 'El DNI debe tener 8 dígitos o el RUC 11 dígitos';
    return;
  }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.emailRemitente);
  if (!emailValido) {
    this.error = 'El correo electrónico no tiene un formato válido';
    return;
  }

  this.cargando = true;
  this.error = '';

  const formData = new FormData();
  formData.append('datos', new Blob([JSON.stringify(this.form)], { type: 'application/json' }));
  if (this.archivo) {
    formData.append('archivo', this.archivo);
  }

  this.documentoService.registrar(formData).subscribe({
    next: (response) => {
      this.cargando = false;
      this.exito = true;
      this.numeroTramite = response.numeroTramite;
    },
    error: () => {
      this.cargando = false;
      this.error = 'Error al registrar el documento. Intente nuevamente.';
    }
  });
}
}