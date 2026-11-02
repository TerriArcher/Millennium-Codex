import React, { useState, useEffect, useRef } from 'react';
import { YugiohCard, CardFilterState } from '../types/card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setIsSimilarSheetOpen,
  setSimilarTargetCard
} from '../store/slices/cardsSlice';
import { setFilterField } from '../store/slices/filtersSlice';
import { toggleFavorite } from '../store/slices/historySlice';
import { HighlightedCardText, KeywordDefinition } from '../utils/cardTextParser';
import {
  getCardFrameTheme,
  getFormattedTcgPrice,
  getCardYgoProDeckUrl
} from '../utils/cardFormatters';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Bookmark,
  Tag,
  Heart,
  AlertCircle
} from 'lucide-react';
import { RelevantCardsSheet } from './RelevantCardsSheet';
import { CardCarousel3D } from './card-display/CardCarousel3D';
import { CardStatsGrid } from './card-display/CardStatsGrid';
import { CardSetsSection } from './card-display/CardSetsSection';

interface CardDisplayProps {
  card: YugiohCard;
  onFilterNotification?: (message: string) => void;
  isLoading?: boolean;
  history?: YugiohCard[];
  onSelectCard?: (card: YugiohCard) => void;
}

// Determine monster super type if any
function detectSuperType(type?: string): string | undefined {
  if (!type) return undefined;
  const t = type.toLowerCase();
  if (t.includes('link')) return 'Link';
  if (t.includes('xyz')) return 'XYZ';
  if (t.includes('synchro')) return 'Synchro';
  if (t.includes('ritual')) return 'Ritual';
  if (t.includes('pendulum')) return 'Pendulum';
  if (t.includes('fusion')) return 'Fusion';
  if (t.includes('spirit')) return 'Spirit';
  if (t.includes('toon')) return 'Toon';
  if (t.includes('gemini')) return 'Gemini';
  if (t.includes('union')) return 'Union';
  return undefined;
}

