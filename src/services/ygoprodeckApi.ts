import { YugiohCard, CardFilterState, CardSet } from '../types/card';
import { FALLBACK_CARDS } from '../data/fallbackCards';
import { sanitizeExternalHttpUrl } from '../utils/cardFormatters';

const YGOPRODECK_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const YGOPRODECK_CARDSETS_URL = 'https://db.ygoprodeck.com/api/v7/cardsets.php';
const CARDSETS_STORAGE_KEY = 'ygo_cardsets_release_dates_v1';

// Static fallback map of major TCG set codes to release dates (YYYY-MM-DD) for instant resolution
const STATIC_SET_RELEASE_DATES_BY_CODE: Record<string, string> = {
  LOB: '2002-03-08',
  SDK: '2002-03-29',
  SDY: '2002-03-29',
  MRD: '2002-06-26',
  MRL: '2002-09-16',
  SRL: '2002-09-16',
  PSV: '2002-10-20',
  LON: '2003-03-01',
  SDJ: '2003-03-30',
  SDP: '2003-03-30',
  LOD: '2003-06-06',
  PGD: '2003-07-18',
  MFC: '2003-10-10',
  DCR: '2003-12-01',
  SYE: '2004-03-01',
  SKE: '2004-03-01',
  IOC: '2004-03-01',
  AST: '2004-06-01',
  CT1: '2004-09-01',
  SOD: '2004-10-01',
  RDS: '2004-12-01',
  DB1: '2004-10-12',
  FET: '2005-03-01',
  DR1: '2005-03-19',
  TLM: '2005-06-01',
  DB2: '2005-07-27',
  CRV: '2005-08-17',
  CT2: '2005-09-01',
  DR2: '2005-10-20',
  EEN: '2005-11-16',
  SOI: '2006-02-28',
  EOJ: '2006-05-17',
  POTD: '2006-08-16',
  CT03: '2006-09-01',
  CDIP: '2006-11-15',
  DR3: '2006-11-25',
  STON: '2007-02-28',
  FOTB: '2007-05-16',
  TAEV: '2007-08-15',
  CT04: '2007-09-01',
  GLAS: '2007-11-14',
  DR04: '2007-11-14',
  PTDN: '2008-02-13',
  LODT: '2008-05-13',
  CT05: '2008-08-19',
  TDGS: '2008-09-02',
  CSOC: '2008-11-18',
  CRMS: '2009-03-03',
  RGBT: '2009-05-12',
  ANPR: '2009-09-01',
  CT06: '2009-08-18',
  SOVR: '2009-11-17',
  ABPF: '2010-02-16',
  TSHD: '2010-05-11',
  DREV: '2010-08-17',
  CT07: '2010-08-31',
  STBL: '2010-11-16',
  STOR: '2011-02-08',
  EXVC: '2011-05-10',
  YS11: '2011-05-31',
  GENF: '2011-08-16',
  CT08: '2011-08-30',
  PHSW: '2011-11-15',
  ORCS: '2012-01-24',
  YS12: '2012-04-17',
  GAOV: '2012-05-08',
  REDU: '2012-08-28',
  CT09: '2012-08-14',
  LCYW: '2012-10-02',
  ABYR: '2012-11-09',
  CBLZ: '2013-01-25',
  LTGY: '2013-05-17',
  YS13: '2013-06-14',
  JOTL: '2013-08-09',
  CT10: '2013-08-30',
  LCJW: '2013-10-11',
  SHSP: '2013-11-08',
  LVAL: '2014-01-24',
  PRIO: '2014-05-16',
  YS14: '2014-07-11',
  DUEA: '2014-08-15',
  MP14: '2014-08-29',
  LC5D: '2014-10-24',
  NECH: '2014-11-07',
  SECE: '2015-01-16',
  CROS: '2015-05-15',
  CORE: '2015-08-07',
  MP15: '2015-09-18',
  DOCS: '2015-11-06',
  BOSH: '2016-01-15',
  SHVI: '2016-05-06',
  TDIL: '2016-08-05',
  MP16: '2016-09-02',
  SDKS: '2016-10-21',
  SDMY: '2016-10-21',
  INOV: '2016-11-04',
  RATE: '2017-02-10',
  DUPO: '2019-04-03',
  MACR: '2017-05-05',
  YS17: '2017-07-21',
  COTD: '2017-08-04',
  MP17: '2017-08-25',
  LEDD: '2017-10-06',
  CIBR: '2017-10-20',
  EXFO: '2018-02-02',
  LCKC: '2018-03-09',
  FLOD: '2018-05-04',
  CYHO: '2018-07-27',
  MP18: '2018-08-31',
  SOFU: '2018-10-19',
  SAST: '2019-02-01',
  SDSB: '2019-02-15',
  DANE: '2019-05-03',
  RIRA: '2019-07-26',
  MP19: '2019-08-30',
  SDRR: '2019-08-16',
  CHIM: '2019-10-25',
  IGAS: '2020-01-31',
  SDSH: '2020-02-14',
  DUOV: '2020-03-20',
  ETCO: '2020-05-01',
  ROTD: '2020-08-07',
  MP20: '2020-08-28',
  PHRA: '2020-11-06',
  BLVO: '2021-02-05',
  GFTP: '2021-04-16',
  LIOV: '2021-06-04',
  DAMA: '2021-08-13',
  MP21: '2021-10-01',
  SDCS: '2021-10-15',
  BODE: '2021-11-05',
  BACH: '2022-02-11',
  SDAZ: '2022-04-15',
  GFP2: '2022-05-06',
  DIFO: '2022-05-20',
  LED9: '2022-06-17',
  POTE: '2022-08-05',
  MP22: '2022-09-16',
  SDCB: '2022-09-30',
  DABL: '2022-10-21',
  MAMA: '2022-11-04',
  PHHY: '2023-02-10',
  MAZE: '2023-03-10',
  CYAC: '2023-05-05',
  BLMR: '2023-06-23',
  DUNE: '2023-07-28',
  MP23: '2023-09-08',
  SDCK: '2023-09-22',
  AGOV: '2023-10-20',
  RA01: '2023-11-03',
  MZMI: '2024-01-19',
  PHNI: '2024-02-09',
  LEDE: '2024-04-26',
  RA02: '2024-05-24',
  BLTR: '2024-06-21',
  INFO: '2024-07-19',
  MP24: '2024-09-20',
  ROTA: '2024-10-11',
  RA03: '2024-11-15',
  SUDA: '2025-01-24'
};

