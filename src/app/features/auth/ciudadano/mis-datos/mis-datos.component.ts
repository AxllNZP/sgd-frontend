import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

// Valores del enum PreguntaSeguridad del backend
const PREGUNTAS_SEGURIDAD = [
  { value: 'NOMBRE_MASCOTA',       label: '¿Cuál es el nombre de tu primera mascota?' },
  { value: 'CIUDAD_NACIMIENTO',    label: '¿En qué ciudad naciste?' },
  { value: 'NOMBRE_MADRE',         label: '¿Cuál es el nombre de soltera de tu madre?' },
  { value: 'COLEGIO',              label: '¿En qué colegio estudiaste la primaria?' },
  { value: 'PELICULA_FAVORITA',    label: '¿Cuál es tu película favorita?' },
  { value: 'MEJOR_AMIGO',          label: '¿Cuál es el nombre de tu mejor amigo de infancia?' }
];

@Component({
  selector: 'app-mis-datos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-datos.component.html',
  styleUrl: './mis-datos.component.css'
})
export class MisDatosComponent implements OnInit {

  // ── Preguntas de seguridad ────────────────────────────────
  preguntasSeguridad = PREGUNTAS_SEGURIDAD;

  // ── Pestañas ──────────────────────────────────────────────
  pestanaActiva: 'perfil' | 'password' = 'perfil';

  // ── Sesión (guardada al hacer login) ─────────────────────
  tipoPersna   = '';   // 'NATURAL' | 'JURIDICA'
  identificador = '';  // DNI o RUC

  // ── Datos de solo lectura del perfil ─────────────────────
  // Natural
  lectNatural = {
    tipoDocumento:    '',
    numeroDocumento:  '',
    nombres:          '',
    apellidoPaterno:  '',
    apellidoMaterno:  '',
    departamento:     '',
    provincia:        '',
    distrito:         '',
    descripcionPregunta: ''
  };

  // Jurídica
  lectJuridica = {
    ruc:                          '',
    razonSocial:                  '',
    nombresRepresentante:         '',
    apellidoPaternoRepresentante: '',
    apellidoMaternoRepresentante: '',
    emailRepresentante:           '',
    descripcionPregunta:          ''
  };

  // ── Datos editables Natural: EditarNaturalRequestDTO ─────
  // { direccion, telefono, email, preguntaSeguridad, respuestaSeguridad }
  editNatural = {
    direccion:          '',
    telefono:           '',
    email:              '',
    preguntaSeguridad:  '',   // valor del enum PreguntaSeguridad
    respuestaSeguridad: ''
  };

  // ── Datos editables Jurídica: EditarJuridicaRequestDTO ───
  // { direccion, telefono, departamento, provincia, distrito }
  editJuridica = {
    direccion:   '',
    telefono:    '',
    departamento: '',
    provincia:   '',
    distrito:    ''
  };

  // ── Cambio de contraseña: CambiarPasswordRequestDTO ──────
  // { tipoPersna, identificador, passwordActual, nuevaPassword, confirmarPassword }
  passwords = {
    passwordActual:    '',
    nuevaPassword:     '',
    confirmarPassword: ''
  };

  // ── Estado ────────────────────────────────────────────────
  cargandoPerfil  = false;
  guardandoPerfil = false;
  guardandoPass   = false;

  errorPerfil  = '';
  exitoPerfil  = '';
  errorPass    = '';
  exitoPass    = '';

  constructor(private http: HttpClient) {}

