import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentoService } from '../../../core/services/documento.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CardModule, DropdownModule, RouterLink],
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
  error = '';
  exito = false;
  numeroTramite = '';
  cargando = false;

  constructor(private documentoService: DocumentoService) {}

  onArchivoSeleccionado(event: any): void {
    this.archivo = event.target.files[0];
  }

  registrar(): void {
    if (!this.form.remitente || !this.form.dniRuc || !this.form.asunto || !this.form.emailRemitente) {
      this.error = 'Por favor complete todos los campos obligatorios';
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