// Dynamically scale card name font size based on character length
function getCardNameSizeClass(name: string): string {
  const len = (name || '').length;
  if (len <= 22) {
    return 'text-lg sm:text-2xl leading-tight';
  }
  if (len <= 34) {
    return 'text-base sm:text-xl leading-snug';
  }
  if (len <= 48) {
    return 'text-sm sm:text-base leading-snug';
  }
  return 'text-xs sm:text-sm leading-tight';
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  onFilterNotification,
  isLoading = false,
  history = [],
  onSelectCard
}) => {
  const dispatch = useAppDispatch();
  const activeFilters = useAppSelector((state) => state.filters);
  const favorites = useAppSelector((state) => state.history.favorites);
  const isSimilarSheetOpen = useAppSelector((state) => state.cards.isSimilarSheetOpen);
  const isFavorite = favorites.includes(card.id);

  const [copied, setCopied] = useState(false);
  const [keywordFeedback, setKeywordFeedback] = useState<string | null>(null);
  const [isFeedbackAlert, setIsFeedbackAlert] = useState(false);
  const feedbackTimerRef = useRef<number | null>(null);

  // Smoothly animate card info container on card change
  const [infoEntered, setInfoEntered] = useState(true);
  useEffect(() => {
    setInfoEntered(false);
    const raf = window.requestAnimationFrame(() => {
      setInfoEntered(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [card.id]);

  // Cycle new card name in from the top and old card name out the bottom
  const [displayedName, setDisplayedName] = useState(card.name);
  const [exitingName, setExitingName] = useState<string | null>(null);
  const [nameCyclePhase, setNameCyclePhase] = useState<'idle' | 'start' | 'animating'>('idle');
  const prevNameRef = useRef(card.name);

  useEffect(() => {
    if (card.name === prevNameRef.current) return;

    const oldName = prevNameRef.current;
    prevNameRef.current = card.name;
    setExitingName(oldName);
    setDisplayedName(card.name);
    setNameCyclePhase('start');

    let raf1: number;
    let raf2: number;
    let doneTimer: number;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setNameCyclePhase('animating');
      });
    });

    doneTimer = window.setTimeout(() => {
      setExitingName(null);
      setNameCyclePhase('idle');
    }, 320);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(doneTimer);
    };
  }, [card.name]);

  const safeType =
    card.type || (card.atk !== undefined || card.def !== undefined ? 'Effect Monster' : 'Card');
  const typeStr = safeType.toLowerCase();
  const frame = getCardFrameTheme(card);
  const isMonster = card.atk !== undefined || typeStr.includes('monster');
  const isNormalMonster =
    isMonster &&
    (typeStr.includes('normal') ||
      (card.humanReadableCardType || '').toLowerCase().includes('normal') ||
      (card.frameType || '').toLowerCase().includes('normal'));
  const isXyz = typeStr.includes('xyz');
  const isLink = typeStr.includes('link');
  const hasScale = typeof card.scale === 'number' && !isNaN(card.scale) && card.scale >= 0;
  const superType = detectSuperType(card.type);
  const tcgPrice = getFormattedTcgPrice(card);
  const ygoProDeckUrl = getCardYgoProDeckUrl(card);

  const handleCopyName = () => {
    navigator.clipboard.writeText(card.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFav = () => {
    dispatch(toggleFavorite({ id: card.id, card }));
  };

  const showFilterFeedback = (msg: string, isAlert = false) => {
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    setKeywordFeedback(msg);
    setIsFeedbackAlert(isAlert);
    if (isAlert) {
      onFilterNotification?.(msg);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setKeywordFeedback(null);
      setIsFeedbackAlert(false);
    }, 3200);
  };

  const isCriterionSelected = (key: keyof CardFilterState, value: any): boolean => {
    if (value === undefined || value === null || value === '') return false;
    const current = activeFilters[key];
    return (
      current !== undefined &&
      current !== null &&
      current !== '' &&
      String(current).toLowerCase() === String(value).toLowerCase()
    );
  };

  const handleSelectFilterCriterion = (
    key: keyof CardFilterState,
    value: any,
    displayLabel: string
  ) => {
    if (value === undefined || value === null || value === '') return;

    if (isCriterionSelected(key, value)) {
      dispatch(setFilterField({ key, value: undefined }));
      showFilterFeedback(`Removed ${displayLabel} from filters`, false);
      return;
    }

    dispatch(setFilterField({ key, value }));
    showFilterFeedback(`Added ${displayLabel} to filters`, false);
  };

  const handleSelectKeyword = (def: KeywordDefinition) => {
    handleSelectFilterCriterion(def.filterKey, def.filterValue, def.displayLabel);
  };

  const handleRemoveKeyword = (def: KeywordDefinition) => {
    dispatch(setFilterField({ key: def.filterKey, value: undefined }));
    showFilterFeedback(`Removed ${def.displayLabel} from filters`, false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* 1. TOP: Unified 3D Scrolling Carousel Stage with Main Card Display */}
      <CardCarousel3D
        card={card}
        history={history}
        isLoading={isLoading}
        onSelectCard={onSelectCard}
      />

      {/* 2. UNDERNEATH: Card Text and Details Box */}
      <div
        className={`w-full max-w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xl shadow-slate-950/60 backdrop-blur-sm transition-all duration-300 ease-out ${
          infoEntered ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-1'
        }`}
      >
        {/* Card Name Header & Actions */}
        <div className="flex flex-col gap-3 pb-5 border-b border-slate-800">
          <div className="space-y-3 min-w-0 w-full">
            {/* 1. Consistently Nested Group for Card Type, Archetype, and TCGplayer Price */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 p-1.5 rounded-xl bg-slate-950/75 border border-slate-800/90 w-full">
              <span
                className={`shrink-0 h-7 text-xs font-semibold px-2.5 rounded-lg border inline-flex items-center justify-center transition-all duration-300 ${frame.bg} ${frame.border} ${frame.text} whitespace-nowrap shadow-xs`}
              >
                {frame.label}
              </span>

              {/* CLICKABLE ARCHETYPE BADGE */}
              {card.archetype &&
                (() => {
                  const isArchSelected = isCriterionSelected('archetype', card.archetype);
                  const archLabel = `Archetype: ${card.archetype}`;
                  return (
                    <div
                      onClick={() =>
                        handleSelectFilterCriterion('archetype', card.archetype, archLabel)
                      }
                      title={
                        isArchSelected
                          ? `Click to turn off ${archLabel}`
                          : `Click to turn on "${card.archetype}" archetype filter`
                      }
                      className={`shrink-0 h-7 inline-flex items-center gap-1.5 px-2.5 rounded-lg border text-xs transition-all duration-300 whitespace-nowrap cursor-pointer ${
                        isArchSelected
                          ? 'bg-amber-500/20 text-amber-200 border-amber-400 ring-1 ring-amber-400/40 font-bold shadow-xs'
                          : 'text-slate-300 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-400'
                      }`}
                    >
                      <Bookmark
                        className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                          isArchSelected
                            ? 'text-amber-300 fill-amber-300/30 scale-110'
                            : 'text-amber-400'
                        }`}
                      />
                      <span className="text-slate-400 shrink-0">Archetype:</span>
                      <span className="font-bold text-amber-300 whitespace-nowrap">
                        {card.archetype}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] leading-none font-mono font-bold border shrink-0 ml-0.5 transition-all duration-200 ${
                          isArchSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                            : 'bg-slate-900/90 text-slate-400 border-slate-700/80'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                            isArchSelected
                              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                              : 'bg-slate-600'
                          }`}
                        />
                        <span>{isArchSelected ? 'ON' : 'OFF'}</span>
                      </span>
                    </div>
                  );
                })()}

              {/* TCGPLAYER PRICE BADGE */}
              {tcgPrice && (
                <a
                  href={`https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(
                    card.name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`TCGplayer Market Price: $${tcgPrice} (click to view listing on TCGplayer)`}
                  className="shrink-0 h-7 text-xs font-semibold px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 transition-all duration-300 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <Tag className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[10px] leading-none font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    TCG
                  </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    ${tcgPrice}
                  </span>
                </a>
              )}
            </div>

            {/* 2. Card Name Box + Relocated Similar Cards Button (<= 30% width on right) */}
            <div className="flex items-stretch gap-2.5 w-full">
              <div
                onClick={handleCopyName}
                title={copied ? 'Copied card name!' : 'Click to copy card name to clipboard'}
                className={`group flex-1 min-w-0 h-[5.5rem] sm:h-[5.75rem] flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                  copied
                    ? 'bg-emerald-950/30 border-emerald-400/70 ring-1 ring-emerald-400/30'
                    : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 shrink-0">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium flex items-center gap-1.5 transition-colors truncate">
                    <span>Card Name</span>
                    {copied ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold normal-case tracking-normal">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Copied!</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-amber-300/90 normal-case tracking-normal">
                        <Copy className="w-3 h-3 shrink-0" />
                        <span className="hidden xs:inline">Click to copy</span>
                      </span>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFav();
                    }}
                    className={`p-1.5 -mt-0.5 -mr-0.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 border ${
                      isFavorite
                        ? 'text-red-400 hover:text-red-300 bg-red-950/50 border-red-500/40 scale-105'
                        : 'text-slate-400 hover:text-red-400 bg-slate-900/90 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                    }`}
                    title={isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
                    aria-label={isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isFavorite ? 'fill-red-400 scale-110' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-0.5 flex-1 flex items-center relative overflow-hidden">
                  {exitingName !== null && (
                    <h2
                      aria-hidden="true"
                      className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${getCardNameSizeClass(
                        exitingName
                      )} font-extrabold font-display tracking-tight text-white whitespace-normal break-words line-clamp-2 pointer-events-none ${
                        nameCyclePhase === 'animating'
                          ? 'transition-all duration-300 ease-in-out translate-y-full opacity-0'
                          : 'opacity-100'
                      }`}
                    >
                      {exitingName}
                    </h2>
                  )}
                  <h2
                    className={`w-full ${getCardNameSizeClass(
                      displayedName
                    )} font-extrabold font-display tracking-tight text-white group-hover:text-amber-300 whitespace-normal break-words line-clamp-2 ${
                      nameCyclePhase === 'start'
                        ? '-translate-y-full opacity-0'
                        : nameCyclePhase === 'animating'
                        ? 'transition-all duration-300 ease-in-out translate-y-0 opacity-100'
                        : 'transition-colors duration-200 translate-y-0 opacity-100'
                    }`}
                  >
                    {displayedName}
                  </h2>
                </div>
              </div>

              {/* Relocated View Similar Cards Button (Right of Card Name, <= 30% width) */}
              <button
                type="button"
                onClick={() => {
                  dispatch(setSimilarTargetCard(null));
                  dispatch(setIsSimilarSheetOpen(true));
                }}
                title="View similar and synergistic cards"
                aria-label="View Similar Cards"
                className="w-[27%] sm:w-[23%] max-w-[30%] shrink-0 h-[5.5rem] sm:h-[5.75rem] px-2 py-2 rounded-xl border border-amber-500/40 hover:border-amber-400 bg-slate-950/80 hover:bg-amber-950/35 text-amber-300 hover:text-amber-200 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center shadow-xs group/similar active:scale-98"
              >
                <span
                  className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 group-hover/similar:bg-amber-500/25 group-hover/similar:border-amber-400/60 flex items-center justify-center text-amber-400 text-sm leading-none transition-colors shrink-0"
                  aria-hidden="true"
                >
                  ❖
                </span>
                <span className="text-[11px] sm:text-xs font-bold leading-tight tracking-tight line-clamp-2">
                  Similar Cards
                </span>
              </button>
            </div>
          </div>

          {/* 3. External Links Row Positioned Directly Below Card Name Box */}
          <div className="flex items-center justify-center sm:justify-start gap-2.5 w-full flex-wrap">
            <a
              href={ygoProDeckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs font-semibold text-slate-100 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-600 hover:border-slate-300 rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-black/70 hover:shadow-xl hover:shadow-black/80 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 whitespace-nowrap"
              title="Open direct page on YGOPRODeck in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span>YGOPRODeck</span>
            </a>

            <a
              href={`https://www.yugiohmeta.com/cards/${encodeURIComponent(card.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-950/60 border border-amber-400/80 hover:border-amber-300 rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-black/70 hover:shadow-xl hover:shadow-amber-950/50 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 whitespace-nowrap"
              title="Open card page on Yu-Gi-Oh! Meta in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Yugioh Meta</span>
            </a>
          </div>
        </div>

        {/* Interactive Filter Hint & Alert Banner */}
        <div
          className={`py-2.5 px-3 my-4 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors ${
            keywordFeedback && isFeedbackAlert
              ? 'bg-red-500/15 border border-red-500/40 text-red-200'
              : keywordFeedback
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-300/90'
          }`}
        >
          <div className="flex items-center gap-2">
            {keywordFeedback && isFeedbackAlert ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className={keywordFeedback ? 'font-semibold' : ''}>
              {keywordFeedback
                ? keywordFeedback
                : hasScale
                ? 'Click any attribute, archetype, scale, level, race, ATK, DEF, or keyword to add or remove it from your filters!'
                : isMonster
                ? 'Click any attribute, archetype, level, race, ATK, DEF, or keyword to add or remove it from your filters!'
                : 'Click any property, subtype, archetype, or keyword to add or remove it from your filters!'}
            </span>
          </div>
        </div>

        {/* Interactive Filterable Stats & Combat Stats */}
        <CardStatsGrid
          card={card}
          isMonster={isMonster}
          isXyz={isXyz}
          isLink={isLink}
          hasScale={hasScale}
          safeType={safeType}
          typeStr={typeStr}
          superType={superType}
          isCriterionSelected={isCriterionSelected}
          onSelectFilterCriterion={handleSelectFilterCriterion}
        />

        {/* CARD TEXT / EFFECT BOX WITH INTERACTIVE HIGHLIGHTED KEYWORDS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="uppercase tracking-wider text-slate-400 font-semibold transition-colors duration-200">
              {isMonster
                ? `[ ${card.race || 'Card'} / ${safeType.replace(' Monster', '')} ]`
                : `[ ${typeStr.includes('trap') ? 'Trap Card' : 'Spell Card'} / ${
                    card.race === 'Quick-Play' ? 'Quick' : card.race || 'Normal'
                  } ]`}
            </span>

            {keywordFeedback ? (
              <span
                className={`font-medium text-[11px] px-2 py-0.5 rounded border transition-all duration-200 ${
                  isFeedbackAlert
                    ? 'text-red-300 bg-red-500/15 border-red-500/40'
                    : 'text-amber-300 bg-amber-500/10 border-amber-500/30 animate-pulse'
                }`}
              >
                {keywordFeedback}
              </span>
            ) : isNormalMonster ? (
              <span className="text-[10px] text-amber-400/90 font-medium italic">
                Normal Monster Flavor Text / Lore (no filterable effects)
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 italic">
                Tip: Click highlighted keywords below to add or remove filters
              </span>
            )}
          </div>

          <div
            className={`p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl font-sans text-sm sm:text-base leading-relaxed whitespace-pre-line shadow-inner max-h-72 overflow-y-auto transition-all duration-300 ${
              isNormalMonster ? 'italic text-amber-100/90' : 'text-slate-200'
            }`}
          >
            <HighlightedCardText
              text={card.desc}
              activeFilters={activeFilters}
              onSelectKeyword={handleSelectKeyword}
              onRemoveKeyword={handleRemoveKeyword}
              disabled={isNormalMonster}
            />
          </div>
        </div>

        {/* Metadata, Debut Year, Banlist & Chronological Card Sets */}
        <CardSetsSection card={card} />
      </div>

      {/* Top-Down Similar Cards Sheet */}
      <RelevantCardsSheet
        isOpen={isSimilarSheetOpen}
        onClose={() => dispatch(setIsSimilarSheetOpen(false))}
        sourceCard={card}
        onSelectCard={(selected) => {
          onSelectCard?.(selected);
        }}
      />
    </div>
  );
};
