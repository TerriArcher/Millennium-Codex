import React, { useState, useEffect, useRef } from 'react';
import { YugiohCard } from '../../types/card';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCardAnimating } from '../../store/slices/cardsSlice';
import {
  isCardImagePreloaded,
  markCardImageLoaded
} from '../../services/ygoprodeckApi';
import {
  getCardFrameTheme,
  getCardFullImageUrl
} from '../../utils/cardFormatters';
import { ChevronLeft, ChevronRight, ExternalLink, Layers } from 'lucide-react';

// Official card-back image from https://ygoprodeck.com/card/15961
const CARD_BACK_IMAGE_URL = 'https://images.ygoprodeck.com/images/cards/149694341.jpg';

export interface CardCarousel3DProps {
  card: YugiohCard;
  history: YugiohCard[];
  isLoading: boolean;
  onSelectCard?: (card: YugiohCard) => void;
}

export const CardCarousel3D: React.FC<CardCarousel3DProps> = ({
  card,
  history,
  isLoading,
  onSelectCard
}) => {
  const dispatch = useAppDispatch();
  const drawCount = useAppSelector((state) => state.cards.drawCount);
  const isCardAnimating = useAppSelector((state) => state.cards.isCardAnimating);

  const [loadedCardIds, setLoadedCardIds] = useState<Record<number, boolean>>({});
  const [erroredCardIds, setErroredCardIds] = useState<Record<number, boolean>>({});

  const stageRef = useRef<HTMLDivElement | null>(null);

  const historyList = history || [];
  const effectiveHistory =
    historyList.length > 0 && historyList.some((c) => c.id === card.id)
      ? historyList
      : [card, ...historyList.filter((c) => c.id !== card.id)];

  const targetIndex = Math.max(
    0,
    effectiveHistory.findIndex((c) => c.id === card.id)
  );

  const [visualIndex, setVisualIndex] = useState(targetIndex);
  const lastTargetIndexRef = useRef(targetIndex);

  const lastDrawCountRef = useRef(
    isCardAnimating && drawCount > 0 ? drawCount - 1 : drawCount
  );
  const [revealPhase, setRevealPhase] = useState<
    'idle' | 'sliding-in' | 'face-down' | 'flipping'
  >('idle');
  const [slideInDone, setSlideInDone] = useState(true);

  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);
  const wheelCooldownRef = useRef(false);

  const isCurrentImageLoaded =
    Boolean(loadedCardIds[card.id]) || isCardImagePreloaded(card.id);
  const isCurrentImageLoading = !isCurrentImageLoaded && !erroredCardIds[card.id];
  const isCurrentImageError = Boolean(erroredCardIds[card.id]);

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

  useEffect(() => {
    const img = new Image();
    img.src = CARD_BACK_IMAGE_URL;
  }, []);

  useEffect(() => {
    return () => {
      dispatch(setCardAnimating(false));
    };
  }, [dispatch]);

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

    const stepTimer = window.setTimeout(() => {
      setVisualIndex(nextIdx);
    }, 135);

    return () => window.clearTimeout(stepTimer);
  }, [targetIndex, visualIndex]);

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

  useEffect(() => {
    if (revealPhase === 'face-down' && slideInDone) {
      const maxWaitTimer = window.setTimeout(() => {
        setRevealPhase('flipping');
      }, 4000);
      return () => window.clearTimeout(maxWaitTimer);
    }
  }, [revealPhase, slideInDone]);

  useEffect(() => {
    if (revealPhase === 'flipping') {
      const finishFlipTimer = window.setTimeout(() => {
        setRevealPhase('idle');
        dispatch(setCardAnimating(false));
      }, 540);
      return () => window.clearTimeout(finishFlipTimer);
    }
  }, [revealPhase, dispatch]);

  const safeCurrentIndex = visualIndex;
  const hasPreviousCard = safeCurrentIndex + 1 < effectiveHistory.length;
  const hasNewerCard = safeCurrentIndex > 0;
  const immediatePreviousCard = hasPreviousCard ? effectiveHistory[safeCurrentIndex + 1] : undefined;
  const immediateNewerCard = hasNewerCard ? effectiveHistory[safeCurrentIndex - 1] : undefined;

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
    const horizontalDelta =
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
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

  const isSlidingIn = revealPhase === 'sliding-in';
  const isFaceDown = revealPhase === 'sliding-in' || revealPhase === 'face-down';

  return (
    <div
      ref={stageRef}
      className="relative z-20 hover:z-30 w-full max-w-4xl mx-auto flex flex-col items-center mb-6"
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

        {effectiveHistory.map((itemCard, idx) => {
          const rawOffset = idx - safeCurrentIndex;
          if (Math.abs(rawOffset) > 3) return null;

          const isCenter = rawOffset === 0;
          const isBufferHidden = Math.abs(rawOffset) >= 3;
          const itemImg = getCardFullImageUrl(itemCard);

          const isItemLoaded =
            Boolean(loadedCardIds[itemCard.id]) || isCardImagePreloaded(itemCard.id);
          const isItemError = Boolean(erroredCardIds[itemCard.id]);
          const showItemLoader = !isItemLoaded && !isItemError;
          const itemFrame = getCardFrameTheme(itemCard);
          const itemHasScale =
            typeof itemCard.scale === 'number' && !isNaN(itemCard.scale) && itemCard.scale >= 0;

          const dragProgress = isDragging ? Math.max(-0.85, Math.min(0.85, dragOffsetX / 150)) : 0;
          const effectiveOffset = rawOffset - dragProgress;
          const absOff = Math.abs(effectiveOffset);
          const sign = effectiveOffset === 0 ? 0 : effectiveOffset > 0 ? -1 : 1;

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

          let scaleVal = 1;
          if (absOff <= 1) {
            scaleVal = 1 - absOff * 0.14;
          } else {
            scaleVal = Math.max(0.58, 0.86 - (absOff - 1) * 0.12);
          }

          let opacityVal = 1;
          if (absOff <= 1) {
            opacityVal = 1 - absOff * 0.35;
          } else if (absOff <= 2) {
            opacityVal = 0.65 - (absOff - 1) * 0.25;
          } else {
            opacityVal = Math.max(0, 0.4 - (absOff - 2) * 0.4);
          }

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
              } ${!isCenter ? 'hover:!opacity-95' : ''}`}
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
                  aria-label={isCenter ? itemCard.name : `Select card ${itemCard.name}`}
                  className="relative block rounded-2xl cursor-pointer max-w-full"
                >
                  <div
                    className={`relative rounded-2xl overflow-hidden shadow-2xl shadow-black/90 border-2 bg-slate-900 transition-all duration-300 ease-out pointer-events-none ${
                      !isDragging && !isCardFaceDown ? 'group-hover/card-item:scale-120' : ''
                    } ${
                      isCenter
                        ? 'border-slate-700/70 group-hover/card-item:border-amber-400/60 group-hover/card-item:shadow-[0_0_35px_rgba(251,191,36,0.27)] group-hover/card-item:ring-2 group-hover/card-item:ring-amber-400/18'
                        : 'border-slate-700/80 group-hover/card-item:border-amber-400/60 group-hover/card-item:ring-2 group-hover/card-item:ring-amber-400/24'
                    }`}
                  >
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

                  {isCenter && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-300 pointer-events-none opacity-0 group-hover/card-item:opacity-100 transition-all duration-200 transform translate-y-1 group-hover/card-item:translate-y-0 flex items-center gap-1.5 whitespace-nowrap shadow-xl shadow-black/80">
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Click to open in new tab</span>
                    </div>
                  )}
                  </div>
                </a>

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
  );
};
