import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CambioEstado } from '../../../../../core/models/documento.model';

@Component({
  selector: 'app-cambiar-estado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cambiar-estado.component.html',
  styleUrl: './cambiar-estado.component.css'
})
export class CambiarEstadoComponent {

  @Input() visible = false;
  @Input() cambioEstado!: CambioEstado;
  @Input() estados: { label: string; value: string }[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();

  onCerrar(): void {
    this.cerrar.emit();
  }

  onGuardar(): void {
    this.guardar.emit();
  }
}