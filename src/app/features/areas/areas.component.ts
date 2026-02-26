import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AreaService } from '../../core/services/area.service';
import { AreaResponse, AreaRequest } from '../../core/models/area.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule,
    TagModule, DialogModule, TextareaModule
  ],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.css'
})
export class AreasComponent implements OnInit {
  areas: AreaResponse[] = [];
  cargando = false;
  mostrarDialog = false;

  nuevaArea: AreaRequest = {
    nombre: '',
    descripcion: ''
  };

  error = '';

  constructor(
    private areaService: AreaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.areaService.listar().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  abrirDialog(): void {
    this.nuevaArea = { nombre: '', descripcion: '' };
    this.error = '';
    this.mostrarDialog = true;
  }

  crear(): void {
    if (!this.nuevaArea.nombre) {
      this.error = 'El nombre del área es obligatorio';
      return;
    }
    this.areaService.crear(this.nuevaArea).subscribe({
      next: () => {
        this.mostrarDialog = false;
        this.listar();
      },
      error: () => {
        this.error = 'Error al crear el área. El nombre puede estar en uso.';
      }
    });
  }

  desactivar(id: string): void {
    if (!confirm('¿Está seguro de desactivar esta área?')) return;
    this.areaService.desactivar(id).subscribe({
      next: () => this.listar()
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }
}