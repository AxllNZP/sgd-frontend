import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seleccion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seleccion.component.html',
  styleUrl: './seleccion.component.css'
})
export class SeleccionComponent {

  constructor(private router: Router) {}

  elegir(tipo: 'natural' | 'juridica'): void {
    if (tipo === 'natural') {
      this.router.navigate(['/ciudadano/registro-natural']);
    } else {
      this.router.navigate(['/ciudadano/registro-juridica']);
    }
  }
}