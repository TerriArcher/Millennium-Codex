import React, { useEffect, useState, useRef } from 'react';
import { YugiohCard } from '../types/card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addCardToHistory, toggleFavorite } from '../store/slices/historySlice';
import { recordNewDraw, setCurrentCard } from '../store/slices/cardsSlice';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface CardPreviewModalProps {
  card: YugiohCard | null;
  onClose: () => void;
  onSelectCard: (card: YugiohCard) => void;
  onViewSimilarCards?: (card: YugiohCard) => void;
  isCurrentCard?: boolean;
  synergyBadge?: string;
  synergyReason?: string;
  isAiSuggested?: boolean;
}

function getFormattedCardTypeLine(card: YugiohCard): {
  fullType: string;
  accentClass: string;
} {
  const rawType = card.type || 'Monster Card';
  const typeLower = rawType.toLowerCase();
  const race = card.race || '';

  if (typeLower.includes('spell')) {
    const prefix = race && !rawType.toLowerCase().startsWith(race.toLowerCase()) ? `${race} ` : '';
    return {
      fullType: `${prefix}${rawType}`,
      accentClass: 'text-emerald-300'
    };
  }

  if (typeLower.includes('trap')) {
    const prefix = race && !rawType.toLowerCase().startsWith(race.toLowerCase()) ? `${race} ` : '';
    return {
      fullType: `${prefix}${rawType}`,
      accentClass: 'text-pink-300'
    };
  }

  const fullMonsterType = race ? `${race} / ${rawType}` : rawType;

  if (typeLower.includes('xyz')) {
    return { fullType: fullMonsterType, accentClass: 'text-zinc-200' };
  }
  if (typeLower.includes('synchro')) {
    return { fullType: fullMonsterType, accentClass: 'text-slate-100' };
  }
  if (typeLower.includes('fusion')) {
    return { fullType: fullMonsterType, accentClass: 'text-purple-300' };
  }
  if (typeLower.includes('link')) {
    return { fullType: fullMonsterType, accentClass: 'text-sky-300' };
  }
  if (typeLower.includes('ritual')) {
    return { fullType: fullMonsterType, accentClass: 'text-blue-300' };
  }
  if (typeLower.includes('pendulum')) {
    return { fullType: fullMonsterType, accentClass: 'text-teal-300' };
  }

  return { fullType: fullMonsterType, accentClass: 'text-amber-300' };
}

