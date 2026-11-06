import { useState } from 'react';
import { Field, SelectField, FormModal } from '../components/forms.jsx';
import { GameBadge } from '../components/GameBadge.jsx';
import { TournamentService, GAMES, STATUS } from '../lib/services.js';
import { db } from '../lib/storage.js';
import { useCurrentUser, useDB } from '../lib/hooks.js';
import { fmtDate, run, toast } from '../lib/ui.js';

const GAME_OPTIONS = Object.fromEntries(Object.entries(GAMES).map(([k, g]) => [k, g.name]));
const CUPOS = { 4: '4', 8: '8', 16: '16', 32: '32' };

function TournamentFields({ t = {} }) {
  return (
    <>
      <Field name="name" label="Nombre del torneo" defaultValue={t.name} />
      <SelectField name="game" label="Juego" options={GAME_OPTIONS} defaultValue={t.game} />
      <Field name="date" label="Fecha de inicio" type="date" defaultValue={t.date} />
      <SelectField name="maxTeams" label="Cupo de equipos" options={CUPOS} defaultValue={t.maxTeams ?? 8} />
      <SelectField name="status" label="Estado" options={STATUS} defaultValue={t.status ?? 'draft'} />
      <Field name="description" label="Descripción (opcional)" defaultValue={t.description} />
    </>
  );
}

function TournamentCard({ t, user, onModal }) {
  const isOrg = user.role === 'organizer';
  const regs = TournamentService.registrations(t.id);
  const mine = regs.find((r) => r.team.captainId === user.id);
  return (
    <article className="card">
      <div><GameBadge game={t.game} /> <span className={`badge st-${t.status}`}>{STATUS[t.status]}</span></div>
      <h3>{t.name}</h3>
      <p>{t.description}</p>
      <p className="meta">{fmtDate(t.date)} · {regs.length}/{t.maxTeams} equipos</p>
      <progress max={t.maxTeams} value={regs.length} aria-label="Cupos ocupados" />
      <ul className="chips">{regs.map((r) => <li key={r.id}>{r.team.name}</li>)}</ul>
      <div className="actions">
        {isOrg && t.organizerId === user.id && (
          <>
            <button className="btn ghost" onClick={() => onModal({ type: 'edit', t })}>Editar</button>
            <button className="btn danger" onClick={() => {
              if (window.confirm(`¿Eliminar "${t.name}" y sus inscripciones?`)) run(() => TournamentService.remove(user, t.id), 'Torneo eliminado');
            }}>Eliminar</button>
          </>
        )}
        {!isOrg && !mine && t.status === 'open' && <button className="btn" onClick={() => onModal({ type: 'join', t })}>Inscribir equipo</button>}
        {mine && (
          <button className="btn ghost" onClick={() => run(() => TournamentService.cancelRegistration(user, mine.id), 'Inscripción retirada')}>
            Retirar a {mine.team.name}
          </button>
        )}
      </div>
    </article>
  );
}

export default function Tournaments() {
  useDB();
  const user = useCurrentUser();
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(null);
  const isOrg = user.role === 'organizer';

  const list = db.tournaments.all()
    .filter((t) => (!filter || t.game === filter) && (isOrg || t.status !== 'draft'))
    .sort((a, b) => a.date.localeCompare(b.date));
  const close = () => setModal(null);

  const joinable = modal?.type === 'join' ? db.teams.where((m) => m.captainId === user.id && m.game === modal.t.game) : [];

  const openJoin = (m) => {
    const eligible = db.teams.where((x) => x.captainId === user.id && x.game === m.t.game);
    if (!eligible.length) return toast(`Necesitas ser capitán de un equipo de ${GAMES[m.t.game].name}`, 'err');
    setModal(m);
  };

  return (
    <section className="panel">
      <header className="row">
        <h1>Torneos</h1>
        <div className="row">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar por juego">
            <option value="">Todos los juegos</option>
            {Object.entries(GAME_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {isOrg && <button className="btn" onClick={() => setModal({ type: 'new' })}>Nuevo torneo</button>}
        </div>
      </header>

      {!list.length && <p className="empty">No hay torneos para mostrar todavía.</p>}
      <div className="grid">
        {list.map((t) => <TournamentCard key={t.id} t={t} user={user} onModal={(m) => (m.type === 'join' ? openJoin(m) : setModal(m))} />)}
      </div>

      {modal?.type === 'new' && (
        <FormModal title="Nuevo torneo" submitLabel="Crear torneo" onClose={close}
          onSubmit={(d) => { TournamentService.create(user, d); toast('Torneo creado'); }}>
          <TournamentFields />
        </FormModal>
      )}
      {modal?.type === 'edit' && (
        <FormModal title="Editar torneo" onClose={close}
          onSubmit={(d) => { TournamentService.update(user, modal.t.id, d); toast('Torneo actualizado'); }}>
          <TournamentFields t={modal.t} />
        </FormModal>
      )}
      {modal?.type === 'join' && (
        <FormModal title={`Inscribirse en ${modal.t.name}`} submitLabel="Inscribir" onClose={close}
          onSubmit={(d) => { TournamentService.register(user, modal.t.id, d.teamId); toast('Equipo inscrito'); }}>
          <SelectField name="teamId" label="Equipo"
            options={Object.fromEntries(joinable.map((m) => [m.id, `${m.name} (${m.memberIds.length}/${GAMES[m.game].teamSize})`]))} />
        </FormModal>
      )}
    </section>
  );
}
