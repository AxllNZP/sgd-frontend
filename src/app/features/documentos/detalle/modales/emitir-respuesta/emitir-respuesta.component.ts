import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RespuestaRequest } from '../../../../../core/models/respuesta.model';

@Component({
  selector: 'app-emitir-respuesta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emitir-respuesta.component.html',
  styleUrl: './emitir-respuesta.component.css'
})
export class EmitirRespuestaComponent {

  @Input() visible = false;
  @Input() respuestaForm!: RespuestaRequest;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();

  onCerrar(): void {
    this.cerrar.emit();
  }

  onGuardar(): void {
    this.guardar.emit();
  }
}