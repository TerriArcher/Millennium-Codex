import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { FALLBACK_CARDS, INITIAL_ACE_CARDS, META_RESOURCES } from './src/data/fallbackCards.ts';
import { YugiohCard } from './src/types/card.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // In-memory cache for YGOPRODeck queries
  const queryCache = new Map<string, { data: YugiohCard[]; timestamp: number }>();
  const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

  // Helper to map super types to YGOPRODeck API type format
  function getSuperTypeQuery(superType: string): string {
    const s = superType.trim().toLowerCase();
    switch (s) {
      case 'link':
        return 'Link Monster';
      case 'xyz':
        return 'XYZ Monster,XYZ Pendulum Effect Monster';
      case 'synchro':
        return 'Synchro Monster,Synchro Tuner Monster,Synchro Pendulum Effect Monster';
      case 'ritual':
        return 'Ritual Monster,Ritual Effect Monster';
      case 'spirit':
        return 'Spirit Monster';
      case 'toon':
        return 'Toon Monster';
      case 'gemini':
        return 'Gemini Monster';
      case 'union':
        return 'Union Effect Monster';
      case 'pendulum':
        return 'Pendulum Effect Monster,Pendulum Normal Monster,Pendulum Tuner Effect Monster';
      case 'fusion':
        return 'Fusion Monster,Pendulum Effect Fusion Monster';
      case 'tuner':
        return 'Normal Tuner Monster,Synchro Tuner Monster,Pendulum Tuner Effect Monster,Flip Tuner Effect Monster';
      default:
        return superType;
    }
  }

  // Helper to exclude Token and Skill cards
  function isPlayableCard(card: any): boolean {
    if (!card) return false;
    const typeLower = String(card.type || '').toLowerCase();
    const frameLower = String(card.frameType || '').toLowerCase();
    const humanTypeLower = String(card.humanReadableCardType || '').toLowerCase();
    if (
      typeLower.includes('token') ||
      typeLower.includes('skill') ||
      frameLower === 'token' ||
      frameLower === 'skill' ||
      humanTypeLower.includes('token') ||
      humanTypeLower.includes('skill')
    ) {
      return false;
    }
    return true;
  }

  // Helper to extract cards whether API returns array, { data: [...] }, or single card object
  function extractCardsFromResult(json: any): YugiohCard[] {
    if (!json) return [];
    let rawList: YugiohCard[] = [];
    if (Array.isArray(json.data) && json.data.length > 0) rawList = json.data;
    else if (Array.isArray(json) && json.length > 0) rawList = json;
    else if (json.id && json.name) rawList = [json];
    return rawList.filter(isPlayableCard);
  }

  // Ensure card has valid non-null fields
  function normalizeCard(card: any): YugiohCard {
    if (!card) return card;
    // Unwrap if wrapped inside { data: [...] }
    if (card.data && Array.isArray(card.data) && card.data.length > 0) {
      card = card.data[0];
    }
    if (!card.type) {
      if (card.humanReadableCardType) {
        card.type = card.humanReadableCardType;
      } else if (card.atk !== undefined || card.def !== undefined) {
        card.type = 'Effect Monster';
      } else {
        card.type = 'Normal Monster';
      }
    }
    if (!card.race) {
      card.race = 'Card';
    }
    if (!card.card_images || !Array.isArray(card.card_images) || card.card_images.length === 0) {
      const cardId = card.id || 89631139;
      card.card_images = [
        {
          id: cardId,
          image_url: `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`,
          image_url_small: `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`,
          image_url_cropped: `https://images.ygoprodeck.com/images/cards_cropped/${cardId}.jpg`
        }
      ];
    }
    if (!card.ygoprodeck_url) {
      if (card.name) {
        const slug = card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        card.ygoprodeck_url = `https://ygoprodeck.com/card/${slug}-${card.id || ''}`;
      } else {
        card.ygoprodeck_url = `https://ygoprodeck.com/card/${card.id || ''}`;
      }
    }
    if (!card.card_prices || !Array.isArray(card.card_prices) || card.card_prices.length === 0) {
      card.card_prices = [{
        tcgplayer_price: "0.75",
        cardmarket_price: "0.60"
      }];
    }
    if (card.scale === null || card.scale === undefined || card.scale === '' || typeof card.scale !== 'number' || isNaN(card.scale)) {
      delete card.scale;
    }
    return card;
  }

  // Helper to filter fallback cards
  function filterFallbackCards(query: Record<string, any>, excludeId?: number): YugiohCard[] {
    const filtered = FALLBACK_CARDS.filter((card) => {
      if (query.attribute && card.attribute?.toUpperCase() !== String(query.attribute).toUpperCase()) {
        return false;
      }
      if (query.level !== undefined && query.level !== '') {
        const lvl = parseInt(String(query.level), 10);
        if (card.level !== lvl && card.linkval !== lvl) {
          return false;
        }
      }
      if (query.scale !== undefined && query.scale !== '') {
        const scaleVal = parseInt(String(query.scale), 10);
        if (card.scale !== scaleVal) {
          return false;
        }
      }
      if (query.race && card.race) {
        const qR = String(query.race).toLowerCase();
        const cR = card.race.toLowerCase();
        if (qR === 'quick' || qR === 'quick-play') {
          if (cR !== 'quick' && cR !== 'quick-play') return false;
        } else if (cR !== qR) {
          return false;
        }
      }
      if (query.atk !== undefined && query.atk !== '') {
        const atkVal = parseInt(String(query.atk), 10);
        if (card.atk !== atkVal) return false;
      }
      if (query.def !== undefined && query.def !== '') {
        const defVal = parseInt(String(query.def), 10);
        if (card.def !== defVal) return false;
      }
      const cardTypeLower = (card.type || '').toLowerCase();
      if (query.superType) {
        const s = String(query.superType).toLowerCase();
        if (s === 'xyz') {
          if (!cardTypeLower.includes('xyz')) return false;
        } else if (s === 'synchro') {
          if (!cardTypeLower.includes('synchro')) return false;
        } else if (s === 'link') {
          if (!cardTypeLower.includes('link')) return false;
        } else if (s === 'ritual') {
          if (!cardTypeLower.includes('ritual')) return false;
        } else if (s === 'spirit') {
          if (!cardTypeLower.includes('spirit')) return false;
        } else if (s === 'toon') {
          if (!cardTypeLower.includes('toon')) return false;
        } else if (s === 'gemini') {
          if (!cardTypeLower.includes('gemini')) return false;
        } else if (s === 'union') {
          if (!cardTypeLower.includes('union')) return false;
        } else if (s === 'pendulum') {
          if (!cardTypeLower.includes('pendulum') && card.scale === undefined) return false;
        } else if (s === 'fusion') {
          if (!cardTypeLower.includes('fusion')) return false;
        }
      }
      if (query.type) {
        const qType = String(query.type).toLowerCase();
        if (qType === 'monster') {
          if (!card.atk && card.atk !== 0 && !cardTypeLower.includes('monster')) return false;
        } else if (qType.includes('spell')) {
          if (!cardTypeLower.includes('spell')) return false;
        } else if (qType.includes('trap')) {
          if (!cardTypeLower.includes('trap')) return false;
        } else if (!cardTypeLower.includes(qType)) {
          return false;
        }
      }
      return true;
    });

    if (excludeId && filtered.length > 1) {
      const nonExcluded = filtered.filter((c) => c.id !== excludeId);
      if (nonExcluded.length > 0) return nonExcluded;
    }

    return filtered;
  }

  // --- API Endpoints ---

  // 1. Random Card Endpoint with query filters & non-duplication
  app.get('/api/cards/random', async (req: Request, res: Response) => {
    try {
      const {
        attribute,
        level,
        race,
        atk,
        def,
        scale,
        superType,
        type,
        archetype,
        fname,
        excludeId: rawExcludeId
      } = req.query;

      const excludeId = rawExcludeId ? parseInt(String(rawExcludeId), 10) : undefined;

      const hasFilters = Boolean(
        attribute ||
        level ||
        race ||
        atk !== undefined ||
        def !== undefined ||
        scale !== undefined ||
        superType ||
        type ||
        archetype ||
        fname
      );

      // If completely unconstrained, fetch random cards batch with non-duplication
      if (!hasFilters) {
        try {
          const timestamp = Date.now();
          const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?num=6&offset=0&sort=random&cachebust=${timestamp}`, {
            headers: {
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const json = await response.json();
            const cards = extractCardsFromResult(json);
            if (cards.length > 0) {
              let candidate = cards.find((c) => !excludeId || c.id !== excludeId);
              if (!candidate) candidate = cards[0];
              return res.json({
                card: normalizeCard(candidate),
                totalMatches: 13000,
                source: 'ygoprodeck',
                activeFilter: {}
              });
            }
          }
        } catch (err) {
          console.warn('Random cardinfo call failed, using fallback pool:', err);
        }

        // Fallback to random card from seed (excluding the most recent card)
        let fallbackPool = FALLBACK_CARDS;
        if (excludeId && fallbackPool.length > 1) {
          const nonExcluded = fallbackPool.filter((c) => c.id !== excludeId);
          if (nonExcluded.length > 0) fallbackPool = nonExcluded;
        }
        const randomCard = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        return res.json({
          card: normalizeCard(randomCard),
          totalMatches: fallbackPool.length,
          source: 'fallback',
          activeFilter: {}
        });
      }

      // Build query string for cardinfo.php
      const params = new URLSearchParams();
      if (attribute) params.append('attribute', String(attribute).toUpperCase());
      if (level) params.append('level', String(level));
      if (scale !== undefined && scale !== '') params.append('scale', String(scale));
      if (race) {
        const r = String(race).trim();
        if (r.toLowerCase() === 'quick' || r.toLowerCase() === 'quick-play') {
          params.append('race', 'Quick-Play');
        } else {
          params.append('race', r);
        }
      }
      if (atk !== undefined && atk !== '') params.append('atk', String(atk));
      if (def !== undefined && def !== '') params.append('def', String(def));
      if (archetype) params.append('archetype', String(archetype));
      if (fname) params.append('fname', String(fname));

      // Handle superType (Link, XYZ, Synchro, Ritual, Spirit, Pendulum, Fusion)
      if (superType) {
        const mappedType = getSuperTypeQuery(String(superType));
        params.append('type', mappedType);
      } else if (type) {
        const t = String(type);
        if (t.toLowerCase() === 'monster') {
          params.append('has_effect', 'true,false');
        } else if (t.toLowerCase() === 'spell') {
          params.append('type', 'Spell Card');
        } else if (t.toLowerCase() === 'trap') {
          params.append('type', 'Trap Card');
        } else {
          params.append('type', t);
        }
      }

      const cacheKey = params.toString();

      // Check cache first
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data.length > 0) {
        let pool = cached.data;
        if (excludeId && pool.length > 1) {
          const nonExcluded = pool.filter((c) => c.id !== excludeId);
          if (nonExcluded.length > 0) pool = nonExcluded;
        }
        const randomCard = pool[Math.floor(Math.random() * pool.length)];
        return res.json({
          card: normalizeCard(randomCard),
          totalMatches: cached.data.length,
          source: 'ygoprodeck-cache',
          activeFilter: Object.fromEntries(params.entries())
        });
      }

      const ygoprodeckUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?${params.toString()}`;
      
      const response = await fetch(ygoprodeckUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const cards: YugiohCard[] = extractCardsFromResult(result);

        if (cards.length > 0) {
          queryCache.set(cacheKey, { data: cards, timestamp: Date.now() });

          let pool = cards;
          if (excludeId && pool.length > 1) {
            const nonExcluded = pool.filter((c) => c.id !== excludeId);
            if (nonExcluded.length > 0) pool = nonExcluded;
          }

          const randomCard = pool[Math.floor(Math.random() * pool.length)];
          return res.json({
            card: normalizeCard(randomCard),
            totalMatches: cards.length,
            source: 'ygoprodeck',
            activeFilter: Object.fromEntries(params.entries())
          });
        }
      }

      // If YGOPRODeck returned 400 (no matching cards found) or another error, check fallback
      const matchingFallback = filterFallbackCards(req.query, excludeId);
      if (matchingFallback.length > 0) {
        const randomFallback = matchingFallback[Math.floor(Math.random() * matchingFallback.length)];
        return res.json({
          card: normalizeCard(randomFallback),
          totalMatches: matchingFallback.length,
          source: 'fallback',
          activeFilter: req.query
        });
      }

      // No match at all
      return res.status(404).json({
        message: 'No cards found matching the specified criteria.',
        activeFilter: req.query
      });

    } catch (error: any) {
      console.error('Error in /api/cards/random:', error);
      const randomFallback = FALLBACK_CARDS[Math.floor(Math.random() * FALLBACK_CARDS.length)];
      return res.json({
        card: normalizeCard(randomFallback),
        totalMatches: FALLBACK_CARDS.length,
        source: 'fallback-error',
        error: error.message
      });
    }
  });

  // 2. Filter metadata endpoint with superTypes
  app.get('/api/cards/filters', (_req: Request, res: Response) => {
    res.json({
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
      spellTrapRaces: [
        'Normal',
        'Continuous',
        'Quick-Play',
        'Equip',
        'Field',
        'Counter',
        'Ritual'
      ],
      levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      scales: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    });
  });

  // 3. Meta & Community Resources endpoint
  app.get('/api/resources', (req: Request, res: Response) => {
    const { category, q } = req.query;
    let list = [...META_RESOURCES];

    if (category && category !== 'all') {
      list = list.filter((r) => r.category === category);
    }

    if (q) {
      const search = String(q).toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.highlights.some(h => h.toLowerCase().includes(search)) ||
        r.recommendedFor.toLowerCase().includes(search)
      );
    }

    res.json({
      resources: list,
      totalCount: list.length
    });
  });

  const httpServer = http.createServer(app);

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
