import React, { useState, useMemo, useEffect } from 'react';
import { YugiohCard, CardFilterState } from '../types/card';
import { X, Layers, Sparkles, Check, ArrowDownAZ, Heart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleFavorite } from '../store/slices/historySlice';

interface MatchingCardsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cards: YugiohCard[];
  isLoading: boolean;
  currentCardId?: number;
  onSelectCard: (card: YugiohCard) => void;
  activeFilters: CardFilterState;
}

type SortStyle = 'default' | 'alphabetical' | 'type';

const BATCH_SIZE = 48;

export const MatchingCardsSheet: React.FC<MatchingCardsSheetProps> = ({
  isOpen,
  onClose,
  cards,
  isLoading,
  currentCardId,
  onSelectCard,
  activeFilters
}) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.history.favorites);
  const [sortStyle, setSortStyle] = useState<SortStyle>('default');
  const [randomSeed, setRandomSeed] = useState(0);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  // Check if multiple card types exist in this pool
  const hasMultipleTypes = useMemo(() => {
    const types = new Set<string>();
    for (const c of cards) {
      const t = (c.type || '').toLowerCase();
      if (t.includes('spell')) types.add('spell');
      else if (t.includes('trap')) types.add('trap');
      else types.add('monster');
      if (types.size > 1) return true;
    }
    return false;
  }, [cards]);

  // If cards only have 1 type and sortStyle is set to 'type', reset to 'default'
  useEffect(() => {
    if (!hasMultipleTypes && sortStyle === 'type') {
      setSortStyle('default');
    }
  }, [hasMultipleTypes, sortStyle]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset sort, shuffle seed, and batch count when sheet opens or cards change
  useEffect(() => {
    if (isOpen) {
      setSortStyle('default');
      setRandomSeed((s) => s + 1);
      setVisibleCount(BATCH_SIZE);
    }
  }, [isOpen, cards]);

  // Compute sorted cards based on active sorting style
  const sortedCards = useMemo(() => {
    if (sortStyle === 'default') {
      // Fisher-Yates shuffle to ensure active re-randomization
      const list = [...cards];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    }
    const list = [...cards];
    if (sortStyle === 'alphabetical') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortStyle === 'type' && hasMultipleTypes) {
      const getTypeOrder = (card: YugiohCard): number => {
        const t = (card.type || '').toLowerCase();
        if (t.includes('spell')) return 2;
        if (t.includes('trap')) return 3;
        return 1; // Monsters first
      };
      return list.sort((a, b) => {
        const orderA = getTypeOrder(a);
        const orderB = getTypeOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }
    return list;
  }, [cards, sortStyle, randomSeed, hasMultipleTypes]);

  const visibleCards = useMemo(
    () => sortedCards.slice(0, visibleCount),
    [sortedCards, visibleCount]
  );

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

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

  if (!shouldRender) return null;

  // Build filter label summary
  const filterParts = [
    activeFilters.type && `Property: ${activeFilters.type}`,
    activeFilters.superType && `Super: ${activeFilters.superType}`,
    activeFilters.archetype && `Archetype: ${activeFilters.archetype}`,
    activeFilters.attribute && `Attribute: ${activeFilters.attribute}`,
    activeFilters.level !== undefined && `Level: ${activeFilters.level}`,
    activeFilters.scale !== undefined && `Scale: ${activeFilters.scale}`,
    activeFilters.race && `Type: ${activeFilters.race}`,
    activeFilters.keyword && `Keyword: "${activeFilters.keyword}"`
  ].filter(Boolean);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (visibleCount >= sortedCards.length) return;
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 320) {
      setVisibleCount((prev) => Math.min(sortedCards.length, prev + BATCH_SIZE));
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col justify-end transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-up / Slide-down Sheet */}
      <div
        className={`relative z-10 w-full max-w-7xl mx-auto bg-slate-900 border-t border-slate-800 rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Top Header */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex flex-col gap-2.5 shrink-0 bg-slate-950/90 rounded-t-2xl">
          {/* Row 1: Title + Total Cards Count on Left, Sort + Close on Right */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h3 className="text-[13px] sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
                <span className="whitespace-nowrap">All Matching Cards</span>
                <span
                  className="text-[11px] sm:text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 sm:px-2.5 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1"
                  title={`${cards.length.toLocaleString()} matching ${cards.length === 1 ? 'card' : 'cards'}`}
                >
                  <span>{cards.length.toLocaleString()}</span>
                  <span className="hidden sm:inline">{cards.length === 1 ? 'card' : 'cards'}</span>
                </span>
              </h3>
            </div>

            {/* Controls: Sorting Dropdown & Close Button */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-slate-400 bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 rounded-lg px-1.5 sm:px-2.5 py-1 sm:py-1.5 transition-colors">
                <ArrowDownAZ className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline font-medium text-slate-400">Sort:</span>
                <select
                  value={sortStyle}
                  onChange={(e) => {
                    const val = e.target.value as SortStyle;
                    setSortStyle(val);
                    setVisibleCount(BATCH_SIZE);
                    if (val === 'default') {
                      setRandomSeed((s) => s + 1);
                    }
                  }}
                  className="bg-transparent text-slate-200 text-[11px] sm:text-xs font-medium focus:outline-none cursor-pointer max-w-[92px] sm:max-w-none"
                  title="Select card sorting style"
                >
                  <option value="default" className="bg-slate-950 text-slate-200">
                    Random
                  </option>
                  <option value="alphabetical" className="bg-slate-950 text-slate-200">
                    Alphabetical
                  </option>
                  {hasMultipleTypes && (
                    <option value="type" className="bg-slate-950 text-slate-200">
                      Type (Monster, Spell, Trap)
                    </option>
                  )}
                </select>
              </div>

              <button
                onClick={onClose}
                className="p-1 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer shrink-0"
                title="Close window"
                aria-label="Close window"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Row 2: Active Filter Criteria Information */}
          {filterParts.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-0.5">
                Criteria:
              </span>
              {filterParts.map((part, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium text-[11px]"
                >
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Grid of Card Art with Plain Text Name Below */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6"
        >
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
              <Sparkles className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-sm">Loading all matching cards...</p>
            </div>
          ) : sortedCards.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 gap-2">
              <Layers className="w-10 h-10 text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">No cards found matching this criteria</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
                {visibleCards.map((card) => {
                  const isSelected = card.id === currentCardId;
                  const isFav = favorites.includes(card.id);
                  const imageUrl =
                    card.card_images?.[0]?.image_url_small ||
                    `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`;

                  return (
                    <div
                      key={card.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onSelectCard(card);
                        onClose();
                      }}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onSelectCard(card);
                          onClose();
                        }
                      }}
                      className={`group flex flex-col items-center p-2 rounded-xl text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                        isSelected
                          ? 'bg-amber-500/15 border-2 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
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

                        {/* Favorite Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(toggleFavorite({ id: card.id, card }));
                          }}
                          className={`absolute top-1.5 left-1.5 z-10 p-1.5 rounded-full transition-all cursor-pointer backdrop-blur-md shadow-md ${
                            isFav
                              ? 'bg-red-950/90 text-red-400 border border-red-500/50 hover:bg-red-900 shadow-red-950/50 scale-105'
                              : 'bg-slate-950/80 text-slate-400 hover:text-red-400 border border-slate-700/70 hover:border-red-400/50 hover:bg-slate-900'
                          }`}
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          aria-label={isFav ? `Remove ${card.name} from favorites` : `Add ${card.name} to favorites`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-400 text-red-400' : ''}`} />
                        </button>

                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-amber-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Active</span>
                          </div>
                        )}
                      </div>

                      {/* Plain Text Name Below Artwork */}
                      <p className="mt-2 text-xs font-semibold text-slate-200 group-hover:text-amber-300 line-clamp-2 text-center w-full leading-snug">
                        {card.name}
                      </p>
                    </div>
                  );
                })}
              </div>

              {visibleCount < sortedCards.length && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <p className="text-xs text-slate-400">
                    Showing {visibleCards.length.toLocaleString()} of {sortedCards.length.toLocaleString()}
                    <span className="hidden sm:inline"> cards</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) => Math.min(sortedCards.length, prev + BATCH_SIZE))
                    }
                    className="px-4 py-2 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 rounded-xl transition-all cursor-pointer"
                  >
                    Load More<span className="hidden sm:inline"> Cards</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
