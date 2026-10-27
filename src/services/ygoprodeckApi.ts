import { YugiohCard, CardFilterState } from '../types/card';
import { FALLBACK_CARDS } from '../data/fallbackCards';

const YGOPRODECK_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

// Bounded LRU client-side cache for filtered queries (max 3 filter pools, 30-minute TTL)
const MAX_FILTER_CACHE_ENTRIES = 3;
const CACHE_TTL_MS = 1000 * 60 * 30;
const queryCache = new Map<string, { data: YugiohCard[]; timestamp: number }>();

// Track in-flight filtered requests by cacheKey to prevent duplicate concurrent API calls
const inFlightRequests = new Map<string, Promise<YugiohCard[]>>();

// Track drawn card IDs per active filter query key (bounded alongside queryCache)
const seenCardIdsByFilter = new Map<string, Set<number>>();

// Pre-selected next candidate per filter key so its artwork is preloaded before the user clicks Draw
const nextCandidateByFilter = new Map<string, YugiohCard>();

// Unconstrained random draw prefetch buffer (30 cards per API batch, refilled at <= 5)
const RANDOM_BATCH_SIZE = 30;
const RANDOM_REFILL_THRESHOLD = 5;
const unconstrainedDrawQueue: YugiohCard[] = [];
let inFlightRandomRefill: Promise<void> | null = null;

// Bounded image preloader ring buffer so preloaded card images stay warm without leaking memory
const MAX_PRELOADED_IMAGES = 18;
const preloadedImageElements = new Map<string, HTMLImageElement>();
const preloadedCardIds = new Set<number>();

export function getCardPrimaryImageUrl(card: YugiohCard): string {
  return (
    card.card_images?.[0]?.image_url ||
    card.card_images?.[0]?.image_url_small ||
    `https://images.ygoprodeck.com/images/cards/${card.id}.jpg`
  );
}

export function isCardImagePreloaded(cardId: number): boolean {
  return preloadedCardIds.has(cardId);
}

export function markCardImageLoaded(cardId: number): void {
  if (preloadedCardIds.size >= 120) {
    const oldest = preloadedCardIds.values().next().value;
    if (oldest !== undefined) {
      preloadedCardIds.delete(oldest);
    }
  }
  preloadedCardIds.add(cardId);
}

export function preloadCardImage(card?: YugiohCard): void {
  if (!card || typeof window === 'undefined') return;
  const url = getCardPrimaryImageUrl(card);
  if (!url || preloadedImageElements.has(url)) return;

  // Evict oldest preloaded Image element if ring buffer is full
  if (preloadedImageElements.size >= MAX_PRELOADED_IMAGES) {
    const oldestUrl = preloadedImageElements.keys().next().value;
    if (oldestUrl) {
      preloadedImageElements.delete(oldestUrl);
    }
  }

  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.onload = () => {
    markCardImageLoaded(card.id);
  };
  img.src = url;
  preloadedImageElements.set(url, img);
}

// Helper to set an entry in the bounded LRU queryCache and evict the oldest entry if full
function setBoundedQueryCache(cacheKey: string, cards: YugiohCard[]): void {
  if (queryCache.has(cacheKey)) {
    queryCache.delete(cacheKey);
  } else if (queryCache.size >= MAX_FILTER_CACHE_ENTRIES) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey !== undefined) {
      queryCache.delete(oldestKey);
      seenCardIdsByFilter.delete(oldestKey);
      nextCandidateByFilter.delete(oldestKey);
    }
  }
  queryCache.set(cacheKey, { data: cards, timestamp: Date.now() });
}

// Helper to read from queryCache and refresh its LRU order
function getBoundedQueryCache(cacheKey: string): YugiohCard[] | null {
  const cached = queryCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp >= CACHE_TTL_MS || cached.data.length === 0) {
    queryCache.delete(cacheKey);
    seenCardIdsByFilter.delete(cacheKey);
    nextCandidateByFilter.delete(cacheKey);
    return null;
  }
  // Refresh LRU order
  queryCache.delete(cacheKey);
  queryCache.set(cacheKey, cached);
  return cached.data;
}

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
    case 'tuner':
      return 'Normal Tuner Monster,Synchro Tuner Monster,Pendulum Tuner Effect Monster,Flip Tuner Effect Monster';
    default:
      return superType;
  }
}

