import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoEstado',
  standalone: true
})
export class FormatoEstadoPipe implements PipeTransform {

  transform(valor: string): string {
    if (!valor) return '';

    switch (valor) {
      case 'RECIBIDO':   return 'Recibido';
      case 'EN_PROCESO': return 'En Proceso';
      case 'OBSERVADO':  return 'Observado';
      case 'ARCHIVADO':  return 'Archivado';
      default:           return valor;
    }
  }
}