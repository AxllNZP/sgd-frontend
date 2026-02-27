import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DerivacionRequest } from '../../../../../core/models/derivacion.model';
import { AreaResponse } from '../../../../../core/models/area.model';

@Component({
  selector: 'app-derivar-documento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './derivar-documento.component.html',
  styleUrl: './derivar-documento.component.css'
})
export class DerivarDocumentoComponent {

  @Input() visible = false;
  @Input() derivacionForm!: DerivacionRequest;
  @Input() areas: AreaResponse[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();

  intentoEnvio = false;

  esMotivoInvalido(): boolean {
    return !this.derivacionForm?.motivo || this.derivacionForm.motivo.trim() === '';
  }
  esAreaInvalida(): boolean {
  return !this.derivacionForm?.areaDestinoId || this.derivacionForm.areaDestinoId === '';
}

  onCerrar(): void {
    this.intentoEnvio = false;
    this.cerrar.emit();
  }

  onGuardar(): void {
  this.intentoEnvio = true;

  if (this.esAreaInvalida() || this.esMotivoInvalido()) {
    return;
  }

  this.guardar.emit();
}
}