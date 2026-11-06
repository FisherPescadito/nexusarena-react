import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { AuthService, ROLES } from '../lib/services.js';
import { useCurrentUser } from '../lib/hooks.js';
import { toast } from '../lib/ui.js';

export function Layout() {
  const user = useCurrentUser();
  return (
    <>
      <a className="skip" href="#app">Saltar al contenido</a>
      <header className="top">
        <Link className="brand" to="/">Nexus<span>Arena</span></Link>
        <nav id="nav" aria-label="Principal">
          <ul>
            <li><NavLink to="/" end>Inicio</NavLink></li>
            {user && <li><NavLink to="/torneos">Torneos</NavLink></li>}
            {user?.role === 'player' && <li><NavLink to="/equipos">Mis equipos</NavLink></li>}
            {user && <li><NavLink to="/perfil">Perfil</NavLink></li>}
          </ul>
          <div className="session">
            {user ? (
              <>
                <span>{user.nick} <em>{ROLES[user.role]}</em></span>
                <button className="btn ghost" onClick={() => { AuthService.logout(); toast('Sesión cerrada'); }}>Salir</button>
              </>
            ) : (
              <>
                <Link className="btn ghost" to="/login">Ingresar</Link>
                <Link className="btn" to="/registro">Crear cuenta</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main id="app" tabIndex={-1}><Outlet /></main>
      <footer>NexusArena · Proyecto final JavaScript Avanzado · Sprint 2</footer>
    </>
  );
}

/** Guarda de rutas: exige sesión y, opcionalmente, un rol. */
export function Protected({ roles, children }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