const setReleaseDateByCode = new Map<string, string>();
const setReleaseDateByName = new Map<string, string>();
let cardSetsMetadataLoaded = false;
let cardSetsMetadataPromise: Promise<void> | null = null;
const cardSetsMetadataListeners = new Set<() => void>();

// Seed maps with static release dates immediately
for (const [code, dateStr] of Object.entries(STATIC_SET_RELEASE_DATES_BY_CODE)) {
  setReleaseDateByCode.set(code.toUpperCase(), dateStr);
}

function hydrateCardSetsFromLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(CARDSETS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sets)) {
      for (const item of parsed.sets) {
        if (item.c && item.d) setReleaseDateByCode.set(String(item.c).toUpperCase(), String(item.d));
        if (item.n && item.d) setReleaseDateByName.set(String(item.n).toLowerCase(), String(item.d));
      }
      if (Date.now() - (parsed.ts || 0) < 1000 * 60 * 60 * 24 * 7) {
        cardSetsMetadataLoaded = true;
      }
    }
  } catch {
    // Ignore storage read errors
  }
}

hydrateCardSetsFromLocalStorage();

/**
 * Fetches and caches official YGOPRODeck card set release dates (`cardsets.php`) once.
 */
export function ensureCardSetsMetadataLoaded(onLoaded?: () => void): Promise<void> {
  if (cardSetsMetadataLoaded) {
    onLoaded?.();
    return Promise.resolve();
  }
  if (onLoaded) {
    cardSetsMetadataListeners.add(onLoaded);
  }
  if (cardSetsMetadataPromise) {
    return cardSetsMetadataPromise;
  }

  cardSetsMetadataPromise = (async () => {
    try {
      const response = await fetch(YGOPRODECK_CARDSETS_URL, {
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        const list = await response.json();
        if (Array.isArray(list)) {
          const compactForStorage: Array<{ c: string; n: string; d: string }> = [];
          for (const entry of list) {
            const tcgDate = entry?.tcg_date ? String(entry.tcg_date).trim() : '';
            if (!tcgDate || !/^\d{4}/.test(tcgDate)) continue;
            const code = entry?.set_code ? String(entry.set_code).trim().toUpperCase() : '';
            const name = entry?.set_name ? String(entry.set_name).trim().toLowerCase() : '';
            if (code) setReleaseDateByCode.set(code, tcgDate);
            if (name) setReleaseDateByName.set(name, tcgDate);
            if (code || name) {
              compactForStorage.push({ c: code, n: name, d: tcgDate });
            }
          }
          cardSetsMetadataLoaded = true;
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(
                CARDSETS_STORAGE_KEY,
                JSON.stringify({ ts: Date.now(), sets: compactForStorage })
              );
            } catch {
              // Ignore storage quota errors
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch cardsets release metadata:', err);
    } finally {
      cardSetsMetadataPromise = null;
      for (const listener of cardSetsMetadataListeners) {
        try {
          listener();
        } catch {
          // Ignore listener error
        }
      }
      cardSetsMetadataListeners.clear();
    }
  })();

  return cardSetsMetadataPromise;
}

/**
 * Resolves the TCG release date (`YYYY-MM-DD`) and 4-digit release year for a single CardSet.
 */
export function resolveCardSetReleaseInfo(set: CardSet): { tcg_date?: string; release_year?: number } {
  if (set.tcg_date && /^\d{4}/.test(set.tcg_date)) {
    const yr = parseInt(set.tcg_date.slice(0, 4), 10);
    return { tcg_date: set.tcg_date, release_year: !isNaN(yr) ? yr : set.release_year };
  }

  const rawCode = String(set.set_code || '').trim().toUpperCase();
  const codePrefix = rawCode.split('-')[0].trim();
  const normalizedName = String(set.set_name || '').trim().toLowerCase();

  let matchedDate =
    (codePrefix && setReleaseDateByCode.get(codePrefix)) ||
    (normalizedName && setReleaseDateByName.get(normalizedName));

  // Fallback pattern inference for annual Mega-Tins / Collector Tins / Starter Decks if not yet in map
  if (!matchedDate) {
    const mpMatch = codePrefix.match(/^(?:MP|CT|YS)(\d{2})$/);
    if (mpMatch) {
      const twoDigit = parseInt(mpMatch[1], 10);
      if (twoDigit >= 2 && twoDigit <= 30) {
        matchedDate = `${2000 + twoDigit}-09-01`;
      }
    } else {
      const nameYearMatch = normalizedName.match(/\b(1999|20[0-2]\d)\b/);
      if (nameYearMatch) {
        matchedDate = `${nameYearMatch[1]}-06-01`;
      }
    }
  }

  if (matchedDate && /^\d{4}/.test(matchedDate)) {
    const year = parseInt(matchedDate.slice(0, 4), 10);
    return {
      tcg_date: matchedDate,
      release_year: !isNaN(year) ? year : set.release_year
    };
  }

  if (typeof set.release_year === 'number' && !isNaN(set.release_year)) {
    return {
      tcg_date: `${set.release_year}-12-31`,
      release_year: set.release_year
    };
  }

  return {};
}

/**
 * Enriches an array of CardSets with `tcg_date` and `release_year` and automatically sorts them
 * chronologically from oldest to newest (placing any sets without a known date at the end).
 */
export function enrichAndSortCardSets(sets?: CardSet[]): CardSet[] {
  if (!Array.isArray(sets) || sets.length === 0) return [];

  const enriched = sets.map((s) => {
    const info = resolveCardSetReleaseInfo(s);
    return {
      ...s,
      ...(info.tcg_date ? { tcg_date: info.tcg_date } : {}),
      ...(info.release_year ? { release_year: info.release_year } : {})
    };
  });

  // Sort oldest to newest automatically
  return enriched.sort((a, b) => {
    const dateA = a.tcg_date || (a.release_year ? `${a.release_year}-12-31` : '9999-12-31');
    const dateB = b.tcg_date || (b.release_year ? `${b.release_year}-12-31` : '9999-12-31');
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    return String(a.set_code || '').localeCompare(String(b.set_code || ''));
  });
}

/**
 * Returns the earliest known release year (Debut Year) for a card across its sets.
 */
export function getCardDebutYear(card: YugiohCard): number | undefined {
  const sortedSets = enrichAndSortCardSets(card.card_sets);
  for (const s of sortedSets) {
    if (typeof s.release_year === 'number' && !isNaN(s.release_year)) {
      return s.release_year;
    }
  }
  return undefined;
}

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
        sanitizeExternalHttpUrl(firstImg?.image_url) ||
        `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`,
      image_url_small:
        sanitizeExternalHttpUrl(firstImg?.image_url_small) ||
        `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`,
      image_url_cropped:
        sanitizeExternalHttpUrl(firstImg?.image_url_cropped) ||
        `https://images.ygoprodeck.com/images/cards_cropped/${cardId}.jpg`
    }
  ];

  let ygoprodeckUrl = sanitizeExternalHttpUrl(src.ygoprodeck_url);
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
    // Map, enrich with release dates/years, sort chronologically (oldest to newest), and retain up to 16 sets
    const rawMappedSets: CardSet[] = src.card_sets.map((s: any) => ({
      set_name: s.set_name,
      set_code: s.set_code,
      set_rarity: s.set_rarity,
      ...(s.set_price ? { set_price: s.set_price } : {}),
      ...(s.tcg_date ? { tcg_date: s.tcg_date } : {}),
      ...(s.release_year ? { release_year: s.release_year } : {})
    }));
    slimmed.card_sets = enrichAndSortCardSets(rawMappedSets).slice(0, 16);
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

const resolvedCardByNameCache = new Map<string, YugiohCard>();
const MAX_RESOLVED_CARD_NAME_CACHE = 250;

function cacheResolvedCardByName(nameKey: string, card: YugiohCard) {
  const key = nameKey.trim().toLowerCase();
  if (!key) return;
  if (resolvedCardByNameCache.has(key)) {
    resolvedCardByNameCache.delete(key);
  } else if (resolvedCardByNameCache.size >= MAX_RESOLVED_CARD_NAME_CACHE) {
    const oldestKey = resolvedCardByNameCache.keys().next().value;
    if (oldestKey !== undefined) {
      resolvedCardByNameCache.delete(oldestKey);
    }
  }
  resolvedCardByNameCache.set(key, card);
}

/**
 * Checks all warm in-memory client caches (resolvedCardByNameCache, queryCache, unconstrainedDrawQueue, FALLBACK_CARDS)
 * for a card matching an exact name (case-insensitive) to avoid unnecessary network calls.
 */
export function findCardInWarmCache(name: string): YugiohCard | undefined {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;

  const direct = resolvedCardByNameCache.get(target);
  if (direct) return direct;

  for (const entry of queryCache.values()) {
    const found = entry.data.find((c) => c.name.toLowerCase() === target);
    if (found) {
      cacheResolvedCardByName(target, found);
      return found;
    }
  }

  const inQueue = unconstrainedDrawQueue.find((c) => c.name.toLowerCase() === target);
  if (inQueue) {
    cacheResolvedCardByName(target, inQueue);
    return inQueue;
  }

  const inFallback = FALLBACK_CARDS.find((c) => c.name.toLowerCase() === target);
  if (inFallback && isPlayableCard(inFallback)) {
    const normalized = normalizeCard(inFallback);
    cacheResolvedCardByName(target, normalized);
    return normalized;
  }

  return undefined;
}

/**
 * Resolves multiple card names in a single batched YGOPRODeck API request using pipe-delimited
 * `?name=Name1|Name2|Name3`, checking warm caches first and falling back to fuzzy search only if needed.
 */
export async function fetchCardsByNamesBatch(names: string[]): Promise<YugiohCard[]> {
  const uniqueNames = Array.from(
    new Set(names.map((n) => n.trim()).filter((n) => n.length >= 2))
  );
  if (uniqueNames.length === 0) return [];

  const resolvedMap = new Map<number, YugiohCard>();
  const missingNames: string[] = [];

  for (const name of uniqueNames) {
    const cached = findCardInWarmCache(name);
    if (cached) {
      resolvedMap.set(cached.id, cached);
    } else {
      missingNames.push(name);
    }
  }

  if (missingNames.length === 0) {
    return Array.from(resolvedMap.values());
  }

  // Batch up to 12 names in a single pipe-delimited request
  const batchSlice = missingNames.slice(0, 12);
  const pipeParam = batchSlice.join('|');
  try {
    const url = `${YGOPRODECK_API_URL}?name=${encodeURIComponent(pipeParam)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    if (response.ok) {
      const json = await response.json();
      const cards = extractAndNormalizeCards(json);
      for (const c of cards) {
        resolvedMap.set(c.id, c);
        cacheResolvedCardByName(c.name, c);
        preloadCardImage(c);
      }
    }
  } catch (err) {
    console.warn('Batch name lookup failed, attempting individual fuzzy fallback:', err);
  }

  // Only perform an extra fuzzy round-trip if the primary pipe-delimited batch resolved fewer than 3 cards
  if (resolvedMap.size < 3) {
    const stillMissing = batchSlice.filter(
      (reqName) =>
        !Array.from(resolvedMap.values()).some(
          (c) => c.name.toLowerCase() === reqName.toLowerCase()
        )
    );

    if (stillMissing.length > 0) {
      const fuzzyPromises = stillMissing.slice(0, 2).map(async (partialName) => {
        try {
          const { cards } = await fetchFilteredPoolWithDeduplication({ keyword: partialName });
          const bestMatch =
            cards.find((c) => c.name.toLowerCase() === partialName.toLowerCase()) || cards[0];
          if (bestMatch) {
            resolvedMap.set(bestMatch.id, bestMatch);
            cacheResolvedCardByName(bestMatch.name, bestMatch);
            cacheResolvedCardByName(partialName, bestMatch);
            preloadCardImage(bestMatch);
          }
        } catch {
          // Ignore individual fuzzy lookup errors
        }
      });
      await Promise.all(fuzzyPromises);
    }
  }

  return Array.from(resolvedMap.values());
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
