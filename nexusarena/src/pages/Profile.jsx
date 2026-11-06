import { useState } from 'react';
import { Field, FormModal } from '../components/forms.jsx';
import { AuthService, GAMES, ROLES } from '../lib/services.js';
import { useCurrentUser, usePicks } from '../lib/hooks.js';
import { toast } from '../lib/ui.js';
import { GameBadge } from '../components/GameBadge.jsx';

function PickSelector({ game, user }) {
  const { picks, loading, error } = usePicks(game);
  const current = user.picks[game];
  const onChange = (e) => {
    const p = picks.find((x) => x.id === e.target.value);
    if (!p) return;
    AuthService.setPick(user, game, { id: p.id, name: p.name, icon: p.icon });
    toast(`${p.name} guardado`);
  };
  return (
    <div className="pick">
      <GameBadge game={game} />
      <div className="pick-current">
        {current ? <><img src={current.icon} alt="" width="48" height="48" /> <strong>{current.name}</strong></> : <em>Sin elegir</em>}
      </div>
      <select disabled={loading || error} value={current?.id ?? ''} onChange={onChange} aria-label={`Pick de ${GAMES[game].name}`}>
        {loading && <option>Cargando…</option>}
        {error && <option>No disponible</option>}
        {!loading && !error && <option value="">Elige…</option>}
        {picks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {error && <small className="error">No se pudo cargar la lista. Revisa tu conexión e inténtalo de nuevo.</small>}
    </div>
  );
}

export default function Profile() {
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  return (
    <>
      <section className="panel">
        <header className="row">
          <div>
            <h1>{user.name}</h1>
            <p>{user.nick} · {user.university} · {ROLES[user.role]}<br />{user.email}</p>
          </div>
          <button className="btn ghost" onClick={() => setEditing(true)}>Editar perfil</button>
        </header>
      </section>

      {user.role === 'player' && (
        <section className="panel">
          <h2>Mi pick principal</h2>
          <p className="hint">Datos en vivo desde las APIs públicas de Riot (Data Dragon) y Valorant API.</p>
          <div className="picks">{Object.keys(GAMES).map((g) => <PickSelector key={g} game={g} user={user} />)}</div>
        </section>
      )}

      {editing && (
        <FormModal title="Editar perfil" onClose={() => setEditing(false)}
          onSubmit={(d) => { AuthService.updateProfile(user, d); toast('Perfil actualizado'); }}>
          <Field name="name" label="Nombre completo" defaultValue={user.name} />
          <Field name="university" label="Universidad o comunidad" defaultValue={user.university} />
        </FormModal>
      )}
    </>
  );
}
