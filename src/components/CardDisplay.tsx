import React, { useState, useEffect, useRef } from 'react';
import { YugiohCard, CardFilterState } from '../types/card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCardAnimating } from '../store/slices/cardsSlice';
import { setFilterField } from '../store/slices/filtersSlice';
import { toggleFavorite } from '../store/slices/historySlice';
import { isCardImagePreloaded, markCardImageLoaded } from '../services/ygoprodeckApi';
import { HighlightedCardText, KeywordDefinition } from '../utils/cardTextParser';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Swords,
  Star,
  Layers,
  Maximize2,
  Bookmark,
  Tag,
  Heart,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';

// Official card-back image from https://ygoprodeck.com/card/15961
const CARD_BACK_IMAGE_URL = 'https://images.ygoprodeck.com/images/cards/149694341.jpg';

interface CardDisplayProps {
  card: YugiohCard;
  onExploreStat?: (statFilter: {
    attribute?: string;
    level?: number;
    race?: string;
    type?: string;
    superType?: string;
    archetype?: string;
    scale?: number;
    atk?: number;
    def?: number;
  }) => void;
  onFilterNotification?: (message: string) => void;
  isLoading?: boolean;
  history?: YugiohCard[];
  onSelectCard?: (card: YugiohCard) => void;
}

