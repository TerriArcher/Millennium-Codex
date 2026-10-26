import React, { useEffect } from 'react';
import { CardFilterState } from '../types/card';
import { FilterBar } from '../components/FilterBar';
import { CardDisplay } from '../components/CardDisplay';
import { FALLBACK_CARDS, INITIAL_ACE_CARDS } from '../data/fallbackCards';
import { fetchRandomCardFromApi, filterFallbackCards } from '../services/ygoprodeckApi';
import { store } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setCurrentCard,
  setTotalMatches,
  setCardLoading,
  setCardError
} from '../store/slices/cardsSlice';
import { setAllFilters, resetFilters } from '../store/slices/filtersSlice';
import { addCardToHistory } from '../store/slices/historySlice';
import { AlertCircle, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CardRandomizerPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const currentCard = useAppSelector((state) => state.cards.currentCard);
  const isLoading = useAppSelector((state) => state.cards.isLoading);
  const totalMatches = useAppSelector((state) => state.cards.totalMatches);
  const errorMsg = useAppSelector((state) => state.cards.error);

  // Fetch a random card directly from the YGOPRODeck API, checking active criteria first
  const fetchRandomCard = async (appliedFilters?: CardFilterState) => {
    dispatch(setCardLoading(true));
    dispatch(setCardError(null));

    // Always check and retain the active filters from Redux store first
    const activeFilters = appliedFilters !== undefined ? appliedFilters : store.getState().filters;

    try {
      const data = await fetchRandomCardFromApi(activeFilters, currentCard?.id);

      if (data.card) {
        // Double check client-side: never display the same card if another can be drawn
        if (currentCard && data.card.id === currentCard.id && data.totalMatches > 1) {
          const retryData = await fetchRandomCardFromApi(activeFilters, currentCard.id);
          if (retryData.card) {
            dispatch(setCurrentCard(retryData.card));
            dispatch(setTotalMatches(retryData.totalMatches));
            dispatch(addCardToHistory(retryData.card));
            dispatch(setCardLoading(false));
            return;
          }
        }

        dispatch(setCurrentCard(data.card));
        dispatch(setTotalMatches(data.totalMatches));
        dispatch(addCardToHistory(data.card));
      }
    } catch (err: any) {
      if (err?.status === 404) {
        dispatch(setCardError('No card matching this exact criteria was found. Try loosening the filters.'));
        return;
      }
      console.warn('API fetch error, using local seed fallback:', err);
      // Select non-recent card from filtered fallback pool
      let pool = filterFallbackCards(activeFilters, currentCard?.id);
      if (pool.length === 0) pool = FALLBACK_CARDS;
      if (currentCard && pool.length > 1) {
        pool = pool.filter((c) => c.id !== currentCard.id);
      }
      const fallback = pool[Math.floor(Math.random() * pool.length)];
      dispatch(setCurrentCard(fallback));
      dispatch(addCardToHistory(fallback));
    } finally {
      dispatch(setCardLoading(false));
    }
  };

  // Initial draw if no card is present
  useEffect(() => {
    if (!currentCard) {
      const initial = INITIAL_ACE_CARDS[Math.floor(Math.random() * INITIAL_ACE_CARDS.length)];
      dispatch(setCurrentCard(initial));
      dispatch(addCardToHistory(initial));
    }
  }, []);

  // Chained Exploration Handler
  const handleExploreStat = (statFilter: {
    attribute?: string;
    level?: number;
    race?: string;
    type?: string;
    superType?: string;
    archetype?: string;
    scale?: number;
    atk?: number;
    def?: number;
  }) => {
    const updatedFilters: CardFilterState = {
      ...filters,
      ...statFilter
    };
    dispatch(setAllFilters(updatedFilters));
    fetchRandomCard(updatedFilters);
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    dispatch(setTotalMatches(undefined));
    dispatch(setCardError(null));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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
        onDrawRandom={() => fetchRandomCard()}
        onResetFilters={handleResetFilters}
        isLoading={isLoading}
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

      {/* Card Showcase Area */}
      {currentCard && (
        <div className="relative">
          <CardDisplay
            card={currentCard}
            onExploreStat={handleExploreStat}
            isLoading={isLoading}
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
