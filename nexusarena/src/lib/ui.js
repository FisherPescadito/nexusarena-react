export const fmtDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

export function toast(message, type = 'ok') {
  const el = Object.assign(document.createElement('div'), { className: `toast ${type}`, textContent: message });
  el.setAttribute('role', 'status');
  document.body.append(el);
  setTimeout(() => el.remove(), 3500);
}

/** Ejecuta una acción de negocio y muestra el resultado como toast. */
export function run(action, okMessage) {
  try { action(); if (okMessage) toast(okMessage); return true; }
  catch (e) { toast(e.message, 'err'); return false; }
}
