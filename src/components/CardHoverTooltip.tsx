import React from 'react';
import { YugiohCard } from '../types/card';
import { Star, Swords, Shield } from 'lucide-react';

interface CardHoverTooltipProps {
  card: YugiohCard | null;
  anchorRect: DOMRect | null;
}

function getFormattedCardTypeLine(card: YugiohCard): {
  fullType: string;
  accentClass: string;
  borderClass: string;
  bgClass: string;
} {
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

export const CardHoverTooltip: React.FC<CardHoverTooltipProps> = ({ card, anchorRect }) => {
  if (!card || !anchorRect || typeof window === 'undefined') return null;

  const TOOLTIP_WIDTH = 336;
  const ESTIMATED_HEIGHT = 270;
  const GAP = 14;
  const VIEWPORT_PADDING = 16;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Prefer placing to the right of the hovered card; flip to left if not enough room
  let left = anchorRect.right + GAP;
  if (left + TOOLTIP_WIDTH > vw - VIEWPORT_PADDING) {
    left = anchorRect.left - TOOLTIP_WIDTH - GAP;
  }
  if (left < VIEWPORT_PADDING) {
    left = Math.max(VIEWPORT_PADDING, Math.min(vw - TOOLTIP_WIDTH - VIEWPORT_PADDING, anchorRect.left));
  }

  // Clamp vertical position inside viewport
  let top = anchorRect.top;
  if (top + ESTIMATED_HEIGHT > vh - VIEWPORT_PADDING) {
    top = Math.max(VIEWPORT_PADDING, vh - ESTIMATED_HEIGHT - VIEWPORT_PADDING);
  }
  if (top < VIEWPORT_PADDING) {
    top = VIEWPORT_PADDING;
  }

  const typeLower = (card.type || '').toLowerCase();
  const isMonster = card.atk !== undefined || typeLower.includes('monster');
  const isNormalMonster =
    isMonster &&
    (typeLower.includes('normal') ||
      (card.humanReadableCardType || '').toLowerCase().includes('normal') ||
      (card.frameType || '').toLowerCase().includes('normal'));
  const isXyz = typeLower.includes('xyz');
  const isLink = typeLower.includes('link');
  const hasScale = typeof card.scale === 'number' && !isNaN(card.scale) && card.scale >= 0;

  const { fullType, accentClass, borderClass, bgClass } = getFormattedCardTypeLine(card);

  return (
    <div
      style={{
        left: `${Math.round(left)}px`,
        top: `${Math.round(top)}px`,
        width: `${TOOLTIP_WIDTH}px`
      }}
      className="hidden lg:block fixed z-[80] pointer-events-none select-none transition-opacity duration-150"
      role="tooltip"
    >
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3.5 shadow-2xl shadow-black/90 ring-1 ring-amber-400/20 flex flex-col gap-2">
        {/* 1. Card Name & Attribute */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-800/90 pb-2">
          <h4 className="text-sm font-extrabold font-display text-white leading-snug">
            {card.name}
          </h4>
          {card.attribute && (
            <span className="shrink-0 text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
              {card.attribute}
            </span>
          )}
        </div>

        {/* 2. Level / Rank / Link Rating & Type Classification */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isMonster && (card.level !== undefined || card.linkval !== undefined) && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                isXyz
                  ? 'bg-zinc-900 text-amber-300 border-zinc-600'
                  : isLink
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
            >
              {!isLink && (
                <Star
                  className={`w-3 h-3 ${
                    isXyz ? 'text-amber-300 fill-amber-300' : 'text-amber-400 fill-amber-400'
                  }`}
                />
              )}
              <span>
                {isXyz
                  ? `Rank ${card.level}`
                  : isLink
                  ? `LINK-${card.linkval ?? card.level}`
                  : `Level ${card.level}`}
              </span>
            </span>
          )}

          {hasScale && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-950/70 text-teal-300 border border-teal-500/40">
              <span>Scale {card.scale}</span>
            </span>
          )}

          <span
            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${bgClass} ${borderClass} ${accentClass}`}
          >
            {fullType}
          </span>
        </div>

        {/* 3. Card Description */}
        <div
          className={`text-xs leading-relaxed whitespace-pre-line line-clamp-7 bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 ${
            isNormalMonster ? 'italic text-amber-100/90' : 'text-slate-200'
          }`}
        >
          {card.desc || 'No card description available.'}
        </div>

        {/* 4. Compact ATK / DEF footer for Monsters */}
        {isMonster && (card.atk !== undefined || card.def !== undefined) && (
          <div className="flex items-center justify-end gap-3 pt-0.5 text-[11px] font-mono font-bold">
            {card.atk !== undefined && (
              <span className="inline-flex items-center gap-1 text-red-300">
                <Swords className="w-3 h-3 text-red-400" />
                <span>ATK / {card.atk < 0 ? '?' : card.atk}</span>
              </span>
            )}
            {card.def !== undefined && !isLink && (
              <span className="inline-flex items-center gap-1 text-blue-300">
                <Shield className="w-3 h-3 text-blue-400" />
                <span>DEF / {card.def < 0 ? '?' : card.def}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
