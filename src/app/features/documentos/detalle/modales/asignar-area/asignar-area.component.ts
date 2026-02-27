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
  @Input() areaSeleccionada = '';

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();

  onCerrar(): void {
    this.cerrar.emit();
  }

  onGuardar(): void {
    this.guardar.emit();
  }
}