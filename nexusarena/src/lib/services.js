// Lógica de negocio de NexusArena: reglas, permisos y validaciones del lado del servicio.
import { db, session } from './storage.js';
import {
  BusinessError, assertValid, required, minLen, maxLen, email, pattern, oneOf, futureDate, strongPassword,
} from './validators.js';

export const GAMES = {
  lol: { name: 'League of Legends', teamSize: 5 },
  valorant: { name: 'Valorant', teamSize: 5 },
};
export const STATUS = { draft: 'Borrador', open: 'Inscripciones abiertas', closed: 'Inscripciones cerradas', finished: 'Finalizado' };
export const ROLES = { player: 'Jugador', organizer: 'Organizador' };

const fail = (msg, errors) => { throw new BusinessError(msg, errors); };

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Autenticación y perfil ----------
export const AuthService = {
  current() { const id = session.get(); return id ? db.users.find(id) : null; },

  async register(data) {
    assertValid(data, {
      name: [required(), minLen(3), maxLen(50)],
      nick: [required(), pattern(/^[\w.-]{3,20}$/, '3 a 20 caracteres: letras, números, . _ -')],
      email: [required(), email],
      university: [required(), minLen(3), maxLen(60)],
      password: [required(), strongPassword],
      role: [oneOf(Object.keys(ROLES))],
    });
    const mail = data.email.trim().toLowerCase();
    if (db.users.where((u) => u.email === mail).length) fail('Correo ya registrado', { email: 'Este correo ya tiene una cuenta' });
    if (db.users.where((u) => u.nick.toLowerCase() === data.nick.trim().toLowerCase()).length)
      fail('Nick en uso', { nick: 'Ese nick ya está en uso' });
    const user = db.users.create({
      name: data.name.trim(), nick: data.nick.trim(), email: mail, university: data.university.trim(),
      role: data.role, passwordHash: await sha256(data.password), picks: {},
    });
    session.set(user.id);
    return user;
  },

  async login({ email: mail, password }) {
    assertValid({ email: mail, password }, { email: [required(), email], password: [required()] });
    const user = db.users.where((u) => u.email === mail.trim().toLowerCase())[0];
    if (!user || user.passwordHash !== (await sha256(password))) fail('Correo o contraseña incorrectos');
    session.set(user.id);
    return user;
  },

  logout() { session.clear(); },

  updateProfile(user, data) {
    assertValid(data, {
      name: [required(), minLen(3), maxLen(50)],
      university: [required(), minLen(3), maxLen(60)],
    });
    return db.users.update(user.id, { name: data.name.trim(), university: data.university.trim() });
  },

  setPick(user, game, pick) {
    return db.users.update(user.id, { picks: { ...user.picks, [game]: pick } });
  },
};

// ---------- Equipos ----------
const teamOf = (userId, game) => db.teams.all().find((t) => t.game === game && t.memberIds.includes(userId));

function ownTeam(user, id) {
  const team = db.teams.find(id);
  if (!team) fail('El equipo no existe');
  if (team.captainId !== user?.id) fail('Solo el capitán puede realizar esta acción');
  return team;
}

const teamSchema = { name: [required(), minLen(3), maxLen(30)], tag: [required(), pattern(/^[A-Za-z0-9]{2,5}$/, '2 a 5 letras o números')] };

export const TeamService = {
  members: (team) => team.memberIds.map((id) => db.users.find(id)).filter(Boolean),
  mine: (user) => db.teams.where((t) => t.memberIds.includes(user.id)),

  create(user, data) {
    if (user?.role !== 'player') fail('Solo los jugadores pueden crear equipos');
    assertValid(data, { ...teamSchema, game: [oneOf(Object.keys(GAMES))] });
    if (teamOf(user.id, data.game)) fail(`Ya perteneces a un equipo de ${GAMES[data.game].name}`, { game: 'Ya tienes equipo en este juego' });
    if (db.teams.where((t) => t.game === data.game && t.name.toLowerCase() === data.name.trim().toLowerCase()).length)
      fail('Nombre en uso', { name: 'Ya existe un equipo con ese nombre en este juego' });
    return db.teams.create({ name: data.name.trim(), tag: data.tag.trim().toUpperCase(), game: data.game, captainId: user.id, memberIds: [user.id] });
  },

  update(user, id, data) {
    const team = ownTeam(user, id);
    assertValid(data, teamSchema);
    if (db.teams.where((t) => t.id !== id && t.game === team.game && t.name.toLowerCase() === data.name.trim().toLowerCase()).length)
      fail('Nombre en uso', { name: 'Ya existe un equipo con ese nombre en este juego' });
    return db.teams.update(id, { name: data.name.trim(), tag: data.tag.trim().toUpperCase() });
  },

  remove(user, id) {
    ownTeam(user, id);
    db.registrations.removeWhere((r) => r.teamId === id);
    db.teams.remove(id);
  },

  addMember(user, teamId, mail) {
    const team = ownTeam(user, teamId);
    assertValid({ email: mail }, { email: [required(), email] });
    const player = db.users.where((u) => u.email === mail.trim().toLowerCase())[0];
    if (!player || player.role !== 'player') fail('Jugador no encontrado', { email: 'No hay un jugador registrado con ese correo' });
    if (team.memberIds.length >= GAMES[team.game].teamSize) fail('El equipo ya está completo');
    if (teamOf(player.id, team.game)) fail('Ese jugador ya tiene equipo en este juego', { email: 'Ya pertenece a otro equipo de este juego' });
    return db.teams.update(teamId, { memberIds: [...team.memberIds, player.id] });
  },

  removeMember(user, teamId, memberId) {
    const team = ownTeam(user, teamId);
    if (memberId === team.captainId) fail('El capitán no puede salir; elimina el equipo si deseas disolverlo');
    const active = db.registrations.where((r) => r.teamId === teamId && db.tournaments.find(r.tournamentId)?.status !== 'finished');
    if (active.length) fail('Retira primero la inscripción activa del equipo: quedaría incompleto');
    return db.teams.update(teamId, { memberIds: team.memberIds.filter((m) => m !== memberId) });
  },
};

