import React, { useState, useEffect, useMemo, useRef } from 'react';
import { YugiohCard } from '../types/card';
import {
  RelevantCardRecommendation,
  SynergyBadgeType,
  getRuleBasedRelevantCards,
  getAiSuggestedRelevantCards
} from '../services/relevantCardsService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleFavorite } from '../store/slices/historySlice';
import { setCurrentCard, setSimilarTargetCard } from '../store/slices/cardsSlice';
import { CardHoverTooltip } from './CardHoverTooltip';
import { CardPreviewModal } from './CardPreviewModal';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface RelevantCardsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCard: YugiohCard;
  onSelectCard: (card: YugiohCard) => void;
}

function getBadgeStyle(badgeType: SynergyBadgeType): string {
  switch (badgeType) {
    case 'mention':
      return 'bg-amber-500/20 text-amber-300 border-amber-400/50';
    case 'archetype':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50';
    case 'ai':
      return 'bg-purple-500/25 text-purple-200 border-purple-400/60 shadow-xs shadow-purple-950/60';
    case 'stat':
    default:
      return 'bg-sky-500/20 text-sky-300 border-sky-400/50';
  }
}

export const RelevantCardsSheet: React.FC<RelevantCardsSheetProps> = ({
  isOpen,
  onClose,
  sourceCard,
  onSelectCard
}) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.history.favorites);
  const history = useAppSelector((state) => state.history.history);
  const similarTargetCard = useAppSelector((state) => state.cards.similarTargetCard);

  // The current card at index 0 of our history
  const historyZeroCard = history.length > 0 ? history[0] : sourceCard;
  // The active card being inspected in the Similar Cards window
  const activeCard = similarTargetCard ?? sourceCard;
  // Whether we are inspecting a card different from the current card at index 0 of history
  const isInspectingNonCurrentCard = activeCard.id !== historyZeroCard.id;

  // "Include Archetypal cards" is ON (true) by default
  const [includeArchetype, setIncludeArchetype] = useState(true);
  // "Include AI Suggested Synergies" is OFF (false) by default
  const [includeAiSynergies, setIncludeAiSynergies] = useState(false);

  // Incremented whenever either toggle button is clicked so the visible card pool reloads with new similar cards
  const [poolRefreshSeed, setPoolRefreshSeed] = useState(0);

  const [ruleBasedCards, setRuleBasedCards] = useState<RelevantCardRecommendation[]>([]);
  const [aiCards, setAiCards] = useState<RelevantCardRecommendation[]>([]);
  const [isLoadingRuleBased, setIsLoadingRuleBased] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [hoveredCard, setHoveredCard] = useState<YugiohCard | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [previewItem, setPreviewItem] = useState<RelevantCardRecommendation | null>(null);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // Keep latest activeCard in a ref so effects keyed on activeCard.id don't re-run on parent re-renders
  const activeCardRef = useRef<YugiohCard>(activeCard);
  activeCardRef.current = activeCard;

  // Support desktop browser back arrow & mobile back button
  useModalBackHandler(isOpen, onClose);

  // Animate top-down drawer entrance and exit
  useEffect(() => {
    let raf1: number;
    let raf2: number;
    let timer: number;

    if (isOpen) {
      setShouldRender(true);
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      setHoveredCard(null);
      setHoveredRect(null);
      setPreviewItem(null);
      timer = window.setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  // Close on Escape key (only when preview modal is not open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !previewItem) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, previewItem]);

  // Reset AI cards state when activeCard.id changes
  useEffect(() => {
    setAiCards([]);
    setAiError(null);
    setPoolRefreshSeed(0);
  }, [activeCard.id]);

  // Load/reload rule-based similar cards when sheet opens, activeCard.id changes, or either button is toggled
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingRuleBased(true);

    getRuleBasedRelevantCards(activeCardRef.current, {
      includeArchetype,
      refreshSeed: poolRefreshSeed
    })
      .then((res) => {
        if (!cancelled) {
          setRuleBasedCards(res);
          setIsLoadingRuleBased(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRuleBasedCards([]);
          setIsLoadingRuleBased(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeCard.id, includeArchetype, poolRefreshSeed]);

  // ONLY call Gemini AI when the sheet is open AND "Include AI Suggested Synergies" is checked
  useEffect(() => {
    if (!isOpen || !includeAiSynergies) {
      setIsLoadingAi(false);
      return;
    }

    let cancelled = false;
    setIsLoadingAi(true);
    setAiError(null);

    getAiSuggestedRelevantCards(activeCardRef.current, {
      includeArchetype,
      refreshSeed: poolRefreshSeed
    })
      .then((res) => {
        if (!cancelled) {
          setAiCards(res);
          setIsLoadingAi(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAiError('Could not load AI suggestions right now.');
          setIsLoadingAi(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, includeAiSynergies, includeArchetype, activeCard.id, poolRefreshSeed]);

  // Combine into a single unified grid (respecting both Include Archetypal cards and Include AI Suggested Synergies)
  const unifiedRecommendations = useMemo(() => {
    const sourceArchLower = (activeCard.archetype || '').trim().toLowerCase();
    const filterArch = (item: RelevantCardRecommendation) => {
      if (includeArchetype) return true;
      if (item.badgeType === 'archetype') return false;
      if (sourceArchLower && (item.card.archetype || '').trim().toLowerCase() === sourceArchLower) {
        return false;
      }
      return true;
    };

    const filteredRuleBased = ruleBasedCards.filter(filterArch);

    if (!includeAiSynergies) {
      return filteredRuleBased;
    }

    const filteredAi = aiCards.filter(filterArch);
    const map = new Map<number, RelevantCardRecommendation>();
    for (const item of filteredAi) {
      map.set(item.card.id, item);
    }
    for (const item of filteredRuleBased) {
      if (!map.has(item.card.id)) {
        map.set(item.card.id, item);
      }
    }
    return Array.from(map.values());
  }, [ruleBasedCards, aiCards, includeAiSynergies, includeArchetype, activeCard.archetype]);

  const handleToggleArchetype = () => {
    setHoveredCard(null);
    setHoveredRect(null);
    setIncludeArchetype((prev) => !prev);
    setPoolRefreshSeed((prev) => prev + 1);
  };

  const handleToggleAiSynergies = () => {
    setHoveredCard(null);
    setHoveredRect(null);
    setIncludeAiSynergies((prev) => !prev);
    setPoolRefreshSeed((prev) => prev + 1);
  };

  const handleReturnToCurrentCard = () => {
    setHoveredCard(null);
    setHoveredRect(null);
    setPreviewItem(null);
    dispatch(setSimilarTargetCard(null));
    if (sourceCard.id !== historyZeroCard.id) {
      dispatch(setCurrentCard(historyZeroCard));
    }
  };

  if (!shouldRender) return null;

  const sourceThumb =
    activeCard.card_images?.[0]?.image_url_small ||
    `https://images.ygoprodeck.com/images/cards_small/${activeCard.id}.jpg`;

  const isPoolReloading = isLoadingRuleBased || (includeAiSynergies && isLoadingAi);

  const activeTypeLower = (activeCard.type || '').toLowerCase();
  const isActiveMonster = activeCard.atk !== undefined || activeTypeLower.includes('monster');
  const isActiveXyz = activeTypeLower.includes('xyz');
  const isActiveLink = activeTypeLower.includes('link');

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col justify-start transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Top-Down Slide-In / Slide-Out Window */}
      <div
        className={`relative z-10 w-full max-w-7xl mx-auto bg-slate-900 border-b border-slate-800 rounded-b-2xl shadow-2xl flex flex-col max-h-[86vh] sm:max-h-[82vh] transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Top Header */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex flex-col gap-2.5 shrink-0 bg-slate-950/95">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-4">
            {/* Top Row on Mobile/Tablet: Title, Return to Current Card Button & Mobile Close Button */}
            <div className="flex items-start sm:items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 font-bold text-sm select-none transition-colors ${
                    isInspectingNonCurrentCard
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                  aria-hidden="true"
                >
                  ❖
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h3
                      className={`text-sm sm:text-lg font-bold whitespace-nowrap transition-colors ${
                        isInspectingNonCurrentCard ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      Similar Cards
                    </h3>
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-bold border px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                        isInspectingNonCurrentCard
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {unifiedRecommendations.length}{' '}
                      <span className="hidden sm:inline">
                        {unifiedRecommendations.length === 1 ? 'card' : 'cards'}
                      </span>
                    </span>

                    {/* Button next to "Similar Cards" text to return display to history[0] */}
                    {isInspectingNonCurrentCard && (
                      <button
                        type="button"
                        onClick={handleReturnToCurrentCard}
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 hover:text-white border border-rose-500/50 hover:border-rose-400 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                        title={`Return Similar Cards display to current card (${historyZeroCard.name})`}
                      >
                        <span className="text-xs leading-none" aria-hidden="true">
                          ↺
                        </span>
                        <span>Return to Current Card</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-0.5">
                    <span>Synergies &amp; support for</span>
                    <span
                      className={`font-semibold truncate transition-colors ${
                        isInspectingNonCurrentCard ? 'text-rose-300' : 'text-amber-300'
                      }`}
                    >
                      {activeCard.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button on Mobile / Tablet */}
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden px-2 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer shrink-0 text-sm leading-none font-bold"
                title="Close Similar Cards window"
                aria-label="Close Similar Cards window"
              >
                ✕
              </button>
            </div>

            {/* Right Controls: Responsive "Include Archetypal cards" + "Include AI Suggested Synergies" + Desktop Close Button */}
            <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 shrink-0 w-full lg:w-auto lg:ml-auto">
              {/* Button 1: Include Archetypal cards (ON by default) */}
              <button
                type="button"
                role="checkbox"
                aria-checked={includeArchetype}
                onClick={handleToggleArchetype}
                className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
                  includeArchetype
                    ? 'bg-emerald-950/60 border-emerald-400/70 text-emerald-200 shadow-sm shadow-emerald-950/50'
                    : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 text-slate-300 hover:text-white'
                }`}
                title="Toggle archetypal cards on or off and reload the similar cards pool"
              >
                <span
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center border text-[10px] sm:text-[11px] leading-none transition-colors shrink-0 ${
                    includeArchetype
                      ? 'bg-emerald-500 border-emerald-300 text-slate-950 font-extrabold'
                      : 'bg-slate-950 border-slate-600 text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="truncate sm:hidden">Archetypal Cards</span>
                <span className="hidden sm:inline whitespace-nowrap">Include Archetypal cards</span>
              </button>

              {/* Button 2: Include AI Suggested Synergies (OFF by default) */}
              <button
                type="button"
                role="checkbox"
                aria-checked={includeAiSynergies}
                onClick={handleToggleAiSynergies}
                className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
                  includeAiSynergies
                    ? 'bg-purple-950/60 border-purple-400/70 text-purple-200 shadow-sm shadow-purple-950/50'
                    : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 text-slate-300 hover:text-white'
                }`}
                title="When enabled, queries Gemini AI for tactical card synergies and reloads the similar cards pool"
              >
                <span
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center border text-[10px] sm:text-[11px] leading-none transition-colors shrink-0 ${
                    includeAiSynergies
                      ? 'bg-purple-500 border-purple-300 text-slate-950 font-extrabold'
                      : 'bg-slate-950 border-slate-600 text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span
                  className={`text-[11px] sm:text-xs leading-none shrink-0 ${
                    includeAiSynergies ? 'text-purple-300' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                >
                  ✦
                </span>
                <span className="truncate sm:hidden">AI Synergies</span>
                <span className="hidden sm:inline whitespace-nowrap">Include AI Suggested Synergies</span>
                {isLoadingAi && (
                  <span
                    className="inline-block text-purple-300 animate-spin text-xs leading-none shrink-0"
                    aria-hidden="true"
                  >
                    ⟳
                  </span>
                )}
              </button>

              {/* Close Button on Desktop */}
              <button
                type="button"
                onClick={onClose}
                className="hidden lg:inline-flex px-2 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer shrink-0 text-sm leading-none font-bold ml-auto sm:ml-0"
                title="Close Similar Cards window"
                aria-label="Close Similar Cards window"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Active Source Card Mini Context Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={sourceThumb}
                alt={activeCard.name}
                referrerPolicy="no-referrer"
                className={`w-6 h-8 object-contain rounded border shrink-0 ${
                  isInspectingNonCurrentCard ? 'border-rose-500/60' : 'border-slate-700'
                }`}
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-md border font-semibold text-[11px] ${
                    isInspectingNonCurrentCard
                      ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  {activeCard.name}
                </span>
                {activeCard.archetype && (
                  <span
                    className={`px-2 py-0.5 rounded-md border font-medium text-[11px] ${
                      includeArchetype
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
                    }`}
                  >
                    Archetype: {activeCard.archetype}
                  </span>
                )}
                {activeCard.attribute && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium text-[11px]">
                    {activeCard.attribute}
                  </span>
                )}
                {activeCard.race && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium text-[11px]">
                    {activeCard.race}
                  </span>
                )}
                {isActiveMonster && (activeCard.level !== undefined || activeCard.linkval !== undefined) && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-300 font-mono font-medium text-[11px]">
                    {isActiveXyz
                      ? `Rank ${activeCard.level}`
                      : isActiveLink
                      ? `LINK-${activeCard.linkval ?? activeCard.level}`
                      : `Lv. ${activeCard.level}`}
                  </span>
                )}
                {isActiveMonster && (activeCard.atk !== undefined || activeCard.def !== undefined) && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono font-medium text-[11px]">
                    ATK {activeCard.atk !== undefined && activeCard.atk < 0 ? '?' : (activeCard.atk ?? '-')}
                    {!isActiveLink && activeCard.def !== undefined && (
                      <> / DEF {activeCard.def < 0 ? '?' : activeCard.def}</>
                    )}
                  </span>
                )}
              </div>
            </div>

            {isLoadingAi && includeAiSynergies ? (
              <span className="text-[11px] text-purple-300 font-medium flex items-center gap-1.5">
                <span className="inline-block animate-spin">⟳</span>
                <span>Loading AI synergy recommendations...</span>
              </span>
            ) : aiError && includeAiSynergies ? (
              <span className="text-[11px] text-amber-300">{aiError}</span>
            ) : null}
          </div>
        </div>

        {/* Unified Grid of Similar Cards */}
        <div
          onScroll={() => {
            if (hoveredCard) {
              setHoveredCard(null);
              setHoveredRect(null);
            }
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6"
        >
          {isPoolReloading && unifiedRecommendations.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
              <span className="text-2xl text-amber-400 animate-spin leading-none" aria-hidden="true">
                ⟳
              </span>
              <p className="text-sm">Reloading similar cards pool...</p>
            </div>
          ) : unifiedRecommendations.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-500 gap-2">
              <span className="text-3xl text-slate-700 leading-none" aria-hidden="true">
                ❖
              </span>
              <p className="text-sm font-semibold text-slate-300">
                No matching similar cards found for {activeCard.name}
              </p>
              <p className="text-xs text-slate-400">
                Try enabling &ldquo;Include Archetypal cards&rdquo; or &ldquo;Include AI Suggested Synergies&rdquo; above.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5 transition-opacity duration-200 ${
                isPoolReloading ? 'opacity-60' : 'opacity-100'
              }`}
            >
              {unifiedRecommendations.map((item) => {
                const { card, badge, badgeType, reason, isAiSuggested } = item;
                const isFav = favorites.includes(card.id);
                const imageUrl =
                  card.card_images?.[0]?.image_url_small ||
                  `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`;

                return (
                  <div
                    key={`${card.id}-${poolRefreshSeed}`}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={(e) => {
                      setHoveredCard(card);
                      setHoveredRect(e.currentTarget.getBoundingClientRect());
                    }}
                    onMouseLeave={() => {
                      setHoveredCard((prev) => (prev?.id === card.id ? null : prev));
                      setHoveredRect(null);
                    }}
                    onClick={() => {
                      setHoveredCard(null);
                      setHoveredRect(null);
                      setPreviewItem(item);
                    }}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setHoveredCard(null);
                        setHoveredRect(null);
                        setPreviewItem(item);
                      }
                    }}
                    className={`group flex flex-col items-center p-2 rounded-xl text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      isAiSuggested
                        ? 'bg-purple-950/25 hover:bg-slate-800 border border-purple-500/40 hover:border-purple-400 shadow-sm'
                        : 'bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 shadow-sm'
                    }`}
                  >
                    {/* Card Art Portrait */}
                    <div className="relative w-full aspect-[3/4.4] overflow-hidden rounded-lg bg-slate-950 border border-slate-800 group-hover:border-amber-400/80 transition-all flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt={card.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-104 transition-transform duration-200"
                        loading="lazy"
                      />

                      {/* Favorite Heart Button (Unicode Heart) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(toggleFavorite({ id: card.id, card }));
                        }}
                        className={`absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-md text-xs leading-none ${
                          isFav
                            ? 'bg-red-950/90 text-red-400 border border-red-500/50 hover:bg-red-900 shadow-red-950/50 scale-105'
                            : 'bg-slate-950/80 text-slate-400 hover:text-red-400 border border-slate-700/70 hover:border-red-400/50 hover:bg-slate-900'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        aria-label={
                          isFav
                            ? `Remove ${card.name} from favorites`
                            : `Add ${card.name} to favorites`
                        }
                      >
                        <span aria-hidden="true">{isFav ? '♥' : '♡'}</span>
                      </button>

                      {/* Synergy Badge Pill */}
                      <div
                        className={`absolute bottom-1.5 inset-x-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md text-center truncate flex items-center justify-center gap-1 ${getBadgeStyle(
                          badgeType
                        )}`}
                      >
                        {isAiSuggested && (
                          <span className="text-[10px] leading-none shrink-0" aria-hidden="true">
                            ✦
                          </span>
                        )}
                        <span className="truncate">{badge}</span>
                      </div>
                    </div>

                    {/* Card Name */}
                    <p className="mt-2 text-xs font-semibold text-slate-200 group-hover:text-amber-300 line-clamp-1 text-center w-full leading-snug">
                      {card.name}
                    </p>

                    {/* Concise Synergy Reason */}
                    <p
                      className="mt-0.5 text-[10px] text-slate-400 line-clamp-2 text-center w-full leading-tight"
                      title={reason}
                    >
                      {reason}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Footer with Bottom-Left Gemini AI Disclaimer */}
        <div className="px-4 py-2.5 sm:px-6 border-t border-slate-800/90 bg-slate-950/95 rounded-b-2xl flex items-center justify-between gap-3 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-purple-400 text-xs leading-none" aria-hidden="true">
              ✦
            </span>
            <span>AI Suggestion is powered by Gemini AI.</span>
          </div>
          <span className="hidden sm:inline text-slate-500">
            Click any card to preview details
          </span>
        </div>
      </div>

      {/* Desktop Floating Hover Tooltip */}
      <CardHoverTooltip card={previewItem ? null : hoveredCard} anchorRect={hoveredRect} />

      {/* Quick-Preview Window when a Card is Clicked */}
      <CardPreviewModal
        card={previewItem?.card ?? null}
        synergyBadge={previewItem?.badge}
        synergyReason={previewItem?.reason}
        isAiSuggested={previewItem?.isAiSuggested}
        onClose={() => setPreviewItem(null)}
        onSelectCard={(selected) => {
          setPreviewItem(null);
          dispatch(setSimilarTargetCard(null));
          onSelectCard(selected);
          onClose();
        }}
        onViewSimilarCards={(selected) => {
          setPreviewItem(null);
          dispatch(setSimilarTargetCard(selected));
        }}
      />
    </div>
  );
};
