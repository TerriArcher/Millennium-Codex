import { YugiohCard, CardFilterState } from '../types/card';
import { FALLBACK_CARDS } from '../data/fallbackCards';

const YGOPRODECK_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

// Client-side cache for filtered queries (30-minute TTL)
const queryCache = new Map<string, { data: YugiohCard[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30;

// Map super types to official YGOPRODeck API type values
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
    default:
      return superType;
  }
}

// Extract cards whether API returns { data: [...] }, array, or single card object
function extractCardsFromResult(json: any): YugiohCard[] {
  if (!json) return [];
  if (Array.isArray(json.data) && json.data.length > 0) return json.data;
  if (Array.isArray(json) && json.length > 0) return json;
  if (json.id && json.name) return [json];
  return [];
}

// Normalize card fields to guarantee type safety and direct links
export function normalizeCard(rawCard: any): YugiohCard {
  if (!rawCard) return rawCard;
  let card = { ...rawCard };

  if (card.data && Array.isArray(card.data) && card.data.length > 0) {
    card = { ...card.data[0] };
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
      const slug = card.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      card.ygoprodeck_url = `https://ygoprodeck.com/card/${slug}-${card.id || ''}`;
    } else {
      card.ygoprodeck_url = `https://ygoprodeck.com/card/${card.id || ''}`;
    }
  }

  if (!card.card_prices || !Array.isArray(card.card_prices) || card.card_prices.length === 0) {
    card.card_prices = [
      {
        tcgplayer_price: '0.75',
        cardmarket_price: '0.60'
      }
    ];
  }

  // Strip null/invalid pendulum scale so non-pendulum cards never display scale UI
  if (
    card.scale === null ||
    card.scale === undefined ||
    card.scale === '' ||
    typeof card.scale !== 'number' ||
    isNaN(card.scale)
  ) {
    delete card.scale;
  }

  return card as YugiohCard;
}

