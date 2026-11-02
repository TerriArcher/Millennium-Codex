import React, { useState, useEffect } from 'react';
import { YugiohCard } from '../types/card';
import { FilterBar } from '../components/FilterBar';
import { CardDisplay } from '../components/CardDisplay';
import { Toast } from '../components/Toast';
import { INITIAL_START_CARD } from '../data/fallbackCards';
import {
  getMatchingCardsCount,
  warmRandomCardQueue
} from '../services/ygoprodeckApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setCurrentCard,
  setTotalMatches,
  setCardError
} from '../store/slices/cardsSlice';
import { setAllFilters, resetFilters } from '../store/slices/filtersSlice';
import { addCardToHistory } from '../store/slices/historySlice';
import { useCardActions } from '../hooks/useCardActions';
import { AlertCircle, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CardRandomizerPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const currentCard = useAppSelector((state) => state.cards.currentCard);
  const history = useAppSelector((state) => state.history.history);
  const isLoading = useAppSelector((state) => state.cards.isLoading);
  const isQuickDrawing = useAppSelector((state) => state.history.isQuickDrawing);
  const isCardAnimating = useAppSelector((state) => state.cards.isCardAnimating);
  const isFetchingCard = isLoading || isQuickDrawing;
  const isDrawDisabled = isFetchingCard || isCardAnimating;
  const totalMatches = useAppSelector((state) => state.cards.totalMatches);
  const errorMsg = useAppSelector((state) => state.cards.error);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { drawRandomCard, openMatchingCardsSheet } = useCardActions();

  // Initial draw if no card is present, plus warm the random prefetch queue
  useEffect(() => {
    if (!currentCard) {
      dispatch(setCurrentCard(INITIAL_START_CARD));
      dispatch(addCardToHistory(INITIAL_START_CARD));
    }
    warmRandomCardQueue(currentCard?.id || INITIAL_START_CARD.id);
  }, []);

  // Update total matching count when filters change, debouncing text inputs by 300ms to avoid per-keystroke API calls
  useEffect(() => {
    let cancelled = false;
    const hasAnyFilter = Boolean(
      filters.type ||
        filters.superType ||
        filters.scale !== undefined ||
        filters.archetype ||
        filters.attribute ||
        filters.level !== undefined ||
        filters.race ||
        filters.atk !== undefined ||
        filters.def !== undefined ||
        filters.keyword
    );

    if (!hasAnyFilter) {
      dispatch(setTotalMatches(undefined));
      return;
    }

    const hasTextFilter = Boolean(filters.archetype || filters.keyword);
    const debounceMs = hasTextFilter ? 300 : 0;

    const timer = window.setTimeout(() => {
      getMatchingCardsCount(filters).then((count) => {
        if (!cancelled) {
          dispatch(setTotalMatches(count));
        }
      });
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filters, dispatch]);

  // Browsing history through the carousel without altering chronological history stack
  const handleBrowseHistory = (card: YugiohCard) => {
    dispatch(setCurrentCard(card));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    dispatch(setTotalMatches(undefined));
    dispatch(setCardError(null));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Toast Notification */}
      <Toast
        isVisible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onClose={() => setToastMessage(null)}
      />

      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white mb-2">
          Random Yu-Gi-Oh! Card Explorer
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Discover cards sourced live from the YGOPRODeck database. Filter by Super Types, Attributes, Scales, or click any stat, archetype, or highlighted keyword to surf related cards!
        </p>
      </div>

      {/* Filter Control Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(newFilters) => {
          dispatch(setAllFilters(newFilters));
        }}
        onDrawRandom={() =>
          void drawRandomCard({
            onCycleReset: () =>
              setToastMessage('All matching cards drawn! Starting a new cycle.')
          })
        }
        onResetFilters={handleResetFilters}
        onOpenMatchingCards={() => void openMatchingCardsSheet()}
        isLoading={isDrawDisabled}
        totalMatches={totalMatches}
      />

      {/* Error message if no match found */}
      {errorMsg && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="underline hover:text-white font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Card Showcase Area with Integrated 3D Perspective Carousel */}
      {currentCard && (
        <div className="relative">
          <CardDisplay
            card={currentCard}
            onFilterNotification={(msg) => setToastMessage(msg)}
            isLoading={isFetchingCard}
            history={history}
            onSelectCard={handleBrowseHistory}
          />
        </div>
      )}

      {/* Bottom Quick Links to Meta Resources */}
      <div className="mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>Looking for competitive tournament decks and banlist tier lists?</span>
        </div>
        <Link
          to="/resources"
          className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
        >
          Explore YugiohMeta & MasterduelMeta Resources →
        </Link>
      </div>
    </div>
  );
};
