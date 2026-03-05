export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validarDniRuc(valor: string): { valido: boolean; tipo: 'NATURAL' | 'JURIDICA' | null } {
  const soloNumeros = /^\d+$/.test(valor);
  if (!soloNumeros) return { valido: false, tipo: null };

  if (valor.length === 8)  return { valido: true, tipo: 'NATURAL' };
  if (valor.length === 11) return { valido: true, tipo: 'JURIDICA' };

  return { valido: false, tipo: null };
}

export function validarPassword(password: string): { valido: boolean; mensaje: string } {
  if (password.length < 8) {
    return { valido: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!/\d/.test(password)) {
    return { valido: false, mensaje: 'La contraseña debe contener al menos un número.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valido: false, mensaje: 'La contraseña debe contener al menos una letra.' };
  }
  return { valido: true, mensaje: '' };
}