import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appMaxValue]',
  standalone: true
})
export class MaxValueDirective {

  @Input('appMaxValue') max: number = 999;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = Number(input.value);

    if (valor > this.max) {
      input.value = String(this.max);
      input.dispatchEvent(new Event('input'));
    }
    if (valor < 1 && input.value !== '') {
      input.value = '1';
      input.dispatchEvent(new Event('input'));
    }
  }
}