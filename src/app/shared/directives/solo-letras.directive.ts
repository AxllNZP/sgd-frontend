import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appSoloLetras]',
  standalone: true
})
export class SoloLetrasDirective {

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const teclasPermitidas = [
      'Backspace', 'Delete', 'Tab',
      'ArrowLeft', 'ArrowRight', 'Home', 'End', ' '
    ];

    if (teclasPermitidas.includes(event.key)) return;

    // Permite letras, tildes y ñ
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const texto = event.clipboardData?.getData('text') || '';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(texto)) {
      event.preventDefault();
    }
  }
}