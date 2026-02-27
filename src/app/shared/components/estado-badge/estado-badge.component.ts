import { Component, Input } from '@angular/core';
import { FormatoEstadoPipe } from '../../pipes/formato-estado.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estado-badge',
  standalone: true,
  imports: [CommonModule, FormatoEstadoPipe],
  template: `
    <span [class]="'estado-badge ' + getClase()">
      {{ estado | formatoEstado }}
    </span>
  `,
  styles: [`
    .estado-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .badge-info    { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.25); }
    .badge-warn    { background: rgba(245,158,11,0.15);  color: #fbbf24; border: 1px solid rgba(245,158,11,0.25); }
    .badge-danger  { background: rgba(239,68,68,0.15);   color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
    .badge-success { background: rgba(74,222,128,0.15);  color: #4ade80; border: 1px solid rgba(74,222,128,0.25); }
  `]
})
export class EstadoBadgeComponent {
  @Input() estado: string = '';

  getClase(): string {
    switch (this.estado) {
      case 'RECIBIDO':   return 'badge-info';
      case 'EN_PROCESO': return 'badge-warn';
      case 'OBSERVADO':  return 'badge-danger';
      case 'ARCHIVADO':  return 'badge-success';
      default:           return 'badge-info';
    }
  }
}