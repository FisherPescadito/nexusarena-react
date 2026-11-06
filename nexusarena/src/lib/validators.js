// Validaciones reutilizables: cada regla devuelve true o un mensaje de error.
export class BusinessError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'BusinessError';
    this.errors = errors; // { campo: 'mensaje' }
  }
}

export const required = (msg = 'Campo obligatorio') => (v) => String(v ?? '').trim() !== '' || msg;
export const minLen = (n) => (v) => String(v ?? '').trim().length >= n || `Mínimo ${n} caracteres`;
export const maxLen = (n) => (v) => String(v ?? '').trim().length <= n || `Máximo ${n} caracteres`;
export const email = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? '') || 'Correo no válido';
export const pattern = (re, msg) => (v) => re.test(v ?? '') || msg;
export const oneOf = (list) => (v) => list.includes(v) || 'Valor no permitido';
export const futureDate = (v) => new Date(`${v}T23:59:59`) > new Date() || 'La fecha debe ser futura';
export const strongPassword = (v) =>
  (/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v ?? '')) || 'Mínimo 8 caracteres, con letras y números';

/** Aplica un esquema { campo: [reglas] } y devuelve { campo: mensaje } (vacío si todo es válido). */
export function validate(values, schema) {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    for (const rule of rules) {
      const result = rule(values[field], values);
      if (result !== true) { errors[field] = result; break; }
    }
  }
  return errors;
}

export function assertValid(values, schema) {
  const errors = validate(values, schema);
  if (Object.keys(errors).length) throw new BusinessError('Revisa los campos marcados', errors);
}
