// =============================================================
// registro.models.ts
// Tipo compartido entre registro.component y sus sub-componentes.
// Mapea 1:1 con DocumentoRequestDTO del backend.
// Se separa aquí para que cada paso pueda importarlo sin
// depender del componente padre.
// =============================================================

export interface RegistroForm {
  remitente:                  string;
  dniRuc:                     string;
  emailRemitente:             string;
  asunto:                     string;
  tipoDocumento:              string;
  numeroFolios:               number;
  emailNotificacionAdicional: string;
  contactosNotificacionIds:   string[];
}

export const REGISTRO_FORM_VACIO: RegistroForm = {
  remitente:                  '',
  dniRuc:                     '',
  emailRemitente:             '',
  asunto:                     '',
  tipoDocumento:              '',
  numeroFolios:               1,
  emailNotificacionAdicional: '',
  contactosNotificacionIds:   []
};
