// Consumo de APIs públicas con fetch(): campeones (LoL) y agentes (Valorant).
const cache = new Map();

async function getJSON(url, timeout = 8000) {
  if (cache.has(url)) return cache.get(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache.set(url, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

const loaders = {
  async valorant() {
    const { data } = await getJSON('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    return data.map((a) => ({ id: a.uuid, name: a.displayName, icon: a.displayIcon }));
  },
  async lol() {
    const [version] = await getJSON('https://ddragon.leagueoflegends.com/api/versions.json');
    const { data } = await getJSON(`https://ddragon.leagueoflegends.com/cdn/${version}/data/es_MX/champion.json`);
    return Object.values(data).map((c) => ({
      id: c.id, name: c.name,
      icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`,
    }));
  },
};

/** Devuelve la lista de campeones/agentes del juego, ordenada por nombre. */
export async function getPicks(game) {
  const list = await loaders[game]();
  return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
