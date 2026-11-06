import { useState } from 'react';
import { Field, SelectField, FormModal } from '../components/forms.jsx';
import { GameBadge } from '../components/GameBadge.jsx';
import { TeamService, GAMES } from '../lib/services.js';
import { db } from '../lib/storage.js';
import { useCurrentUser, useDB } from '../lib/hooks.js';
import { run, toast } from '../lib/ui.js';

const GAME_OPTIONS = Object.fromEntries(Object.entries(GAMES).map(([k, g]) => [k, g.name]));

function TeamCard({ team, user, onModal }) {
  const isCaptain = team.captainId === user.id;
  const members = TeamService.members(team);
  return (
    <article className="card">
      <div><GameBadge game={team.game} /> <span className="badge">{team.tag}</span></div>
      <h3>{team.name}</h3>
      <p className="meta">{members.length}/{GAMES[team.game].teamSize} jugadores</p>
      <ul className="members">
        {members.map((m) => (
          <li key={m.id}>
            <span>{m.nick}{m.id === team.captainId && ' (capitán)'}{m.picks[team.game] && ` · ${m.picks[team.game].name}`}</span>
            {isCaptain && m.id !== user.id && (
              <button className="link" aria-label={`Quitar a ${m.nick}`}
                onClick={() => run(() => TeamService.removeMember(user, team.id, m.id), 'Jugador removido')}>Quitar</button>
            )}
          </li>
        ))}
      </ul>
      {isCaptain && (
        <div className="actions">
          <button className="btn ghost" onClick={() => onModal({ type: 'add', team })}>Añadir jugador</button>
          <button className="btn ghost" onClick={() => onModal({ type: 'edit', team })}>Editar</button>
          <button className="btn danger" onClick={() => {
            if (window.confirm(`¿Eliminar el equipo "${team.name}"?`)) run(() => TeamService.remove(user, team.id), 'Equipo eliminado');
          }}>Eliminar</button>
        </div>
      )}
    </article>
  );
}

export default function Teams() {
  useDB();
  const user = useCurrentUser();
  const [modal, setModal] = useState(null);
  const teams = db.teams.all();
  const close = () => setModal(null);

  return (
    <section className="panel">
      <header className="row">
        <h1>Equipos</h1>
        <button className="btn" onClick={() => setModal({ type: 'new' })}>Crear equipo</button>
      </header>
      {!teams.length && <p className="empty">Aún no hay equipos. Crea el primero.</p>}
      <div className="grid">{teams.map((t) => <TeamCard key={t.id} team={t} user={user} onModal={setModal} />)}</div>

      {modal?.type === 'new' && (
        <FormModal title="Nuevo equipo" submitLabel="Crear equipo" onClose={close}
          onSubmit={(d) => { TeamService.create(user, d); toast('Equipo creado'); }}>
          <Field name="name" label="Nombre del equipo" />
          <Field name="tag" label="Tag (2 a 5 caracteres)" />
          <SelectField name="game" label="Juego" options={GAME_OPTIONS} />
        </FormModal>
      )}
      {modal?.type === 'edit' && (
        <FormModal title="Editar equipo" onClose={close}
          onSubmit={(d) => { TeamService.update(user, modal.team.id, d); toast('Equipo actualizado'); }}>
          <Field name="name" label="Nombre del equipo" defaultValue={modal.team.name} />
          <Field name="tag" label="Tag (2 a 5 caracteres)" defaultValue={modal.team.tag} />
        </FormModal>
      )}
      {modal?.type === 'add' && (
        <FormModal title="Añadir jugador" submitLabel="Añadir" onClose={close}
          onSubmit={(d) => { TeamService.addMember(user, modal.team.id, d.email); toast('Jugador añadido'); }}>
          <Field name="email" label="Correo del jugador registrado" type="email" />
        </FormModal>
      )}
    </section>
  );
}
