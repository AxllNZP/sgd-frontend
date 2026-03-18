// =============================================================
// emitir-respuesta.component.ts
// AÑADIDO:
//   @Input() errorRespuesta: string   — muestra el error del backend dentro del modal
//   @Input() guardandoRespuesta: boolean — deshabilita el botón mientras envía
//   (sin estos el modal no podía mostrar el error ni bloquear el botón)
// =============================================================

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

  @Input() visible              = false;
  @Input() respuestaForm!:       RespuestaRequest;
  @Input() guardandoRespuesta   = false;   // bloquea el botón
  @Input() errorRespuesta       = '';      // muestra error del backend

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();

  onCerrar():  void { this.cerrar.emit();  }
  onGuardar(): void { this.guardar.emit(); }
}
