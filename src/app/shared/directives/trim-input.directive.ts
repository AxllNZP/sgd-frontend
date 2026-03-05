import { Directive, HostListener, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appTrimInput]',
  standalone: true
})
export class TrimInputDirective {

  constructor(@Self() private control: NgControl) {}

  @HostListener('blur')
  onBlur(): void {
    const valor = this.control.value;
    if (typeof valor === 'string') {
      this.control.control?.setValue(valor.trim());
    }
  }
}