// Color schemes matching authentic Yu-Gi-Oh card frames
function getCardFrameDetails(card: YugiohCard) {
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
  const drawCount = useAppSelector((state) => state.cards.drawCount);
  const isCardAnimating = useAppSelector((state) => state.cards.isCardAnimating);
  const isFavorite = favorites.includes(card.id);

  const [copied, setCopied] = useState(false);
  const [loadedCardIds, setLoadedCardIds] = useState<Record<number, boolean>>({});
  const [erroredCardIds, setErroredCardIds] = useState<Record<number, boolean>>({});
  const [showSets, setShowSets] = useState(false);
  const [keywordFeedback, setKeywordFeedback] = useState<string | null>(null);
  const [isFeedbackAlert, setIsFeedbackAlert] = useState(false);
  const feedbackTimerRef = useRef<number | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  // Build effective history list so the active card is always present in the carousel track
  const historyList = history || [];
  const effectiveHistory =
    historyList.length > 0 && historyList.some((c) => c.id === card.id)
      ? historyList
      : [card, ...historyList.filter((c) => c.id !== card.id)];

  const targetIndex = Math.max(
    0,
    effectiveHistory.findIndex((c) => c.id === card.id)
  );

  // Visual carousel index that smoothly steps/scrolls toward targetIndex
  const [visualIndex, setVisualIndex] = useState(targetIndex);
  const lastTargetIndexRef = useRef(targetIndex);

  // Slide-in from right & 3D card-back flip reveal state for new draws
  const lastDrawCountRef = useRef(
    isCardAnimating && drawCount > 0 ? drawCount - 1 : drawCount
  );
  const [revealPhase, setRevealPhase] = useState<
    'idle' | 'sliding-in' | 'face-down' | 'flipping'
  >('idle');
  const [slideInDone, setSlideInDone] = useState(true);

  // Mouse drag & touch swipe state for carousel navigation
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);
  const wheelCooldownRef = useRef(false);

  const isCurrentImageLoaded =
    Boolean(loadedCardIds[card.id]) || isCardImagePreloaded(card.id);
  const isCurrentImageLoading = !isCurrentImageLoaded && !erroredCardIds[card.id];
  const isCurrentImageError = Boolean(erroredCardIds[card.id]);

  // Track mobile viewport (< 640px) so carousel cards stack tightly on mobile without affecting desktop
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 639px)');
    const handleResize = () => setIsMobileView(mql.matches);
    handleResize();
    mql.addEventListener('change', handleResize);
    return () => mql.removeEventListener('change', handleResize);
  }, []);

  // Preload official card-back image on mount
  useEffect(() => {
    const img = new Image();
    img.src = CARD_BACK_IMAGE_URL;
  }, []);

  // Ensure isCardAnimating is cleared if component unmounts mid-animation
  useEffect(() => {
    return () => {
      dispatch(setCardAnimating(false));
    };
  }, [dispatch]);

  // Trigger slide-in from right + face-down state when a new card is drawn
  useEffect(() => {
    if (drawCount !== lastDrawCountRef.current) {
      lastDrawCountRef.current = drawCount;
      lastTargetIndexRef.current = 0;
      setVisualIndex(0);
      setRevealPhase('sliding-in');
      setSlideInDone(false);

      const slideTimer = window.setTimeout(() => {
        setRevealPhase('face-down');
      }, 25);

      const slideDoneTimer = window.setTimeout(() => {
        setSlideInDone(true);
      }, 380);

      return () => {
        window.clearTimeout(slideTimer);
        window.clearTimeout(slideDoneTimer);
      };
    }
  }, [drawCount]);

  // Smoothly scroll/step visualIndex through the carousel when selecting a card on the carousel or in History
  useEffect(() => {
    if (visualIndex === targetIndex) {
      lastTargetIndexRef.current = targetIndex;
      return;
    }

    const diff = targetIndex - visualIndex;
    const dir = diff > 0 ? 1 : -1;
    const absDiff = Math.abs(diff);
    const stepSize = absDiff > 6 ? Math.ceil(absDiff / 6) : 1;
    const nextIdx =
      Math.abs(diff) <= stepSize ? targetIndex : visualIndex + dir * stepSize;

    // Immediately start the first step when targetIndex changes so there is zero input lag
    if (lastTargetIndexRef.current !== targetIndex) {
      lastTargetIndexRef.current = targetIndex;
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        if (rect.top < -40 || rect.bottom > window.innerHeight + 120) {
          stageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      setVisualIndex(nextIdx);
      return;
    }

    // Continue stepping through intermediate cards when scrolling across multiple history items
    const stepTimer = window.setTimeout(() => {
      setVisualIndex(nextIdx);
    }, 135);

    return () => window.clearTimeout(stepTimer);
  }, [targetIndex, visualIndex]);

  // Flip from card-back (180deg) to card-front (0deg) once slide-in finishes and card image is ready
  useEffect(() => {
    if (
      revealPhase === 'face-down' &&
      slideInDone &&
      (!isCurrentImageLoading || isCurrentImageError)
    ) {
      const flipTimer = window.setTimeout(() => {
        setRevealPhase('flipping');
      }, 40);
      return () => window.clearTimeout(flipTimer);
    }
  }, [revealPhase, slideInDone, isCurrentImageLoading, isCurrentImageError]);

  // Fallback safety timer in case an external image takes too long while face-down
  useEffect(() => {
    if (revealPhase === 'face-down' && slideInDone) {
      const maxWaitTimer = window.setTimeout(() => {
        setRevealPhase('flipping');
      }, 4000);
      return () => window.clearTimeout(maxWaitTimer);
    }
  }, [revealPhase, slideInDone]);

  // Mark animation complete only after the 520ms 3D flip transition has finished
  useEffect(() => {
    if (revealPhase === 'flipping') {
      const finishFlipTimer = window.setTimeout(() => {
        setRevealPhase('idle');
        dispatch(setCardAnimating(false));
      }, 540);
      return () => window.clearTimeout(finishFlipTimer);
    }
  }, [revealPhase, dispatch]);

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

  // Smooth count up/down animation for ATK and DEF when adjusted between cards
  const useAnimatedStat = (targetValue: number | undefined, duration = 450) => {
    const [displayVal, setDisplayVal] = useState<number>(
      targetValue !== undefined && targetValue >= 0 ? targetValue : 0
    );
    const [trend, setTrend] = useState<'up' | 'down' | null>(null);
    const prevValRef = useRef<number>(
      targetValue !== undefined && targetValue >= 0 ? targetValue : 0
    );

    useEffect(() => {
      if (targetValue === undefined || targetValue < 0) {
        setTrend(null);
        prevValRef.current = 0;
        setDisplayVal(0);
        return;
      }

      const startVal = prevValRef.current;
      const endVal = targetValue;

      if (startVal === endVal) {
        setDisplayVal(endVal);
        setTrend(null);
        return;
      }

      setTrend(endVal > startVal ? 'up' : 'down');
      let startTime: number | null = null;
      let animationFrameId: number;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic curve
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (endVal - startVal) * eased);
        setDisplayVal(current);

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        } else {
          prevValRef.current = endVal;
          setDisplayVal(endVal);
          setTrend(null);
        }
      };

      animationFrameId = window.requestAnimationFrame(step);
      return () => {
        window.cancelAnimationFrame(animationFrameId);
        prevValRef.current = endVal;
      };
    }, [targetValue, duration]);

    return { displayVal, trend };
  };

  const animatedAtk = useAnimatedStat(card.atk);
  const animatedDef = useAnimatedStat(card.def);

  const safeType = card.type || (card.atk !== undefined || card.def !== undefined ? 'Effect Monster' : 'Card');
  const typeStr = safeType.toLowerCase();
  const frame = getCardFrameDetails(card);
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

  // Extract TCGplayer price
  const rawPrice = card.card_prices?.[0]?.tcgplayer_price;
  const tcgPrice = rawPrice && rawPrice !== '0.00' && rawPrice !== '0'
    ? (rawPrice.startsWith('$') ? rawPrice.slice(1) : rawPrice)
    : (card.card_prices?.[0]?.cardmarket_price || '0.99');

  const safeCurrentIndex = visualIndex;
  const hasPreviousCard = safeCurrentIndex + 1 < effectiveHistory.length;
  const hasNewerCard = safeCurrentIndex > 0;
  const immediatePreviousCard = hasPreviousCard ? effectiveHistory[safeCurrentIndex + 1] : undefined;
  const immediateNewerCard = hasNewerCard ? effectiveHistory[safeCurrentIndex - 1] : undefined;

  // Pointer drag / touch swipe handlers for carousel navigation
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    didSwipeRef.current = false;
    setIsDragging(true);
    setDragOffsetX(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Ignore predominantly vertical scrolling on touch devices
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 15) {
      return;
    }

    if (Math.abs(deltaX) > 8) {
      didSwipeRef.current = true;
    }

    const clampedOffset = Math.max(-140, Math.min(140, deltaX * 0.7));
    setDragOffsetX(clampedOffset);
  };

  const finishDragGesture = (clientX?: number) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = clientX !== undefined ? clientX - dragStartRef.current.x : dragOffsetX / 0.7;
    const SWIPE_THRESHOLD = 42;

    if (deltaX >= SWIPE_THRESHOLD && immediatePreviousCard) {
      onSelectCard?.(immediatePreviousCard);
    } else if (deltaX <= -SWIPE_THRESHOLD && immediateNewerCard) {
      onSelectCard?.(immediateNewerCard);
    }

    dragStartRef.current = null;
    setIsDragging(false);
    setDragOffsetX(0);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishDragGesture(e.clientX);
  };

  const handlePointerCancel = () => {
    dragStartRef.current = null;
    setIsDragging(false);
    setDragOffsetX(0);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Support horizontal trackpad swipe or Shift + mouse wheel across the carousel
    const horizontalDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (Math.abs(horizontalDelta) < 28 || wheelCooldownRef.current) return;

    if (horizontalDelta < 0 && immediatePreviousCard) {
      wheelCooldownRef.current = true;
      onSelectCard?.(immediatePreviousCard);
      window.setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 320);
    } else if (horizontalDelta > 0 && immediateNewerCard) {
      wheelCooldownRef.current = true;
      onSelectCard?.(immediateNewerCard);
      window.setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 320);
    }
  };

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

  // Selecting a filter item in the Card Details box toggles the filter on or off
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

  const isSlidingIn = revealPhase === 'sliding-in';
  const isFaceDown = revealPhase === 'sliding-in' || revealPhase === 'face-down';

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* 1. TOP: Unified 3D Scrolling Carousel Stage with Main Card Display */}
      <div
        ref={stageRef}
        className="relative w-full max-w-4xl mx-auto flex flex-col items-center mb-6"
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={() => {
            if (isDragging) finishDragGesture();
          }}
          onWheel={handleWheel}
          className={`relative w-full flex items-center justify-center min-h-[380px] sm:min-h-[480px] py-3 select-none touch-pan-y ${
            hasPreviousCard || hasNewerCard
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : ''
          }`}
          style={{ perspective: '1150px' }}
        >
          {/* Navigation Arrow: Left (Previous Card in History) */}
          {immediatePreviousCard && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCard?.(immediatePreviousCard);
              }}
              title={`Previous card: ${immediatePreviousCard.name}`}
              aria-label="Previous card in history"
              className="absolute left-1 sm:left-6 z-40 p-2 sm:p-2.5 rounded-full bg-slate-950/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400 shadow-2xl backdrop-blur-md transition-all cursor-pointer group"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Unified 3D Carousel Track: Cards keyed by ID so selecting any card smoothly scrolls it into center */}
          {effectiveHistory.map((itemCard, idx) => {
            const rawOffset = idx - safeCurrentIndex;
            // Keep ±3 mounted so cards entering/leaving the ±2 slots scroll and fade smoothly
            if (Math.abs(rawOffset) > 3) return null;

            const isCenter = rawOffset === 0;
            const isBufferHidden = Math.abs(rawOffset) >= 3;
            const itemImg =
              itemCard.card_images?.[0]?.image_url ||
              itemCard.card_images?.[0]?.image_url_small ||
              `https://images.ygoprodeck.com/images/cards/${itemCard.id}.jpg`;

            const isItemLoaded =
              Boolean(loadedCardIds[itemCard.id]) || isCardImagePreloaded(itemCard.id);
            const isItemError = Boolean(erroredCardIds[itemCard.id]);
            const showItemLoader = !isItemLoaded && !isItemError;
            const itemFrame = getCardFrameDetails(itemCard);
            const itemHasScale =
              typeof itemCard.scale === 'number' && !isNaN(itemCard.scale) && itemCard.scale >= 0;

            // Compute continuous 3D position based on rawOffset and live drag progress
            const dragProgress = isDragging ? Math.max(-0.85, Math.min(0.85, dragOffsetX / 150)) : 0;
            const effectiveOffset = rawOffset - dragProgress;
            const absOff = Math.abs(effectiveOffset);
            const sign = effectiveOffset === 0 ? 0 : effectiveOffset > 0 ? -1 : 1;

            // X translation in rem:
            // Desktop (>= 640px): 0 -> ±7.2rem -> ±13.2rem -> ±18.5rem (unchanged)
            // Mobile (< 640px): tightly positioned behind active card (0 -> ±2.45rem -> ±4.55rem -> ±6.3rem) so all 3 cards are clearly visible
            let xRem = 0;
            if (isMobileView) {
              if (absOff <= 1) {
                xRem = sign * (absOff * 2.45);
              } else if (absOff <= 2) {
                xRem = sign * (2.45 + (absOff - 1) * 2.1);
              } else {
                xRem = sign * (4.55 + (absOff - 2) * 1.75);
              }
            } else {
              if (absOff <= 1) {
                xRem = sign * (absOff * 7.2);
              } else if (absOff <= 2) {
                xRem = sign * (7.2 + (absOff - 1) * 6.0);
              } else {
                xRem = sign * (13.2 + (absOff - 2) * 5.3);
              }
            }

            // Z depth in px:
            // Desktop: 0 -> -65px -> -110px -> -155px
            // Mobile: 0 -> -45px -> -85px -> -125px
            let zPx = 0;
            if (isMobileView) {
              if (absOff <= 1) {
                zPx = -absOff * 45;
              } else {
                zPx = -45 - (absOff - 1) * 40;
              }
            } else {
              if (absOff <= 1) {
                zPx = -absOff * 65;
              } else {
                zPx = -65 - (absOff - 1) * 45;
              }
            }

            // Y rotation in deg:
            // Desktop: 0 -> ±24deg -> ±31deg -> ±38deg
            // Mobile: 0 -> ±16deg -> ±22deg -> ±28deg
            let rotateYDeg = 0;
            const rotSign = effectiveOffset === 0 ? 0 : effectiveOffset > 0 ? 1 : -1;
            if (isMobileView) {
              if (absOff <= 1) {
                rotateYDeg = rotSign * (absOff * 16);
              } else {
                rotateYDeg = rotSign * (16 + (absOff - 1) * 6);
              }
            } else {
              if (absOff <= 1) {
                rotateYDeg = rotSign * (absOff * 24);
              } else {
                rotateYDeg = rotSign * (24 + (absOff - 1) * 7);
              }
            }

            // Scale: 1.0 -> 0.86 -> 0.74 -> 0.62
            let scaleVal = 1;
            if (absOff <= 1) {
              scaleVal = 1 - absOff * 0.14;
            } else {
              scaleVal = Math.max(0.58, 0.86 - (absOff - 1) * 0.12);
            }

            // Opacity: 1.0 (index 0) -> 0.65 (index 1) -> 0.40 (index 2) -> 0 (index 3+)
            let opacityVal = 1;
            if (absOff <= 1) {
              opacityVal = 1 - absOff * 0.35;
            } else if (absOff <= 2) {
              opacityVal = 0.65 - (absOff - 1) * 0.25;
            } else {
              opacityVal = Math.max(0, 0.4 - (absOff - 2) * 0.4);
            }

            // Override initial entrance position when a brand-new card slides in from the right
            const isCardSlidingIn = isCenter && isSlidingIn;
            if (isCardSlidingIn) {
              xRem = isMobileView ? 5.2 : 10.5;
              zPx = 45;
              rotateYDeg = 0;
              scaleVal = 0.88;
              opacityVal = 1;
            }

            const zIndex = isCenter ? 30 : 25 - Math.abs(rawOffset) * 5;
            const isCardFaceDown = isCenter && isFaceDown;

            return (
              <div
                key={itemCard.id}
                style={{
                  transform: `translate3d(${xRem}rem, 0, ${zPx}px) rotateY(${rotateYDeg}deg) scale(${scaleVal})`,
                  opacity: opacityVal,
                  zIndex,
                  transition:
                    isCardSlidingIn || isDragging
                      ? 'none'
                      : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 380ms ease'
                }}
                className={`${
                  isCenter ? 'relative' : 'absolute'
                } flex flex-col items-center max-w-full transform-gpu ${
                  isBufferHidden ? 'pointer-events-none' : ''
                } ${!isCenter ? 'hover:!opacity-95 hover:z-25' : ''}`}
              >
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isCardFaceDown ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: isCardSlidingIn
                      ? 'none'
                      : 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)'
                  }}
                  className="relative group/card-item"
                >
                  {/* FRONT FACE */}
                  <a
                    href={itemImg}
                    target="_blank"
                    rel="noopener noreferrer"
                    draggable={false}
                    onClick={(e) => {
                      if (didSwipeRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      // Clicking a side card scrolls the carousel to select it instead of opening a new tab
                      if (!isCenter) {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectCard?.(itemCard);
                      }
                    }}
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                    title={
                      isCenter
                        ? 'Click to open card image in a new tab'
                        : `${rawOffset > 0 ? 'Previous' : 'Newer'} card: ${itemCard.name} (click to scroll and select)`
                    }
                    aria-label={
                      isCenter ? itemCard.name : `Select card ${itemCard.name}`
                    }
                    className={`relative block rounded-2xl overflow-hidden shadow-2xl shadow-black/90 border-2 bg-slate-900 transition-colors duration-300 cursor-pointer max-w-full ${
                      isCenter
                        ? 'border-slate-700/70 group-hover/card-item:border-amber-400 group-hover/card-item:shadow-[0_0_35px_rgba(251,191,36,0.45)] group-hover/card-item:ring-2 group-hover/card-item:ring-amber-400/30'
                        : 'border-slate-700/80 group-hover/card-item:border-amber-400 group-hover/card-item:ring-2 group-hover/card-item:ring-amber-400/40'
                    }`}
                  >
                    {/* Loading wheel and 'loading card' text when image isn't loaded */}
                    {(showItemLoader || (isCenter && isLoading)) && !isItemError && (
                      <div className="w-56 sm:w-76 md:w-80 h-[328px] sm:h-[445px] md:h-[468px] max-w-[calc(100vw-3rem)] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center gap-4 p-6 border-2 border-slate-700/60 rounded-2xl shadow-inner select-none">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg
                            className="w-12 h-12 animate-spin text-amber-400"
                            viewBox="0 0 48 48"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Loading wheel"
                          >
                            <circle cx="24" cy="8" r="3.2" opacity="1.0" />
                            <circle cx="35.3" cy="12.7" r="3.0" opacity="0.875" />
                            <circle cx="40" cy="24" r="2.8" opacity="0.75" />
                            <circle cx="35.3" cy="35.3" r="2.6" opacity="0.625" />
                            <circle cx="24" cy="40" r="2.4" opacity="0.5" />
                            <circle cx="12.7" cy="35.3" r="2.2" opacity="0.375" />
                            <circle cx="8" cy="24" r="2.0" opacity="0.25" />
                            <circle cx="12.7" cy="12.7" r="1.8" opacity="0.125" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                          <span className="text-xs sm:text-sm font-bold tracking-widest text-amber-300 font-mono animate-pulse uppercase">
                            loading card
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                            {itemCard.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {!isItemError ? (
                      <img
                        src={itemImg}
                        alt={itemCard.name}
                        draggable={false}
                        referrerPolicy="no-referrer"
                        onLoad={() => {
                          markCardImageLoaded(itemCard.id);
                          setLoadedCardIds((prev) => {
                            if (prev[itemCard.id]) return prev;
                            const keys = Object.keys(prev);
                            if (keys.length >= 40) {
                              const next = { ...prev };
                              delete next[Number(keys[0])];
                              next[itemCard.id] = true;
                              return next;
                            }
                            return { ...prev, [itemCard.id]: true };
                          });
                        }}
                        onError={() => {
                          markCardImageLoaded(itemCard.id);
                          setErroredCardIds((prev) => ({ ...prev, [itemCard.id]: true }));
                          setLoadedCardIds((prev) => ({ ...prev, [itemCard.id]: true }));
                        }}
                        className={`w-56 sm:w-76 md:w-80 max-w-[calc(100vw-3rem)] h-auto object-contain drop-shadow-md select-none transition-none ${
                          showItemLoader || (isCenter && isLoading) ? 'hidden' : 'block'
                        }`}
                      />
                    ) : (
                      <div className="w-56 sm:w-76 h-112 max-w-[calc(100vw-3rem)] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 p-6 flex flex-col items-center justify-between text-center border-2 border-dashed border-slate-700">
                        <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                          {itemFrame.label}
                        </div>
                        <div>
                          <Layers className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                          <h3 className="text-xl font-bold font-display text-white">
                            {itemCard.name}
                          </h3>
                          <p className="text-sm text-slate-400 mt-2">
                            {itemCard.race} / {itemCard.attribute}
                          </p>
                          {itemHasScale && (
                            <p className="text-xs text-teal-400 font-bold mt-1">
                              Scale {itemCard.scale}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">ID: {itemCard.id}</div>
                      </div>
                    )}

                    {/* Side Card Name Overlay */}
                    {!isCenter && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/25 group-hover/card-item:from-slate-950/50 transition-colors pointer-events-none" />
                        <div className="absolute bottom-2.5 left-2 right-2 text-center pointer-events-none">
                          <span className="text-[11px] sm:text-xs font-bold text-slate-200 group-hover/card-item:text-amber-300 truncate block drop-shadow-md px-1">
                            {itemCard.name}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Center Card Tooltip advising user that clicking opens image in new tab */}
                    {isCenter && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-300 pointer-events-none opacity-0 group-hover/card-item:opacity-100 transition-all duration-200 transform translate-y-1 group-hover/card-item:translate-y-0 flex items-center gap-1.5 whitespace-nowrap shadow-xl shadow-black/80">
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>Click to open in new tab</span>
                      </div>
                    )}
                  </a>

                  {/* BACK FACE: Official Card Back Image (https://ygoprodeck.com/card/15961) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                    className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/95 border-2 border-amber-500/50 bg-slate-950 pointer-events-none flex items-center justify-center"
                  >
                    <img
                      src={CARD_BACK_IMAGE_URL}
                      alt="Yu-Gi-Oh! Card Back"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover select-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Navigation Arrow: Right (Newer Card in History) */}
          {immediateNewerCard && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCard?.(immediateNewerCard);
              }}
              title={`Newer card: ${immediateNewerCard.name}`}
              aria-label="Newer card in history"
              className="absolute right-1 sm:right-6 z-40 p-2 sm:p-2.5 rounded-full bg-slate-950/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400 shadow-2xl backdrop-blur-md transition-all cursor-pointer group"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* 3D Carousel Stage Subtitle / Position Indicator */}
        {effectiveHistory.length > 1 && (
          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1 px-3 py-1 bg-slate-900/60 border border-slate-800/80 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>
              {safeCurrentIndex === 0
                ? 'Current drawn card'
                : `Card ${safeCurrentIndex + 1} of ${effectiveHistory.length} in history`}
            </span>
            <span className="text-slate-500 hidden sm:inline">
              · Swipe, drag, or click cards to scroll history
            </span>
          </div>
        )}
      </div>

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
              {card.archetype && (() => {
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
                        isArchSelected ? 'text-amber-300 fill-amber-300/30 scale-110' : 'text-amber-400'
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
                  href={`https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(card.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`TCGplayer Market Price: $${tcgPrice} (click to view listing on TCGplayer)`}
                  className="shrink-0 h-7 text-xs font-semibold px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 transition-all duration-300 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <Tag className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[10px] leading-none font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    TCG
                  </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">${tcgPrice}</span>
                </a>
              )}
            </div>

            {/* 2. Card Name Box (Expanded across full width; click to copy name, Favorites button top-right) */}
            <div
              onClick={handleCopyName}
              title={copied ? 'Copied card name!' : 'Click to copy card name to clipboard'}
              className={`group w-full flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                copied
                  ? 'bg-emerald-950/30 border-emerald-400/70 ring-1 ring-emerald-400/30'
                  : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium flex items-center gap-1.5 transition-colors">
                  <span>Card Name</span>
                  {copied ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold normal-case tracking-normal">
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-amber-300/90 normal-case tracking-normal">
                      <Copy className="w-3 h-3" />
                      <span>Click to copy</span>
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
                  <Heart className={`w-3.5 h-3.5 transition-transform duration-200 ${isFavorite ? 'fill-red-400 scale-110' : ''}`} />
                </button>
              </div>

              <div className="mt-1 relative overflow-hidden">
                {exitingName !== null && (
                  <h2
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 text-xl sm:text-2xl font-extrabold font-display tracking-tight text-white pointer-events-none ${
                      nameCyclePhase === 'animating'
                        ? 'transition-all duration-300 ease-in-out translate-y-full opacity-0'
                        : 'translate-y-0 opacity-100'
                    }`}
                  >
                    {exitingName}
                  </h2>
                )}
                <h2
                  className={`text-xl sm:text-2xl font-extrabold font-display tracking-tight text-white group-hover:text-amber-300 ${
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
          </div>

          {/* 3. External Links Row Positioned Directly Below Card Name Box */}
          <div className="flex items-center justify-center sm:justify-start gap-2.5 w-full flex-wrap">
            <a
              href={card.ygoprodeck_url || `https://ygoprodeck.com/card/${encodeURIComponent(card.name)}`}
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

        {/* PENDULUM SCALE DISPLAY & CLICKABLE FILTER - ONLY DISPLAYED IF CARD HAS A PENDULUM SCALE */}
        {hasScale && (() => {
          const isScaleSelected = isCriterionSelected('scale', card.scale);
          const scaleLabel = `Scale: ${card.scale}`;
          return (
            <div
              onClick={() =>
                handleSelectFilterCriterion('scale', card.scale, scaleLabel)
              }
              title={
                isScaleSelected
                  ? `Click to turn off ${scaleLabel}`
                  : `Click to turn on Pendulum Scale ${card.scale}`
              }
              className={`group mb-4 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isScaleSelected
                  ? 'bg-gradient-to-r from-blue-950/60 via-teal-900/50 to-red-950/60 border-amber-400 ring-1 ring-amber-400/40'
                  : 'bg-gradient-to-r from-blue-950/40 via-teal-950/40 to-red-950/40 hover:from-blue-950/60 hover:via-teal-900/40 hover:to-red-950/60 border-teal-500/40 hover:border-teal-400/70'
              }`}
            >
              {/* Far Left: Blue scale diamond */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/50 text-blue-400 font-mono font-extrabold text-sm shadow-sm shrink-0">
                <span className="text-xs">◄</span>
                <span>{card.scale}</span>
              </div>

              {/* Center: Pendulum Scale label & ON/OFF status */}
              <div className="flex items-center justify-center gap-2 text-center">
                <span
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isScaleSelected
                      ? 'text-amber-300'
                      : 'text-teal-300 group-hover:text-teal-200'
                  }`}
                >
                  Pendulum Scale
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                    isScaleSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isScaleSelected
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span>{isScaleSelected ? 'ON' : 'OFF'}</span>
                </span>
              </div>

              {/* Far Right: Red scale diamond */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-red-400 font-mono font-extrabold text-sm shadow-sm shrink-0">
                <span>{card.scale}</span>
                <span className="text-xs">►</span>
              </div>
            </div>
          );
        })()}

        {/* CLICKABLE ATTRIBUTES & STATS SECTION */}
        {isMonster ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-5">
            {/* 1. Attribute */}
            {card.attribute && (() => {
              const isAttrSelected = isCriterionSelected('attribute', card.attribute);
              const attrLabel = `Attribute: ${card.attribute}`;
              return (
                <div
                  onClick={() =>
                    handleSelectFilterCriterion('attribute', card.attribute, attrLabel)
                  }
                  title={
                    isAttrSelected
                      ? `Click to turn off ${attrLabel}`
                      : `Click to turn on ${card.attribute} attribute`
                  }
                  className={`group flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isAttrSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                      Attribute
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isAttrSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAttrSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isAttrSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 mt-1">
                    <span className={isAttrSelected ? 'text-amber-300' : ''}>
                      {card.attribute}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 2. Level / Rank / Link Rating */}
            {(card.level !== undefined || card.linkval !== undefined) && (() => {
              const lvlVal = card.level ?? card.linkval;
              const lvlName = isXyz ? 'Rank' : isLink ? 'Link Rating' : 'Level';
              const lvlLabel = `${lvlName}: ${lvlVal}`;
              const isLvlSelected = isCriterionSelected('level', lvlVal);
              return (
                <div
                  onClick={() =>
                    handleSelectFilterCriterion('level', lvlVal, lvlLabel)
                  }
                  title={
                    isLvlSelected
                      ? `Click to turn off ${lvlLabel}`
                      : `Click to turn on ${lvlLabel}`
                  }
                  className={`group flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isLvlSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                      {lvlName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isLvlSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isLvlSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isLvlSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 flex items-center gap-1 mt-1 font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className={isLvlSelected ? 'text-amber-300' : ''}>{lvlVal}</span>
                  </div>
                </div>
              );
            })()}

            {/* 3. Monster Type */}
            {card.race && (() => {
              const isRaceSelected = isCriterionSelected('race', card.race);
              const raceLabel = `Monster Type: ${card.race}`;
              return (
                <div
                  onClick={() =>
                    handleSelectFilterCriterion('race', card.race, raceLabel)
                  }
                  title={
                    isRaceSelected
                      ? `Click to turn off ${raceLabel}`
                      : `Click to turn on ${card.race} Monster Type`
                  }
                  className={`group flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isRaceSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                      Monster Type
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isRaceSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRaceSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isRaceSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 mt-1 min-w-0">
                    <span className={`block truncate ${isRaceSelected ? 'text-amber-300' : ''}`}>
                      {card.race}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 4. Super Type or Category */}
            {(() => {
              const filterKey: keyof CardFilterState = superType ? 'superType' : 'type';
              const filterVal = superType ? superType : 'Monster';
              const displayVal = superType || safeType.replace(' Monster', '');
              const filterLabel = superType ? `Super: ${superType}` : 'Property: Monster';
              const isStSelected = isCriterionSelected(filterKey, filterVal);
              return (
                <div
                  onClick={() =>
                    handleSelectFilterCriterion(filterKey, filterVal, filterLabel)
                  }
                  title={
                    isStSelected
                      ? `Click to turn off ${filterLabel}`
                      : `Click to turn on ${filterLabel}`
                  }
                  className={`group flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isStSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                      {superType ? 'Super Type' : 'Type'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isStSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isStSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isStSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 mt-1 min-w-0">
                    <span className={`block truncate ${isStSelected ? 'text-amber-300' : ''}`}>
                      {displayVal}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* SPELL / TRAP STATS: PROPERTY & SUBTYPE */
          <div className="grid grid-cols-2 gap-3 pb-5">
            {/* 1. Property: "Spell Card" or "Trap Card" */}
            {(() => {
              const propVal = typeStr.includes('trap') ? 'Trap Card' : 'Spell Card';
              const propLabel = `Property: ${propVal}`;
              const isPropSelected = isCriterionSelected('type', propVal);
              return (
                <div
                  onClick={() =>
                    handleSelectFilterCriterion('type', propVal, propLabel)
                  }
                  title={
                    isPropSelected
                      ? `Click to turn off ${propLabel}`
                      : `Click to turn on ${propVal}`
                  }
                  className={`group flex flex-col justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isPropSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-amber-400 font-semibold flex items-center gap-1.5">
                      <span>Property</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          typeStr.includes('trap') ? 'bg-pink-400' : 'bg-emerald-400'
                        }`}
                      />
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isPropSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPropSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isPropSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-100 group-hover:text-amber-300 mt-1">
                    <span
                      className={
                        typeStr.includes('trap') ? 'text-pink-300' : 'text-emerald-300'
                      }
                    >
                      {propVal}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 2. Subtype: Quick, Field, Continuous, Counter, Ritual, Equip, Normal */}
            {(() => {
              const mappedRace =
                (card.race || '').toLowerCase() === 'quick'
                  ? 'Quick-Play'
                  : card.race || 'Normal';
              const subDisplay = card.race === 'Quick-Play' ? 'Quick' : card.race || 'Normal';
              const subLabel = `Subtype: ${subDisplay}`;
              const isSubSelected = isCriterionSelected('race', mappedRace);
              return (
                <div
                  onClick={() =>
                    handleSelectFilterCriterion('race', mappedRace, subLabel)
                  }
                  title={
                    isSubSelected
                      ? `Click to turn off ${subLabel}`
                      : `Click to turn on ${subLabel}`
                  }
                  className={`group flex flex-col justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSubSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-amber-400 font-semibold">
                      Subtype
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isSubSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSubSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isSubSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-100 group-hover:text-amber-300 mt-1">
                    <span className={isSubSelected ? 'text-amber-300' : ''}>{subDisplay}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* COMBAT STATS (ATK & DEF) FOR MONSTERS */}
        {isMonster && (
          <div className="grid grid-cols-2 gap-3 pb-5">
            {/* Clickable ATK */}
            {card.atk !== undefined && (() => {
              const isAtkSelected = isCriterionSelected('atk', card.atk);
              const atkLabel = `ATK: ${card.atk}`;
              return (
                <div
                  onClick={() =>
                    handleSelectFilterCriterion('atk', card.atk, atkLabel)
                  }
                  title={
                    isAtkSelected
                      ? `Click to turn off ${atkLabel}`
                      : `Click to turn on ${atkLabel}`
                  }
                  className={`group p-3 rounded-xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-2 ${
                    isAtkSelected
                      ? 'bg-red-950/60 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-gradient-to-r from-red-950/40 to-slate-950/60 hover:from-red-950/70 hover:to-amber-950/40 border-red-900/40 hover:border-red-500/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-red-950/80 text-red-400 group-hover:text-red-300 border border-red-800/40 shrink-0 transition-transform duration-300 group-hover:scale-105">
                      <Swords className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-wider text-red-400/90">
                        ATK
                      </div>
                      <div
                        className={`text-xl font-extrabold font-mono tabular-nums transition-colors duration-200 ${
                          animatedAtk.trend === 'up'
                            ? 'text-emerald-300'
                            : animatedAtk.trend === 'down'
                            ? 'text-amber-300'
                            : 'text-white'
                        }`}
                      >
                        {card.atk < 0 ? '?' : animatedAtk.displayVal}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 transition-all duration-200 ${
                      isAtkSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        isAtkSelected
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span>{isAtkSelected ? 'ON' : 'OFF'}</span>
                  </span>
                </div>
              );
            })()}

            {/* Clickable DEF */}
            {card.def !== undefined ? (() => {
              const isDefSelected = isCriterionSelected('def', card.def);
              const defLabel = `DEF: ${card.def}`;
              return (
                <div
                  onClick={() =>
                    handleSelectFilterCriterion('def', card.def, defLabel)
                  }
                  title={
                    isDefSelected
                      ? `Click to turn off ${defLabel}`
                      : `Click to turn on ${defLabel}`
                  }
                  className={`group p-3 rounded-xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-2 ${
                    isDefSelected
                      ? 'bg-blue-950/60 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-gradient-to-r from-blue-950/40 to-slate-950/60 hover:from-blue-950/70 hover:to-amber-950/40 border-blue-900/40 hover:border-blue-500/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 group-hover:text-blue-300 border border-blue-800/40 shrink-0 transition-transform duration-300 group-hover:scale-105">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-wider text-blue-400/90">
                        DEF
                      </div>
                      <div
                        className={`text-xl font-extrabold font-mono tabular-nums transition-colors duration-200 ${
                          animatedDef.trend === 'up'
                            ? 'text-emerald-300'
                            : animatedDef.trend === 'down'
                            ? 'text-amber-300'
                            : 'text-white'
                        }`}
                      >
                        {card.def < 0 ? '?' : animatedDef.displayVal}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 transition-all duration-200 ${
                      isDefSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        isDefSelected
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span>{isDefSelected ? 'ON' : 'OFF'}</span>
                  </span>
                </div>
              );
            })() : isLink ? (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between transition-all duration-300">
                <div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-blue-400">Link Markers</div>
                  <div className="text-xs text-slate-300 font-mono mt-1">
                    {card.linkmarkers?.join(', ') || 'N/A'}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* CARD TEXT / EFFECT BOX WITH INTERACTIVE HIGHLIGHTED KEYWORDS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="uppercase tracking-wider text-slate-400 font-semibold transition-colors duration-200">
              {isMonster
                ? `[ ${card.race || 'Card'} / ${safeType.replace(' Monster', '')} ]`
                : `[ ${typeStr.includes('trap') ? 'Trap Card' : 'Spell Card'} / ${card.race === 'Quick-Play' ? 'Quick' : (card.race || 'Normal')} ]`}
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

        {/* METADATA & BANLIST ROW */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Passcode:</span>
            <span className="font-mono text-slate-300 font-semibold">{card.id}</span>
          </div>

          {/* Banlist information */}
          <div className="flex items-center gap-3">
            {card.banlist_info?.ban_tcg && (
              <div className="flex items-center gap-1">
                <span>TCG:</span>
                <span className={`font-semibold ${
                  card.banlist_info.ban_tcg === 'Forbidden'
                    ? 'text-red-400'
                    : card.banlist_info.ban_tcg === 'Limited'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}>
                  {card.banlist_info.ban_tcg}
                </span>
              </div>
            )}
            {card.banlist_info?.ban_ocg && (
              <div className="flex items-center gap-1">
                <span>OCG:</span>
                <span className={`font-semibold ${
                  card.banlist_info.ban_ocg === 'Forbidden'
                    ? 'text-red-400'
                    : card.banlist_info.ban_ocg === 'Limited'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}>
                  {card.banlist_info.ban_ocg}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Sets */}
          {card.card_sets && card.card_sets.length > 0 && (
            <button
              onClick={() => setShowSets(!showSets)}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              {showSets ? 'Hide Card Sets' : `View ${card.card_sets.length} Card Sets`}
            </button>
          )}
        </div>

        {/* Expandable Card Sets List */}
        {showSets && card.card_sets && card.card_sets.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {card.card_sets.slice(0, 8).map((set, idx) => (
              <div key={idx} className="p-2 bg-slate-950/60 rounded border border-slate-800/60 flex items-center justify-between">
                <span className="text-slate-300 truncate mr-2">{set.set_name}</span>
                <span className="font-mono text-amber-400 shrink-0">{set.set_code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
