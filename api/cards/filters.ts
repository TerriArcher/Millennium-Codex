function sendJson(res: any, status: number, payload: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(payload);
  }
  res.statusCode = status;
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.end?.(JSON.stringify(payload));
}

export default function handler(_req: any, res: any) {
  return sendJson(res, 200, {
    attributes: ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'],
    cardTypes: [
      { id: 'all', label: 'All Cards' },
      { id: 'monster', label: 'Monster' },
      { id: 'spell', label: 'Spell' },
      { id: 'trap', label: 'Trap' }
    ],
    superTypes: [
      'Link',
      'XYZ',
      'Synchro',
      'Ritual',
      'Fusion',
      'Pendulum',
      'Spirit',
      'Toon',
      'Gemini',
      'Union'
    ],
    monsterSubtypes: [
      'Normal Monster',
      'Effect Monster',
      'Fusion Monster',
      'Ritual Monster',
      'Synchro Monster',
      'XYZ Monster',
      'Link Monster',
      'Pendulum Effect Monster',
      'Spirit Monster'
    ],
    races: [
      'Dragon',
      'Spellcaster',
      'Warrior',
      'Fiend',
      'Zombie',
      'Machine',
      'Cyberse',
      'Fairy',
      'Insect',
      'Dinosaur',
      'Reptile',
      'Fish',
      'Sea Serpent',
      'Aqua',
      'Pyro',
      'Rock',
      'Winged Beast',
      'Beast',
      'Beast-Warrior',
      'Psychic',
      'Wyrm',
      'Divine-Beast'
    ],
    spellTrapRaces: ['Normal', 'Continuous', 'Quick-Play', 'Equip', 'Field', 'Counter', 'Ritual'],
    levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scales: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
  });
}
