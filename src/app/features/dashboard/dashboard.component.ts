import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentoService } from '../../core/services/documento.service';
import { DocumentoResponse } from '../../core/models/documento.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  nombre = '';
  rol = '';

  totalDocumentos = 0;
  recibidos = 0;
  enProceso = 0;
  archivados = 0;

  documentosRecientes: DocumentoResponse[] = [];

  constructor(
    private authService: AuthService,
    private documentoService: DocumentoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.nombre = this.authService.getNombre();
    this.rol = this.authService.getRol();
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.documentoService.listarTodos().subscribe({
      next: (docs) => {
        this.totalDocumentos = docs.length;
        this.recibidos = docs.filter(d => d.estado === 'RECIBIDO').length;
        this.enProceso = docs.filter(d => d.estado === 'EN_PROCESO').length;
        this.archivados = docs.filter(d => d.estado === 'ARCHIVADO').length;
        this.documentosRecientes = docs.slice(0, 5);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'RECIBIDO': return 'badge-info';
      case 'EN_PROCESO': return 'badge-warning';
      case 'OBSERVADO': return 'badge-danger';
      case 'ARCHIVADO': return 'badge-success';
      default: return 'badge-info';
    }
  }
}