// Filter local fallback cards when offline
export function filterFallbackCards(filters: CardFilterState, excludeId?: number): YugiohCard[] {
  const filtered = FALLBACK_CARDS.filter((card) => {
    if (filters.attribute && card.attribute?.toUpperCase() !== String(filters.attribute).toUpperCase()) {
      return false;
    }
    if (filters.level !== undefined && filters.level !== '') {
      const lvl = parseInt(String(filters.level), 10);
      if (card.level !== lvl && card.linkval !== lvl) {
        return false;
      }
    }
    if (filters.scale !== undefined && filters.scale !== '') {
      const scaleVal = parseInt(String(filters.scale), 10);
      if (card.scale !== scaleVal) {
        return false;
      }
    }
    if (filters.race && card.race) {
      const qR = String(filters.race).toLowerCase();
      const cR = card.race.toLowerCase();
      if (qR === 'quick' || qR === 'quick-play') {
        if (cR !== 'quick' && cR !== 'quick-play') return false;
      } else if (cR !== qR) {
        return false;
      }
    }
    if (filters.atk !== undefined && filters.atk !== '') {
      const atkVal = parseInt(String(filters.atk), 10);
      if (card.atk !== atkVal) return false;
    }
    if (filters.def !== undefined && filters.def !== '') {
      const defVal = parseInt(String(filters.def), 10);
      if (card.def !== defVal) return false;
    }
    if (filters.archetype) {
      if (!card.archetype || card.archetype.toLowerCase() !== filters.archetype.toLowerCase()) {
        return false;
      }
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      const matchName = card.name.toLowerCase().includes(kw);
      const matchDesc = card.desc.toLowerCase().includes(kw);
      if (!matchName && !matchDesc) return false;
    }

    const cardTypeLower = (card.type || '').toLowerCase();
    if (filters.superType) {
      const s = String(filters.superType).toLowerCase();
      if (s === 'xyz' && !cardTypeLower.includes('xyz')) return false;
      if (s === 'synchro' && !cardTypeLower.includes('synchro')) return false;
      if (s === 'link' && !cardTypeLower.includes('link')) return false;
      if (s === 'ritual' && !cardTypeLower.includes('ritual')) return false;
      if (s === 'spirit' && !cardTypeLower.includes('spirit')) return false;
      if (s === 'toon' && !cardTypeLower.includes('toon')) return false;
      if (s === 'gemini' && !cardTypeLower.includes('gemini')) return false;
      if (s === 'union' && !cardTypeLower.includes('union')) return false;
      if (s === 'pendulum' && !cardTypeLower.includes('pendulum') && card.scale === undefined) return false;
      if (s === 'fusion' && !cardTypeLower.includes('fusion')) return false;
    }
    if (filters.type) {
      const qType = String(filters.type).toLowerCase();
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

export interface RandomCardResponse {
  card: YugiohCard;
  totalMatches: number;
  source: 'ygoprodeck' | 'ygoprodeck-cache' | 'fallback';
}

/**
 * Fetches a random card directly from the official YGOPRODeck v7 API
 * (https://db.ygoprodeck.com/api/v7/cardinfo.php) so it works seamlessly
 * on static deployments like Vercel without needing relative backend routes.
 */
export async function fetchRandomCardFromApi(
  filters: CardFilterState = {},
  excludeId?: number
): Promise<RandomCardResponse> {
  const hasFilters = Boolean(
    filters.attribute ||
      (filters.level !== undefined && filters.level !== '') ||
      filters.race ||
      (filters.atk !== undefined && filters.atk !== '') ||
      (filters.def !== undefined && filters.def !== '') ||
      (filters.scale !== undefined && filters.scale !== '') ||
      filters.superType ||
      filters.type ||
      filters.archetype ||
      filters.keyword
  );

  // 1. Unconstrained Random Card Draw directly from YGOPRODeck API
  if (!hasFilters) {
    try {
      const timestamp = Date.now();
      const response = await fetch(
        `${YGOPRODECK_API_URL}?num=6&offset=0&sort=random&cachebust=${timestamp}`,
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const cards = extractCardsFromResult(json);
        if (cards.length > 0) {
          let candidate = cards.find((c) => !excludeId || c.id !== excludeId);
          if (!candidate) candidate = cards[0];
          return {
            card: normalizeCard(candidate),
            totalMatches: 13000,
            source: 'ygoprodeck'
          };
        }
      }
    } catch (err) {
      console.warn('Direct YGOPRODeck random draw failed, falling back to local pool:', err);
    }

    let fallbackPool = FALLBACK_CARDS;
    if (excludeId && fallbackPool.length > 1) {
      const nonExcluded = fallbackPool.filter((c) => c.id !== excludeId);
      if (nonExcluded.length > 0) fallbackPool = nonExcluded;
    }
    const randomCard = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    return {
      card: normalizeCard(randomCard),
      totalMatches: fallbackPool.length,
      source: 'fallback'
    };
  }

  // 2. Filtered Random Card Draw directly from YGOPRODeck API
  const params = new URLSearchParams();
  if (filters.attribute) params.append('attribute', String(filters.attribute).toUpperCase());
  if (filters.level !== undefined && filters.level !== '') {
    params.append('level', String(filters.level));
  }
  if (filters.scale !== undefined && filters.scale !== '') {
    params.append('scale', String(filters.scale));
  }
  if (filters.race) {
    const r = String(filters.race).trim();
    if (r.toLowerCase() === 'quick' || r.toLowerCase() === 'quick-play') {
      params.append('race', 'Quick-Play');
    } else {
      params.append('race', r);
    }
  }
  if (filters.atk !== undefined && filters.atk !== '') {
    params.append('atk', String(filters.atk));
  }
  if (filters.def !== undefined && filters.def !== '') {
    params.append('def', String(filters.def));
  }
  if (filters.archetype) params.append('archetype', String(filters.archetype));
  if (filters.keyword) params.append('fname', String(filters.keyword));

  if (filters.superType) {
    const mappedType = getSuperTypeQuery(String(filters.superType));
    params.append('type', mappedType);
  } else if (filters.type) {
    const t = String(filters.type);
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

  // Check client-side cache first
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data.length > 0) {
    let pool = cached.data;
    if (excludeId && pool.length > 1) {
      const nonExcluded = pool.filter((c) => c.id !== excludeId);
      if (nonExcluded.length > 0) pool = nonExcluded;
    }
    const randomCard = pool[Math.floor(Math.random() * pool.length)];
    return {
      card: normalizeCard(randomCard),
      totalMatches: cached.data.length,
      source: 'ygoprodeck-cache'
    };
  }

  const requestUrl = `${YGOPRODECK_API_URL}?${params.toString()}`;
  const response = await fetch(requestUrl, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (response.ok) {
    const result = await response.json();
    const cards = extractCardsFromResult(result);

    if (cards.length > 0) {
      queryCache.set(cacheKey, { data: cards, timestamp: Date.now() });

      let pool = cards;
      if (excludeId && pool.length > 1) {
        const nonExcluded = pool.filter((c) => c.id !== excludeId);
        if (nonExcluded.length > 0) pool = nonExcluded;
      }

      const randomCard = pool[Math.floor(Math.random() * pool.length)];
      return {
        card: normalizeCard(randomCard),
        totalMatches: cards.length,
        source: 'ygoprodeck'
      };
    }
  }

  // If YGOPRODeck returns 400 (no matching cards found), check fallback pool before throwing 404
  const matchingFallback = filterFallbackCards(filters, excludeId);
  if (matchingFallback.length > 0) {
    const randomFallback = matchingFallback[Math.floor(Math.random() * matchingFallback.length)];
    return {
      card: normalizeCard(randomFallback),
      totalMatches: matchingFallback.length,
      source: 'fallback'
    };
  }

  const notFoundError: any = new Error('No cards found matching the specified criteria.');
  notFoundError.status = 404;
  throw notFoundError;
}
