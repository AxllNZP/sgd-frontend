import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioResponse, UsuarioRequest, RolUsuario } from '../../core/models/usuario.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule,
    TagModule, SelectModule, DialogModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];
  cargando = false;
  mostrarDialog = false;

  nuevoUsuario: UsuarioRequest = {
    nombre: '',
    email: '',
    password: '',
    rol: 'CIUDADANO'
  };

  roles = [
    { label: 'Ciudadano', value: 'CIUDADANO' },
    { label: 'Mesa de Partes', value: 'MESA_PARTES' },
    { label: 'Administrador', value: 'ADMINISTRADOR' }
  ];

  error = '';

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  abrirDialog(): void {
    this.nuevoUsuario = { nombre: '', email: '', password: '', rol: 'CIUDADANO' };
    this.error = '';
    this.mostrarDialog = true;
  }

  crear(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email || !this.nuevoUsuario.password) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }
    this.usuarioService.crear(this.nuevoUsuario).subscribe({
      next: () => {
        this.mostrarDialog = false;
        this.listar();
      },
      error: (err) => {
        this.error = 'Error al crear usuario. El email puede estar en uso.';
      }
    });
  }

  desactivar(id: string): void {
    if (!confirm('¿Está seguro de desactivar este usuario?')) return;
    this.usuarioService.desactivar(id).subscribe({
      next: () => this.listar()
    });
  }

  getRolClass(rol: string): string {
    switch(rol) {
      case 'ADMINISTRADOR': return 'danger';
      case 'MESA_PARTES': return 'warn';
      case 'CIUDADANO': return 'info';
      default: return 'info';
    }
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }
}