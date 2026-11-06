// Capa de persistencia. Hoy usa localStorage; la interfaz de Repository
// permite cambiarla por una API REST / JSON Server sin tocar los servicios.
// Suscripción para que React re-renderice cuando cambian los datos (useSyncExternalStore).
let version = 0;
const listeners = new Set();
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getVersion = () => version;
const notify = () => { version += 1; listeners.forEach((l) => l()); };

export class Repository {
  #key;
  constructor(name) { this.#key = `nexusarena:${name}`; }

  all() {
    try { return JSON.parse(localStorage.getItem(this.#key)) ?? []; }
    catch { return []; }
  }
  #save(items) { localStorage.setItem(this.#key, JSON.stringify(items)); notify(); }

  find(id) { return this.all().find((i) => i.id === id) ?? null; }
  where(predicate) { return this.all().filter(predicate); }

  create(data) {
    const item = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    this.#save([...this.all(), item]);
    return item;
  }
  update(id, patch) {
    let updated = null;
    this.#save(this.all().map((i) => (i.id === id ? (updated = { ...i, ...patch, id }) : i)));
    if (!updated) throw new Error('Registro no encontrado');
    return updated;
  }
  remove(id) { this.#save(this.all().filter((i) => i.id !== id)); }
  removeWhere(predicate) { this.#save(this.all().filter((i) => !predicate(i))); }
}

export const db = {
  users: new Repository('users'),
  teams: new Repository('teams'),
  tournaments: new Repository('tournaments'),
  registrations: new Repository('registrations'),
};

export const session = {
  get: () => localStorage.getItem('nexusarena:session'),
  set: (id) => { localStorage.setItem('nexusarena:session', id); notify(); },
  clear: () => { localStorage.removeItem('nexusarena:session'); notify(); },
};
