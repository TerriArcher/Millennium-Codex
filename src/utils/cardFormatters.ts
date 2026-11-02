import { YugiohCard } from '../types/card';

export interface CardFrameTheme {
  bg: string;
  border: string;
  text: string;
  accent: string;
  label: string;
}

export interface FormattedCardTypeLine {
  fullType: string;
  accentClass: string;
  borderClass: string;
  bgClass: string;
}

/**
 * Validates that an external URL uses http:// or https:// protocol.
 * Returns undefined if invalid or unsafe (e.g., javascript: or data:).
 */
export function sanitizeExternalHttpUrl(rawUrl: string | undefined | null): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Ignore malformed URLs
  }
  return undefined;
}

/**
 * Returns the small card portrait URL, validating http(s) protocol and falling back to official YGOPRODeck CDN.
 */
export function getCardSmallImageUrl(card: YugiohCard): string {
  const candidate = sanitizeExternalHttpUrl(card.card_images?.[0]?.image_url_small);
  return candidate || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`;
}

/**
 * Returns the full-resolution card image URL, validating http(s) protocol and falling back to official YGOPRODeck CDN.
 */
export function getCardFullImageUrl(card: YugiohCard): string {
  const candidate =
    sanitizeExternalHttpUrl(card.card_images?.[0]?.image_url) ||
    sanitizeExternalHttpUrl(card.card_images?.[0]?.image_url_small);
  return candidate || `https://images.ygoprodeck.com/images/cards/${card.id}.jpg`;
}

/**
 * Returns the sanitized YGOPRODeck page URL for a card.
 */
export function getCardYgoProDeckUrl(card: YugiohCard): string {
  const candidate = sanitizeExternalHttpUrl(card.ygoprodeck_url);
  return candidate || `https://ygoprodeck.com/card/${encodeURIComponent(card.name)}`;
}

/**
 * Extracts and formats the TCGplayer (or fallback Cardmarket) price without leading '$'.
 */
export function getFormattedTcgPrice(card: YugiohCard): string {
  const rawPrice = card.card_prices?.[0]?.tcgplayer_price;
  if (rawPrice && rawPrice !== '0.00' && rawPrice !== '0') {
    return rawPrice.startsWith('$') ? rawPrice.slice(1) : rawPrice;
  }
  return card.card_prices?.[0]?.cardmarket_price || '0.99';
}

/**
 * Color schemes matching authentic Yu-Gi-Oh! card frames for CardDisplay badges and fallbacks.
 */
export function getCardFrameTheme(card: YugiohCard): CardFrameTheme {
  const typeStr = (card.type || '').toLowerCase();
  const hasScale = typeof card.scale === 'number' && !isNaN(card.scale) && card.scale >= 0;

  if (typeStr.includes('pendulum') || hasScale) {
    return {
      bg: 'bg-teal-950/40',
      border: 'border-teal-600/40',
      text: 'text-teal-400',
      accent: 'teal',
      label: card.type || 'Pendulum Monster'
    };
  }
  if (typeStr.includes('spell')) {
    return {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-600/40',
      text: 'text-emerald-400',
      accent: 'emerald',
      label: 'Spell Card'
    };
  }
  if (typeStr.includes('trap')) {
    return {
      bg: 'bg-pink-950/40',
      border: 'border-pink-600/40',
      text: 'text-pink-400',
      accent: 'pink',
      label: 'Trap Card'
    };
  }
  if (typeStr.includes('fusion')) {
    return {
      bg: 'bg-purple-950/40',
      border: 'border-purple-600/40',
      text: 'text-purple-400',
      accent: 'purple',
      label: 'Fusion Monster'
    };
  }
  if (typeStr.includes('ritual')) {
    return {
      bg: 'bg-sky-950/40',
      border: 'border-sky-600/40',
      text: 'text-sky-400',
      accent: 'sky',
      label: 'Ritual Monster'
    };
  }
  if (typeStr.includes('synchro')) {
    return {
      bg: 'bg-slate-900',
      border: 'border-slate-300/40',
      text: 'text-slate-200',
      accent: 'slate',
      label: 'Synchro Monster'
    };
  }
  if (typeStr.includes('xyz')) {
    return {
      bg: 'bg-zinc-950',
      border: 'border-zinc-700',
      text: 'text-zinc-200',
      accent: 'zinc',
      label: 'Xyz Monster'
    };
  }
  if (typeStr.includes('link')) {
    return {
      bg: 'bg-blue-950/50',
      border: 'border-blue-600/40',
      text: 'text-blue-400',
      accent: 'blue',
      label: 'Link Monster'
    };
  }
  if (typeStr.includes('spirit')) {
    return {
      bg: 'bg-amber-950/40',
      border: 'border-amber-600/40',
      text: 'text-amber-300',
      accent: 'amber',
      label: 'Spirit Monster'
    };
  }
  if (typeStr.includes('normal')) {
    return {
      bg: 'bg-amber-950/30',
      border: 'border-amber-700/40',
      text: 'text-amber-300',
      accent: 'amber',
      label: 'Normal Monster'
    };
  }
  return {
    bg: 'bg-amber-950/40',
    border: 'border-amber-600/40',
    text: 'text-amber-400',
    accent: 'amber',
    label: card.type || 'Monster Card'
  };
}

