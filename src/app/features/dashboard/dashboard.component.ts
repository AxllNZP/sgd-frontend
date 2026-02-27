import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentoService } from '../../core/services/documento.service';
import { DocumentoResponse } from '../../core/models/documento.model';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, EstadoBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('graficoEstados') graficoRef!: ElementRef<HTMLCanvasElement>;

  nombre = '';
  rol = '';

  totalDocumentos = 0;
  recibidos = 0;
  enProceso = 0;
  observados = 0;
  archivados = 0;

  documentosRecientes: DocumentoResponse[] = [];

  private chart: Chart | null = null;
  private datosCargados = false;

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

  ngAfterViewInit(): void {
    if (this.datosCargados) {
      this.crearGrafico();
    }
  }

  cargarEstadisticas(): void {
    this.documentoService.listarTodos().subscribe({
      next: (docs) => {
        this.totalDocumentos = docs.length;
        this.recibidos = docs.filter(d => d.estado === 'RECIBIDO').length;
        this.enProceso = docs.filter(d => d.estado === 'EN_PROCESO').length;
        this.observados = docs.filter(d => d.estado === 'OBSERVADO').length;
        this.archivados = docs.filter(d => d.estado === 'ARCHIVADO').length;
        this.documentosRecientes = docs.slice(0, 5);
        this.datosCargados = true;
        this.crearGrafico();
      }
    });
  }

  crearGrafico(): void {
    if (!this.graficoRef) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.graficoRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Recibidos', 'En Proceso', 'Observados', 'Archivados'],
        datasets: [{
          data: [this.recibidos, this.enProceso, this.observados, this.archivados],
          backgroundColor: ['#60a5fa', '#fbbf24', '#f87171', '#34d399'],
          borderColor: '#1e293b',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#e2e8f0',
              padding: 16,
              font: { size: 13 }
            }
          }
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}