  // ── Carga inicial ─────────────────────────────────────────
  ngOnInit(): void {
    // El login ciudadano debe guardar tipoPersna e identificador en localStorage
    this.tipoPersna    = localStorage.getItem('tipoPersna')    || '';
    this.identificador = localStorage.getItem('identificador') || '';

    if (!this.tipoPersna || !this.identificador) {
      this.errorPerfil = 'No se pudo identificar la sesión. Vuelva a iniciar sesión.';
      return;
    }
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargandoPerfil = true;

    if (this.tipoPersna === 'NATURAL') {
      // GET /api/cuenta/natural/{numeroDocumento}
      // Responde: PerfilNaturalResponseDTO
      this.http.get<any>(
        `http://localhost:8080/api/cuenta/natural/${this.identificador}`
      ).subscribe({
        next: (data) => {
          this.cargandoPerfil = false;
          // Solo lectura
          this.lectNatural = {
            tipoDocumento:       data.tipoDocumento       || '',
            numeroDocumento:     data.numeroDocumento     || '',
            nombres:             data.nombres             || '',
            apellidoPaterno:     data.apellidoPaterno     || '',
            apellidoMaterno:     data.apellidoMaterno     || '',
            departamento:        data.departamento        || '',
            provincia:           data.provincia           || '',
            distrito:            data.distrito            || '',
            descripcionPregunta: data.descripcionPregunta || ''
          };
          // Editables
          this.editNatural = {
            direccion:          data.direccion          || '',
            telefono:           data.telefono           || '',
            email:              data.email              || '',
            preguntaSeguridad:  data.preguntaSeguridad  || '',
            respuestaSeguridad: ''   // no se devuelve por seguridad
          };
        },
        error: () => {
          this.cargandoPerfil = false;
          this.errorPerfil = 'No se pudieron cargar sus datos.';
        }
      });

    } else {
      // GET /api/cuenta/juridica/{ruc}
      // Responde: PerfilJuridicaResponseDTO
      this.http.get<any>(
        `http://localhost:8080/api/cuenta/juridica/${this.identificador}`
      ).subscribe({
        next: (data) => {
          this.cargandoPerfil = false;
          // Solo lectura
          this.lectJuridica = {
            ruc:                          data.ruc                          || '',
            razonSocial:                  data.razonSocial                  || '',
            nombresRepresentante:         data.nombresRepresentante         || '',
            apellidoPaternoRepresentante: data.apellidoPaternoRepresentante || '',
            apellidoMaternoRepresentante: data.apellidoMaternoRepresentante || '',
            emailRepresentante:           data.emailRepresentante           || '',
            descripcionPregunta:          data.descripcionPregunta          || ''
          };
          // Editables
          this.editJuridica = {
            direccion:    data.direccion    || '',
            telefono:     data.telefono     || '',
            departamento: data.departamento || '',
            provincia:    data.provincia    || '',
            distrito:     data.distrito     || ''
          };
        },
        error: () => {
          this.cargandoPerfil = false;
          this.errorPerfil = 'No se pudieron cargar sus datos.';
        }
      });
    }
  }