/**
 * Formats the bracketed type line and accent classes for CardHoverTooltip and CardPreviewModal.
 */
export function getFormattedCardTypeLine(card: YugiohCard): FormattedCardTypeLine {
  const rawType = card.type || 'Monster Card';
  const typeLower = rawType.toLowerCase();
  const race = card.race || '';

  if (typeLower.includes('spell')) {
    const prefix = race && !rawType.toLowerCase().startsWith(race.toLowerCase()) ? `${race} ` : '';
    return {
      fullType: `${prefix}${rawType}`,
      accentClass: 'text-emerald-300',
      borderClass: 'border-emerald-500/40',
      bgClass: 'bg-emerald-950/50'
    };
  }

  if (typeLower.includes('trap')) {
    const prefix = race && !rawType.toLowerCase().startsWith(race.toLowerCase()) ? `${race} ` : '';
    return {
      fullType: `${prefix}${rawType}`,
      accentClass: 'text-pink-300',
      borderClass: 'border-pink-500/40',
      bgClass: 'bg-pink-950/50'
    };
  }

  const fullMonsterType = race ? `${race} / ${rawType}` : rawType;

  if (typeLower.includes('xyz')) {
    return {
      fullType: fullMonsterType,
      accentClass: 'text-zinc-200',
      borderClass: 'border-zinc-500/50',
      bgClass: 'bg-zinc-900/90'
    };
  }
  if (typeLower.includes('synchro')) {
    return {
      fullType: fullMonsterType,
      accentClass: 'text-slate-100',
      borderClass: 'border-slate-400/50',
      bgClass: 'bg-slate-800/80'
    };
  }
  if (typeLower.includes('fusion')) {
    return {
      fullType: fullMonsterType,
      accentClass: 'text-purple-300',
      borderClass: 'border-purple-500/40',
      bgClass: 'bg-purple-950/50'
    };
  }
  if (typeLower.includes('link')) {
    return {
      fullType: fullMonsterType,
      accentClass: 'text-sky-300',
      borderClass: 'border-sky-500/40',
      bgClass: 'bg-sky-950/50'
    };
  }
  if (typeLower.includes('ritual')) {
    return {
      fullType: fullMonsterType,
      accentClass: 'text-blue-300',
      borderClass: 'border-blue-500/40',
      bgClass: 'bg-blue-950/50'
    };
  }
  if (typeLower.includes('pendulum')) {
    return {
      fullType: fullMonsterType,
      accentClass: 'text-teal-300',
      borderClass: 'border-teal-500/40',
      bgClass: 'bg-teal-950/50'
    };
  }

  return {
    fullType: fullMonsterType,
    accentClass: 'text-amber-300',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-950/40'
  };
}