// ---------- Torneos ----------
const tournamentSchema = {
  name: [required(), minLen(5), maxLen(60)],
  game: [oneOf(Object.keys(GAMES))],
  date: [required('Indica la fecha de inicio')],
  maxTeams: [oneOf(['4', '8', '16', '32'])],
  status: [oneOf(Object.keys(STATUS))],
  description: [maxLen(200)],
};

function ownTournament(user, id) {
  const t = db.tournaments.find(id);
  if (!t) fail('El torneo no existe');
  if (user?.role !== 'organizer' || t.organizerId !== user.id) fail('Solo el organizador del torneo puede modificarlo');
  return t;
}

export const TournamentService = {
  registrations: (id) => db.registrations.where((r) => r.tournamentId === id)
    .map((r) => ({ ...r, team: db.teams.find(r.teamId) })).filter((r) => r.team),

  create(user, data) {
    if (user?.role !== 'organizer') fail('Solo los organizadores pueden crear torneos');
    assertValid(data, { ...tournamentSchema, date: [required('Indica la fecha de inicio'), futureDate] });
    return db.tournaments.create({ ...clean(data), organizerId: user.id });
  },

  update(user, id, data) {
    const t = ownTournament(user, id);
    const schema = { ...tournamentSchema };
    if (data.date !== t.date) schema.date = [required('Indica la fecha de inicio'), futureDate];
    assertValid(data, schema);
    const regs = db.registrations.where((r) => r.tournamentId === id).length;
    if (data.game !== t.game && regs) fail('No puedes cambiar el juego con equipos inscritos', { game: 'Hay equipos inscritos' });
    if (Number(data.maxTeams) < regs) fail('Cupo inválido', { maxTeams: `Ya hay ${regs} equipos inscritos` });
    return db.tournaments.update(id, clean(data));
  },

  remove(user, id) {
    ownTournament(user, id);
    db.registrations.removeWhere((r) => r.tournamentId === id);
    db.tournaments.remove(id);
  },

  register(user, tournamentId, teamId) {
    const t = db.tournaments.find(tournamentId);
    if (!t) fail('El torneo no existe');
    const team = ownTeam(user, teamId);
    const regs = db.registrations.where((r) => r.tournamentId === t.id);
    if (t.status !== 'open') fail('Las inscripciones no están abiertas');
    if (team.game !== t.game) fail(`Este torneo es de ${GAMES[t.game].name}`);
    if (team.memberIds.length < GAMES[t.game].teamSize)
      fail(`Tu equipo necesita ${GAMES[t.game].teamSize} jugadores (tiene ${team.memberIds.length})`);
    if (regs.some((r) => r.teamId === team.id)) fail('Tu equipo ya está inscrito');
    if (regs.length >= t.maxTeams) fail('El torneo ya no tiene cupos');
    return db.registrations.create({ tournamentId: t.id, teamId: team.id, registeredBy: user.id });
  },

  cancelRegistration(user, regId) {
    const reg = db.registrations.find(regId);
    if (!reg) fail('La inscripción no existe');
    ownTeam(user, reg.teamId);
    if (db.tournaments.find(reg.tournamentId)?.status !== 'open') fail('Solo puedes retirarte mientras las inscripciones estén abiertas');
    db.registrations.remove(regId);
  },
};

const clean = (d) => ({
  name: d.name.trim(), game: d.game, date: d.date, maxTeams: Number(d.maxTeams),
  status: d.status, description: (d.description ?? '').trim(),
});

// ---------- Métricas (Lean UX Canvas) ----------
export const stats = () => ({
  users: db.users.all().length,
  teams: db.teams.all().length,
  tournaments: db.tournaments.all().length,
  registrations: db.registrations.all().length,
});

// ---------- Datos de demostración ----------
export async function seedDemo() {
  if (db.users.all().length) return;
  const org = db.users.create({
    name: 'Organizador Demo', nick: 'OrgDemo', email: 'organizador@demo.com', university: 'Universidad Demo',
    role: 'organizer', passwordHash: await sha256('Demo1234'), picks: {},
  });
  const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  db.tournaments.create({ name: 'Copa Interfacultades LoL', game: 'lol', date: day(21), maxTeams: 8, status: 'open', organizerId: org.id, description: 'Torneo 5v5 abierto a todas las facultades.' });
  db.tournaments.create({ name: 'Liga Campus Valorant', game: 'valorant', date: day(35), maxTeams: 16, status: 'draft', organizerId: org.id, description: 'Fase de grupos y eliminación directa.' });
}
