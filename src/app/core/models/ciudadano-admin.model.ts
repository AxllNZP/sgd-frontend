// ciudadano-admin.model.ts
// Mapeado 1:1 con los DTOs del backend (AdminCiudadanosController)

export interface CiudadanoNaturalResumen {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  departamento: string;
  provincia: string;
  distrito: string;
  activo: boolean;
  verificado: boolean;
  afiliadoBuzon: boolean;
  fechaCreacion: string;  // ISO-8601
}

export interface CiudadanoJuridicaResumen {
  id: string;
  ruc: string;
  razonSocial: string;
  emailRepresentante: string;
  nombresRepresentante: string;
  apellidoPaternoRepresentante: string;
  apellidoMaternoRepresentante: string;
  telefono: string;
  departamento: string;
  provincia: string;
  distrito: string;
  activo: boolean;
  verificado: boolean;
  afiliadoBuzon: boolean;
  totalContactos: number;
  fechaCreacion: string;
}

export interface CiudadanoFiltro {
  busqueda: string;
  activo: boolean | null;   // null = todos
}

export interface EstadisticasCiudadanos {
  totalNaturales: number;
  naturalesActivos: number;
  naturalesInactivos: number;
  naturalesVerificados: number;
  totalJuridicas: number;
  juridicasActivas: number;
  juridicasInactivas: number;
  juridicasVerificadas: number;
  totalCiudadanos: number;
}
