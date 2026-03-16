// asignar-area.component.ts — CORREGIDO

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AreaResponse } from '../../../../../core/models/area.model';

@Component({
  selector: 'app-asignar-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignar-area.component.html',
  styleUrl: './asignar-area.component.css'
})
export class AsignarAreaComponent {

  @Input() visible = false;
  @Input() areas: AreaResponse[] = [];

  // areaSeleccionada ya NO viene del padre como @Input
  // El componente maneja su propia selección internamente
  areaSeleccionada = '';

  @Output() cerrar  = new EventEmitter<void>();

  // CAMBIO CLAVE: emite el UUID del área en lugar de void
  // El padre recibe el valor directamente en el evento $event
  @Output() guardar = new EventEmitter<string>();

  onCerrar(): void {
    this.areaSeleccionada = ''; // resetear al cerrar
    this.cerrar.emit();
  }

  onGuardar(): void {
    // Validación mínima: no enviar si no seleccionó nada
    if (!this.areaSeleccionada) return;

    this.guardar.emit(this.areaSeleccionada); // emite el UUID al padre
    this.areaSeleccionada = ''; // resetear tras guardar
  }
}
