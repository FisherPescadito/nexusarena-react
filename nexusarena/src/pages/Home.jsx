import { Link } from 'react-router-dom';
import { stats } from '../lib/services.js';
import { useCurrentUser } from '../lib/hooks.js';

const LABELS = { users: 'Usuarios', teams: 'Equipos', tournaments: 'Torneos', registrations: 'Inscripciones' };

export default function Home() {
  const user = useCurrentUser();
  const s = stats();
  return (
    <>
      <section className="hero">
        <h1>Tu torneo universitario, sin hojas de cálculo.</h1>
        <p>Inscribe equipos, controla cupos y publica resultados de League of Legends y Valorant desde un solo lugar.</p>
        <div className="actions">
          {user ? <Link className="btn" to="/torneos">Ver torneos</Link> : (
            <>
              <Link className="btn" to="/registro">Crear cuenta</Link>
              <Link className="btn ghost" to="/login">Ya tengo cuenta</Link>
            </>
          )}
        </div>
      </section>
      <section className="metrics" aria-label="Indicadores de la plataforma">
        {Object.entries(LABELS).map(([k, label]) => <div key={k}><strong>{s[k]}</strong><span>{label}</span></div>)}
      </section>
    </>
  );
}