  // ── Guardar perfil ────────────────────────────────────────
  guardarPerfil(): void {
    this.errorPerfil = '';
    this.exitoPerfil = '';

    if (this.tipoPersna === 'NATURAL') {
      // Validaciones de EditarNaturalRequestDTO
      if (!this.editNatural.direccion.trim()) {
        this.errorPerfil = 'La dirección es obligatoria.'; return;
      }
      if (!this.editNatural.telefono.trim()) {
        this.errorPerfil = 'El teléfono es obligatorio.'; return;
      }
      if (!this.editNatural.email.trim()) {
        this.errorPerfil = 'El correo electrónico es obligatorio.'; return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editNatural.email)) {
        this.errorPerfil = 'El correo no tiene un formato válido.'; return;
      }
      if (!this.editNatural.preguntaSeguridad) {
        this.errorPerfil = 'Seleccione una pregunta de seguridad.'; return;
      }
      if (!this.editNatural.respuestaSeguridad.trim()) {
        this.errorPerfil = 'La respuesta de seguridad es obligatoria.'; return;
      }

      this.guardandoPerfil = true;
      // PUT /api/cuenta/natural/{numeroDocumento}
      // Body: EditarNaturalRequestDTO
      this.http.put<any>(
        `http://localhost:8080/api/cuenta/natural/${this.identificador}`,
        this.editNatural
      ).subscribe({
        next: () => {
          this.guardandoPerfil = false;
          this.exitoPerfil = 'Datos actualizados correctamente.';
          this.editNatural.respuestaSeguridad = ''; // limpiar por seguridad
          this.cargarPerfil(); // recargar descripción de pregunta actualizada
        },
        error: (err) => {
          this.guardandoPerfil = false;
          this.errorPerfil = err.error?.message || 'No se pudieron guardar los cambios.';
        }
      });

    } else {
      // Validaciones de EditarJuridicaRequestDTO
      if (!this.editJuridica.direccion.trim()) {
        this.errorPerfil = 'La dirección es obligatoria.'; return;
      }
      if (!this.editJuridica.telefono.trim()) {
        this.errorPerfil = 'El teléfono es obligatorio.'; return;
      }
      if (!this.editJuridica.departamento.trim()) {
        this.errorPerfil = 'El departamento es obligatorio.'; return;
      }
      if (!this.editJuridica.provincia.trim()) {
        this.errorPerfil = 'La provincia es obligatoria.'; return;
      }
      if (!this.editJuridica.distrito.trim()) {
        this.errorPerfil = 'El distrito es obligatorio.'; return;
      }

      this.guardandoPerfil = true;
      // PUT /api/cuenta/juridica/{ruc}
      // Body: EditarJuridicaRequestDTO
      this.http.put<any>(
        `http://localhost:8080/api/cuenta/juridica/${this.identificador}`,
        this.editJuridica
      ).subscribe({
        next: () => {
          this.guardandoPerfil = false;
          this.exitoPerfil = 'Datos actualizados correctamente.';
        },
        error: (err) => {
          this.guardandoPerfil = false;
          this.errorPerfil = err.error?.message || 'No se pudieron guardar los cambios.';
        }
      });
    }
  }

  // ── Cambiar contraseña ────────────────────────────────────
  // POST /api/cuenta/cambiar-password
  // Body: CambiarPasswordRequestDTO
  // { tipoPersna, identificador, passwordActual, nuevaPassword, confirmarPassword }
  cambiarPassword(): void {
    this.errorPass = '';
    this.exitoPass = '';

    if (!this.passwords.passwordActual) {
      this.errorPass = 'Ingrese su contraseña actual.'; return;
    }
    if (!this.passwords.nuevaPassword) {
      this.errorPass = 'Ingrese la nueva contraseña.'; return;
    }
    if (this.passwords.nuevaPassword.length < 8) {
      this.errorPass = 'La nueva contraseña debe tener al menos 8 caracteres.'; return;
    }
    if (this.passwords.nuevaPassword !== this.passwords.confirmarPassword) {
      this.errorPass = 'Las contraseñas nuevas no coinciden.'; return;
    }
    if (this.passwords.passwordActual === this.passwords.nuevaPassword) {
      this.errorPass = 'La nueva contraseña debe ser diferente a la actual.'; return;
    }

    this.guardandoPass = true;
    this.http.post<void>('http://localhost:8080/api/cuenta/cambiar-password', {
      tipoPersna:        this.tipoPersna,
      identificador:     this.identificador,
      passwordActual:    this.passwords.passwordActual,
      nuevaPassword:     this.passwords.nuevaPassword,
      confirmarPassword: this.passwords.confirmarPassword
    }).subscribe({
      next: () => {
        this.guardandoPass = false;
        this.exitoPass = 'Contraseña actualizada correctamente.';
        this.passwords = { passwordActual: '', nuevaPassword: '', confirmarPassword: '' };
      },
      error: (err) => {
        this.guardandoPass = false;
        this.errorPass = err.error?.message || 'No se pudo cambiar la contraseña.';
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  cambiarPestana(p: 'perfil' | 'password'): void {
    this.pestanaActiva = p;
    this.errorPerfil = ''; this.exitoPerfil = '';
    this.errorPass   = ''; this.exitoPass   = '';
  }

  get esNatural(): boolean { return this.tipoPersna === 'NATURAL'; }
}