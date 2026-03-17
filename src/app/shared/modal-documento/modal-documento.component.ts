import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-documento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-documento.component.html',
  styleUrls: ['./modal-documento.component.css']
})
export class ModalDocumentoComponent {

  @Input() numeroTramite: string = '';
  @Input() emailConfirmacion: string = '';

  @Output() cerrar = new EventEmitter<void>();
  @Output() nuevo = new EventEmitter<void>();

isClosing = false;

cerrarModal() {
  this.isClosing = true;

  setTimeout(() => {
    this.cerrar.emit();
    this.isClosing = false;
  }, 250);
}

nuevoRegistro() {
  this.isClosing = true;

  setTimeout(() => {
    this.nuevo.emit();
    this.isClosing = false;
  }, 250);
}


}
