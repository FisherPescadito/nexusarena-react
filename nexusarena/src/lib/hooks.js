import { useEffect, useState, useSyncExternalStore } from 'react';
import { subscribe, getVersion } from './storage.js';
import { AuthService } from './services.js';
import { getPicks } from './api.js';

/** Re-renderiza el componente cuando cambia cualquier dato persistido. */
export const useDB = () => useSyncExternalStore(subscribe, getVersion);

export function useCurrentUser() {
  useDB();
  return AuthService.current();
}

/** Carga campeones/agentes desde la API con estados de carga y error. */
export function usePicks(game) {
  const [state, setState] = useState({ picks: [], loading: true, error: false });
  useEffect(() => {
    let cancelled = false;
    getPicks(game)
      .then((picks) => !cancelled && setState({ picks, loading: false, error: false }))
      .catch(() => !cancelled && setState({ picks: [], loading: false, error: true }));
    return () => { cancelled = true; };
  }, [game]);
  return state;
}