// Exclude Token, Skill, and '???' placeholder cards from ever being drawn as random cards
export function isPlayableCard(card: any): boolean {
  if (!card) return false;
  const nameTrimmed = String(card.name || '').trim();
  if (
    nameTrimmed === '???' ||
    nameTrimmed === '?' ||
    nameTrimmed === '????' ||
    nameTrimmed.toLowerCase() === 'unknown'
  ) {
    return false;
  }

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

// Normalize and slim card fields once to minimize memory & storage footprint (~70% smaller)
export function normalizeCard(rawCard: any): YugiohCard {
  if (!rawCard) return rawCard;
  let src = rawCard;

  if (src.data && Array.isArray(src.data) && src.data.length > 0) {
    src = src.data[0];
  }

  const cardId = Number(src.id) || 89631139;
  const cardName = String(src.name || 'Unknown Card');

  let resolvedType = src.type;
  if (!resolvedType) {
    if (src.humanReadableCardType) {
      resolvedType = src.humanReadableCardType;
    } else if (src.atk !== undefined || src.def !== undefined) {
      resolvedType = 'Effect Monster';
    } else {
      resolvedType = 'Normal Monster';
    }
  }

  const firstImg =
    Array.isArray(src.card_images) && src.card_images.length > 0 ? src.card_images[0] : null;
  const cardImages = [
    {
      id: firstImg?.id || cardId,
      image_url:
        firstImg?.image_url || `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`,
      image_url_small:
        firstImg?.image_url_small ||
        `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`,
      image_url_cropped:
        firstImg?.image_url_cropped ||
        `https://images.ygoprodeck.com/images/cards_cropped/${cardId}.jpg`
    }
  ];

  let ygoprodeckUrl = src.ygoprodeck_url;
  if (!ygoprodeckUrl) {
    const slug = cardName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    ygoprodeckUrl = slug
      ? `https://ygoprodeck.com/card/${slug}-${cardId}`
      : `https://ygoprodeck.com/card/${cardId}`;
  }

  const firstPrice =
    Array.isArray(src.card_prices) && src.card_prices.length > 0 ? src.card_prices[0] : null;
  const cardPrices = [
    {
      tcgplayer_price: firstPrice?.tcgplayer_price || '0.75',
      cardmarket_price: firstPrice?.cardmarket_price || '0.60'
    }
  ];

  const slimmed: YugiohCard = {
    id: cardId,
    name: cardName,
    type: resolvedType,
    desc: String(src.desc || ''),
    race: String(src.race || 'Card'),
    card_images: cardImages,
    card_prices: cardPrices,
    ygoprodeck_url: ygoprodeckUrl
  };

  if (src.humanReadableCardType) slimmed.humanReadableCardType = src.humanReadableCardType;
  if (src.frameType) slimmed.frameType = src.frameType;
  if (typeof src.atk === 'number') slimmed.atk = src.atk;
  if (typeof src.def === 'number') slimmed.def = src.def;
  if (typeof src.level === 'number') slimmed.level = src.level;
  if (src.attribute) slimmed.attribute = src.attribute;
  if (src.archetype) slimmed.archetype = src.archetype;
  if (typeof src.scale === 'number' && !isNaN(src.scale) && src.scale >= 0) {
    slimmed.scale = src.scale;
  }
  if (typeof src.linkval === 'number') slimmed.linkval = src.linkval;
  if (Array.isArray(src.linkmarkers) && src.linkmarkers.length > 0) {
    slimmed.linkmarkers = src.linkmarkers;
  }
  if (Array.isArray(src.card_sets) && src.card_sets.length > 0) {
    // Only retain up to 8 card sets since the UI displays at most 8 sets
    slimmed.card_sets = src.card_sets.slice(0, 8).map((s: any) => ({
      set_name: s.set_name,
      set_code: s.set_code,
      set_rarity: s.set_rarity,
      ...(s.set_price ? { set_price: s.set_price } : {})
    }));
  }
  if (src.banlist_info && (src.banlist_info.ban_tcg || src.banlist_info.ban_ocg)) {
    slimmed.banlist_info = {
      ...(src.banlist_info.ban_tcg ? { ban_tcg: src.banlist_info.ban_tcg } : {}),
      ...(src.banlist_info.ban_ocg ? { ban_ocg: src.banlist_info.ban_ocg } : {})
    };
  }

  return slimmed;
}

// Extract, filter, and normalize/slim cards once upon API receipt
function extractAndNormalizeCards(json: any): YugiohCard[] {
  if (!json) return [];
  let rawList: any[] = [];
  if (Array.isArray(json.data) && json.data.length > 0) {
    rawList = json.data;
  } else if (Array.isArray(json) && json.length > 0) {
    rawList = json;
  } else if (json.id && json.name) {
    rawList = [json];
  }
  const normalized: YugiohCard[] = [];
  for (let i = 0; i < rawList.length; i++) {
    if (isPlayableCard(rawList[i])) {
      normalized.push(normalizeCard(rawList[i]));
    }
  }
  return normalized;
}

// Filter local fallback cards when offline
export function filterFallbackCards(filters: CardFilterState, excludeId?: number): YugiohCard[] {
  const filtered = FALLBACK_CARDS.filter((card) => {
    if (!isPlayableCard(card)) return false;
    if (
      filters.attribute &&
      card.attribute?.toUpperCase() !== String(filters.attribute).toUpperCase()
    ) {
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
      if (s === 'pendulum' && !cardTypeLower.includes('pendulum') && card.scale === undefined)
        return false;
      if (s === 'fusion' && !cardTypeLower.includes('fusion')) return false;
      if (s === 'tuner' && !cardTypeLower.includes('tuner')) return false;
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
  }).map(normalizeCard);

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
  isCycleReset?: boolean;
}

export function buildFilterParams(filters: CardFilterState): URLSearchParams {
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
  if (filters.archetype) params.append('archetype', String(filters.archetype).trim());
  if (filters.keyword) params.append('fname', String(filters.keyword).trim());

  if (filters.superType) {
    const mappedType = getSuperTypeQuery(String(filters.superType));
    params.append('type', mappedType);
  } else if (filters.type) {
    const t = String(filters.type);
    if (t.toLowerCase() === 'monster') {
      params.append(
        'type',
        [
          'Effect Monster',
          'Flip Effect Monster',
          'Flip Tuner Effect Monster',
          'Gemini Monster',
          'Normal Monster',
          'Normal Tuner Monster',
          'Pendulum Effect Monster',
          'Pendulum Effect Ritual Monster',
          'Pendulum Flip Effect Monster',
          'Pendulum Normal Monster',
          'Pendulum Tuner Effect Monster',
          'Ritual Effect Monster',
          'Ritual Monster',
          'Spirit Monster',
          'Toon Monster',
          'Tuner Monster',
          'Union Effect Monster',
          'Fusion Monster',
          'Link Monster',
          'Pendulum Effect Fusion Monster',
          'Synchro Monster',
          'Synchro Pendulum Effect Monster',
          'Synchro Tuner Monster',
          'XYZ Monster',
          'XYZ Pendulum Effect Monster'
        ].join(',')
      );
    } else if (t.toLowerCase().includes('spell')) {
      params.append('type', 'Spell Card');
    } else if (t.toLowerCase().includes('trap')) {
      params.append('type', 'Trap Card');
    } else {
      params.append('type', t);
    }
  }

  return params;
}

// Pre-select and preload the next random candidate for a cached filter pool
function primeNextFilteredCandidate(cacheKey: string, allCards: YugiohCard[], excludeId?: number) {
  if (allCards.length === 0) return;
  const existing = nextCandidateByFilter.get(cacheKey);
  const seenSet = seenCardIdsByFilter.get(cacheKey);

  if (existing && (!excludeId || existing.id !== excludeId) && (!seenSet || !seenSet.has(existing.id))) {
    preloadCardImage(existing);
    return;
  }

  let unseen = seenSet ? allCards.filter((c) => !seenSet.has(c.id)) : allCards;
  if (unseen.length === 0) unseen = allCards;
  if (excludeId && unseen.length > 1) {
    const filtered = unseen.filter((c) => c.id !== excludeId);
    if (filtered.length > 0) unseen = filtered;
  }
  const candidate = unseen[Math.floor(Math.random() * unseen.length)];
  if (candidate) {
    nextCandidateByFilter.set(cacheKey, candidate);
    preloadCardImage(candidate);
  }
}

/**
 * Refills the unconstrained random draw queue with up to 30 cards in a single API call
 * and preloads the artwork for the next 2 cards in the queue.
 */
async function refillUnconstrainedQueue(excludeId?: number): Promise<void> {
  if (inFlightRandomRefill) {
    return inFlightRandomRefill;
  }

  inFlightRandomRefill = (async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(
        `${YGOPRODECK_API_URL}?num=${RANDOM_BATCH_SIZE}&offset=0&sort=random&cachebust=${timestamp}`,
        {
          headers: { Accept: 'application/json' }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const cards = extractAndNormalizeCards(json);
        const existingIds = new Set(unconstrainedDrawQueue.map((c) => c.id));
        if (excludeId) existingIds.add(excludeId);

        for (const card of cards) {
          if (!existingIds.has(card.id)) {
            unconstrainedDrawQueue.push(card);
            existingIds.add(card.id);
          }
        }

        // Preload the next 2 cards at the front of the queue so the next Draw click flips immediately
        preloadCardImage(unconstrainedDrawQueue[0]);
        preloadCardImage(unconstrainedDrawQueue[1]);
      }
    } catch (err) {
      console.warn('Background random queue refill failed:', err);
    } finally {
      inFlightRandomRefill = null;
    }
  })();

  return inFlightRandomRefill;
}

/**
 * Warms the unconstrained random card queue on initial app mount so the user's first draw is instant.
 */
export function warmRandomCardQueue(excludeId?: number): void {
  if (unconstrainedDrawQueue.length <= RANDOM_REFILL_THRESHOLD) {
    void refillUnconstrainedQueue(excludeId);
  } else {
    preloadCardImage(unconstrainedDrawQueue[0]);
    preloadCardImage(unconstrainedDrawQueue[1]);
  }
}

/**
 * Fetches filtered cards from YGOPRODeck with 3-slot LRU caching and in-flight deduplication.
 * Throws `{ status: 404 }` if the API returns no matching cards and no fallback matches exist.
 */
async function fetchFilteredPoolWithDeduplication(
  filters: CardFilterState
): Promise<{ cards: YugiohCard[]; source: 'ygoprodeck' | 'ygoprodeck-cache' | 'fallback' }> {
  const params = buildFilterParams(filters);
  const cacheKey = params.toString();

  // 1. Check bounded LRU cache first
  const cached = getBoundedQueryCache(cacheKey);
  if (cached && cached.length > 0) {
    primeNextFilteredCandidate(cacheKey, cached);
    return { cards: cached, source: 'ygoprodeck-cache' };
  }

  // 2. Deduplicate concurrent in-flight API requests for the exact same filter query
  let pendingPromise = inFlightRequests.get(cacheKey);
  if (!pendingPromise) {
    const requestUrl = `${YGOPRODECK_API_URL}?${cacheKey}`;
    pendingPromise = (async () => {
      try {
        const response = await fetch(requestUrl, {
          headers: { Accept: 'application/json' }
        });
        if (response.ok) {
          const result = await response.json();
          const cards = extractAndNormalizeCards(result);
          if (cards.length > 0) {
            setBoundedQueryCache(cacheKey, cards);
            primeNextFilteredCandidate(cacheKey, cards);
            return cards;
          }
        }
        return [];
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();
    inFlightRequests.set(cacheKey, pendingPromise);
  }

  try {
    const apiCards = await pendingPromise;
    if (apiCards.length > 0) {
      return { cards: apiCards, source: 'ygoprodeck' };
    }
  } catch (err) {
    console.warn('Filtered API request failed, checking fallback pool:', err);
  }

  const fallback = filterFallbackCards(filters);
  return { cards: fallback, source: 'fallback' };
}

/**
 * Retrieves all cards matching the specified filters, using bounded LRU cache or deduplicated fetch
 */
export async function getAllMatchingCards(filters: CardFilterState): Promise<YugiohCard[]> {
  const { cards } = await fetchFilteredPoolWithDeduplication(filters);
  return cards;
}

/**
 * Fast count of matching cards in the database for the given filters
 */
export async function getMatchingCardsCount(filters: CardFilterState): Promise<number> {
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

  if (!hasFilters) {
    return 13000;
  }

  try {
    const { cards } = await fetchFilteredPoolWithDeduplication(filters);
    return cards.length;
  } catch {
    const fallback = filterFallbackCards(filters);
    return fallback.length;
  }
}

/**
 * Draws a random card using the unconstrained 30-card prefetch queue or bounded LRU filter cache.
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

  // 1. Unconstrained Random Card Draw via Prefetch Queue (0ms instant pop when warm)
  if (!hasFilters) {
    // Remove any queued duplicate of the currently displayed card
    if (excludeId && unconstrainedDrawQueue.length > 1 && unconstrainedDrawQueue[0].id === excludeId) {
      const skipped = unconstrainedDrawQueue.shift()!;
      unconstrainedDrawQueue.push(skipped);
    }

    if (unconstrainedDrawQueue.length === 0) {
      await refillUnconstrainedQueue(excludeId);
    }

    if (unconstrainedDrawQueue.length > 0) {
      const nextCard = unconstrainedDrawQueue.shift()!;
      // Preload the next two cards in the queue for subsequent draws
      preloadCardImage(unconstrainedDrawQueue[0]);
      preloadCardImage(unconstrainedDrawQueue[1]);

      // Trigger silent background refill when queue drops to threshold
      if (unconstrainedDrawQueue.length <= RANDOM_REFILL_THRESHOLD) {
        void refillUnconstrainedQueue(nextCard.id);
      }

      return {
        card: nextCard,
        totalMatches: 13000,
        source: 'ygoprodeck',
        isCycleReset: false
      };
    }

    // Offline fallback if API is unreachable
    let fallbackPool = FALLBACK_CARDS.map(normalizeCard);
    if (excludeId && fallbackPool.length > 1) {
      const nonExcluded = fallbackPool.filter((c) => c.id !== excludeId);
      if (nonExcluded.length > 0) fallbackPool = nonExcluded;
    }
    const randomCard = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    preloadCardImage(randomCard);
    return {
      card: randomCard,
      totalMatches: fallbackPool.length,
      source: 'fallback',
      isCycleReset: false
    };
  }

  // 2. Filtered Random Card Draw with Cycle Exhaustion Tracking & Preloaded Candidate
  const params = buildFilterParams(filters);
  const cacheKey = params.toString();

  const { cards: allCards, source } = await fetchFilteredPoolWithDeduplication(filters);

  if (allCards.length === 0) {
    const notFoundError: any = new Error('No cards found matching the specified criteria.');
    notFoundError.status = 404;
    throw notFoundError;
  }

  let seenSet = seenCardIdsByFilter.get(cacheKey);
  if (!seenSet) {
    seenSet = new Set<number>();
    seenCardIdsByFilter.set(cacheKey, seenSet);
  }

  let unseen = allCards.filter((c) => !seenSet!.has(c.id));
  let isCycleReset = false;

  if (unseen.length === 0) {
    seenSet.clear();
    isCycleReset = allCards.length > 1;
    unseen = allCards;
  }

  let pool = unseen;
  if (excludeId && pool.length > 1) {
    const nonExcluded = pool.filter((c) => c.id !== excludeId);
    if (nonExcluded.length > 0) pool = nonExcluded;
  }

  // Use the pre-selected & preloaded candidate if it is still valid for this pool
  const primed = nextCandidateByFilter.get(cacheKey);
  let picked: YugiohCard;
  if (primed && pool.some((c) => c.id === primed.id)) {
    picked = primed;
    nextCandidateByFilter.delete(cacheKey);
  } else {
    picked = pool[Math.floor(Math.random() * pool.length)];
  }

  seenSet.add(picked.id);

  // Immediately prime & preload the next unseen candidate for this filter pool
  primeNextFilteredCandidate(cacheKey, allCards, picked.id);

  return {
    card: picked,
    totalMatches: allCards.length,
    source,
    isCycleReset
  };
}