export const CardPreviewModal: React.FC<CardPreviewModalProps> = ({
  card,
  onClose,
  onSelectCard,
  onViewSimilarCards,
  isCurrentCard = false,
  synergyBadge,
  synergyReason,
  isAiSuggested = false
}) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.history.favorites);

  const [renderedCard, setRenderedCard] = useState<YugiohCard | null>(card);
  const [isVisible, setIsVisible] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Support mobile hardware back button & desktop browser back arrow via centralized stack hook
  useModalBackHandler(Boolean(card), onClose);

  // Sync rendered card and animate open/close
  useEffect(() => {
    let raf1: number;
    let raf2: number;
    let timer: number;

    if (card) {
      setRenderedCard(card);
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      timer = window.setTimeout(() => {
        setRenderedCard(null);
      }, 200);
    }

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [card]);

  // Capture Escape key before parent sheet so Escape only closes the preview window first
  useEffect(() => {
    if (!card) return;

    const handleKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.stopImmediatePropagation();
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDownCapture, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDownCapture, true);
    };
  }, [card]);

  if (!renderedCard) return null;

  const isFav = favorites.includes(renderedCard.id);
  const smallImageUrl =
    renderedCard.card_images?.[0]?.image_url_small ||
    `https://images.ygoprodeck.com/images/cards_small/${renderedCard.id}.jpg`;

  const typeLower = (renderedCard.type || '').toLowerCase();
  const isMonster = renderedCard.atk !== undefined || typeLower.includes('monster');
  const isNormalMonster =
    isMonster &&
    (typeLower.includes('normal') ||
      (renderedCard.humanReadableCardType || '').toLowerCase().includes('normal') ||
      (renderedCard.frameType || '').toLowerCase().includes('normal'));
  const isXyz = typeLower.includes('xyz');
  const isLink = typeLower.includes('link');
  const hasScale =
    typeof renderedCard.scale === 'number' && !isNaN(renderedCard.scale) && renderedCard.scale >= 0;

  const { fullType, accentClass } = getFormattedCardTypeLine(renderedCard);

  // Extract TCGplayer price
  const rawPrice = renderedCard.card_prices?.[0]?.tcgplayer_price;
  const tcgPrice =
    rawPrice && rawPrice !== '0.00' && rawPrice !== '0'
      ? rawPrice.startsWith('$')
        ? rawPrice.slice(1)
        : rawPrice
      : renderedCard.card_prices?.[0]?.cardmarket_price || '0.99';

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-preview-modal-title"
    >
      {/* Tappable / Clickable Backdrop to Close */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Responsive Modal Window */}
      <div
        className={`relative z-10 w-full max-w-2xl max-h-[88vh] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden transform transition-transform duration-200 ease-out ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner with Only the Back Button */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-950/95 border-b border-slate-800 flex items-center justify-start gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Go back to card list"
            aria-label="Go back to card list"
          >
            <span className="text-sm leading-none" aria-hidden="true">
              ←
            </span>
            <span>Back</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
          {/* Upper Section: Small Card Image + "Select Card" on Left, Relevant Card Information on Right */}
          <div className="grid grid-cols-[124px_1fr] sm:grid-cols-[156px_1fr] gap-4 sm:gap-6 items-start">
            {/* Left Column: Small Card Option + "Select Card" Button Below */}
            <div className="flex flex-col items-stretch gap-2.5 shrink-0">
              <div className="relative w-full aspect-[3/4.4] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg flex items-center justify-center">
                <img
                  src={smallImageUrl}
                  alt={renderedCard.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* "Select Card" Button Directly Below Card Image */}
              <button
                type="button"
                onClick={() => {
                  dispatch(recordNewDraw());
                  dispatch(setCurrentCard(renderedCard));
                  dispatch(addCardToHistory(renderedCard));
                  onSelectCard(renderedCard);
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {isCurrentCard && (
                  <span className="text-xs leading-none" aria-hidden="true">
                    ✓
                  </span>
                )}
                <span>Select Card</span>
              </button>
            </div>

            {/* Right Column: Card's Relevant Information */}
            <div className="flex flex-col gap-3 min-w-0">
              {/* Card Name + Round Favorite Button & Type + TCGplayer Price */}
              <div>
                <div className="flex items-start justify-between gap-2.5">
                  <h3
                    id="card-preview-modal-title"
                    className="text-base sm:text-xl font-extrabold font-display text-white leading-snug break-words flex-1 min-w-0"
                  >
                    {renderedCard.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => dispatch(toggleFavorite({ id: renderedCard.id, card: renderedCard }))}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer shrink-0 ${
                      isFav
                        ? 'bg-red-950/80 text-red-400 hover:text-red-300 border-red-500/50 hover:bg-red-900/80 shadow-xs shadow-red-950/50'
                        : 'bg-slate-950/90 text-slate-400 hover:text-red-400 border-slate-800 hover:border-red-500/40 hover:bg-slate-800/80'
                    }`}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <span className="text-base leading-none" aria-hidden="true">
                      {isFav ? '♥' : '♡'}
                    </span>
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <p className={`text-xs sm:text-sm font-semibold ${accentClass}`}>
                    [{fullType}]
                  </p>
                  {tcgPrice && (
                    <a
                      href={`https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(renderedCard.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`TCGplayer Market Price: $${tcgPrice} (click to view listing on TCGplayer)`}
                      className="shrink-0 h-6 text-[11px] sm:text-xs font-semibold px-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 transition-all duration-200 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      <span className="text-[9px] leading-none font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                        TCG
                      </span>
                      <span className="font-mono font-bold text-emerald-400 tabular-nums">
                        ${tcgPrice}
                      </span>
                    </a>
                  )}
                </div>
              </div>

              {/* Structured Card Attributes & Stats */}
              <div className="flex flex-col gap-2 text-xs sm:text-sm border-t border-slate-800/90 pt-2.5">
                {/* Attribute & Level / Rank / Link / Scale Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-slate-300">
                  {renderedCard.attribute && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Attribute:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {renderedCard.attribute}
                      </span>
                    </div>
                  )}

                  {isMonster && (renderedCard.level !== undefined || renderedCard.linkval !== undefined) && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">
                        {isXyz ? 'Rank:' : isLink ? 'Link Rating:' : 'Level:'}
                      </span>
                      <span className="font-mono font-bold text-amber-300 tabular-nums">
                        {!isLink && (
                          <span className="mr-1 text-amber-400" aria-hidden="true">
                            ★
                          </span>
                        )}
                        {isXyz
                          ? renderedCard.level
                          : isLink
                          ? `LINK-${renderedCard.linkval ?? renderedCard.level}`
                          : renderedCard.level}
                      </span>
                    </div>
                  )}

                  {hasScale && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Pendulum Scale:</span>
                      <span className="font-mono font-bold text-teal-300 tabular-nums">
                        ◆ {renderedCard.scale} / {renderedCard.scale}
                      </span>
                    </div>
                  )}
                </div>

                {/* Archetype & Link Markers (if present) */}
                {renderedCard.archetype && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium shrink-0">Archetype:</span>
                    <span className="font-semibold text-emerald-300 truncate">
                      {renderedCard.archetype}
                    </span>
                  </div>
                )}

                {isLink && renderedCard.linkmarkers && renderedCard.linkmarkers.length > 0 && (
                  <div className="flex items-start gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium shrink-0">Arrows:</span>
                    <span className="text-sky-300 font-medium">
                      {renderedCard.linkmarkers.join(' · ')}
                    </span>
                  </div>
                )}

                {/* ATK / DEF Stats for Monsters */}
                {isMonster && (renderedCard.atk !== undefined || renderedCard.def !== undefined) && (
                  <div className="flex flex-wrap items-center gap-4 pt-1 font-mono font-bold text-xs sm:text-sm tabular-nums">
                    {renderedCard.atk !== undefined && (
                      <div className="flex items-center gap-1.5 text-red-300">
                        <span className="text-red-400" aria-hidden="true">
                          ⚔
                        </span>
                        <span>ATK / {renderedCard.atk < 0 ? '?' : renderedCard.atk}</span>
                      </div>
                    )}
                    {renderedCard.def !== undefined && !isLink && (
                      <div className="flex items-center gap-1.5 text-blue-300">
                        <span className="text-blue-400" aria-hidden="true">
                          🛡
                        </span>
                        <span>DEF / {renderedCard.def < 0 ? '?' : renderedCard.def}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Synergy Context (when opened from Similar Cards) */}
                {(synergyBadge || synergyReason) && (
                  <div className="mt-1 pt-2 border-t border-slate-800/80 flex flex-col gap-1">
                    {synergyBadge && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        {isAiSuggested && (
                          <span className="text-purple-300" aria-hidden="true">
                            ✦
                          </span>
                        )}
                        <span>{synergyBadge}</span>
                      </div>
                    )}
                    {synergyReason && (
                      <p className="text-xs text-slate-300 leading-relaxed">{synergyReason}</p>
                    )}
                  </div>
                )}

                {/* "Similar Cards" Button in the Right-Hand Card Details Column */}
                {onViewSimilarCards && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onViewSimilarCards(renderedCard)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap"
                      title={`View Similar Cards for ${renderedCard.name}`}
                    >
                      <span className="text-amber-400 leading-none" aria-hidden="true">
                        ❖
                      </span>
                      <span>Similar Cards</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lower Body Section: Card Text / Description */}
          <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 tracking-wide">
              {isNormalMonster ? 'Card Lore / Flavor Text' : 'Card Text / Effect'}
            </h4>
            <div
              className={`rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                isNormalMonster ? 'italic text-amber-100/90' : 'text-slate-200'
              }`}
            >
              {renderedCard.desc || 'No card description available.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
