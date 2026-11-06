import { GAMES } from '../lib/services.js';
export const GameBadge = ({ game }) => <span className={`badge ${game}`}>{GAMES[game].name}</span>;
