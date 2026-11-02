import { useCallback } from 'react';
import { CardFilterState } from '../types/card';
import { FALLBACK_CARDS } from '../data/fallbackCards';
import {
  fetchRandomCardFromApi,
  filterFallbackCards,
  getAllMatchingCards
} from '../services/ygoprodeckApi';
import { store } from '../store';
import { useAppDispatch } from '../store/hooks';
import {
  setCurrentCard,
  setTotalMatches,
  setCardLoading,
  setCardError,
  setIsMatchingSheetOpen,
  setMatchingCards,
  setIsMatchingLoading,
  recordNewDraw
} from '../store/slices/cardsSlice';
import {
  addCardToHistory,
  setIsQuickDrawing
} from '../store/slices/historySlice';

export interface DrawRandomCardOptions {
  appliedFilters?: CardFilterState;
  mode?: 'primary' | 'quick';
  force?: boolean;
  onCycleReset?: () => void;
  onDoneNavigate?: () => void;
}

/**
 * Shared hook unifying random card drawing and matching-cards pool loading
 * across App.tsx (Navbar Quick Draw & pool viewer) and CardRandomizerPage.tsx.
 */
export function useCardActions() {
  const dispatch = useAppDispatch();

  const openMatchingCardsSheet = useCallback(
    async (overrideFilters?: CardFilterState) => {
      const activeFilters = overrideFilters ?? store.getState().filters;
      dispatch(setIsMatchingSheetOpen(true));
      dispatch(setIsMatchingLoading(true));
      try {
        const allCards = await getAllMatchingCards(activeFilters);
        dispatch(setMatchingCards(allCards));
      } catch (err) {
        console.warn('Failed to load matching cards for sheet:', err);
        dispatch(setMatchingCards([]));
      } finally {
        dispatch(setIsMatchingLoading(false));
      }
    },
    [dispatch]
  );

  const drawRandomCard = useCallback(
    async (options: DrawRandomCardOptions = {}) => {
      const {
        appliedFilters,
        mode = 'primary',
        force = false,
        onCycleReset,
        onDoneNavigate
      } = options;
      const state = store.getState();

      if (
        state.cards.isLoading ||
        state.history.isQuickDrawing ||
        (!force && state.cards.isCardAnimating)
      ) {
        return;
      }

      const currentCard = state.cards.currentCard;
      const activeFilters = appliedFilters !== undefined ? appliedFilters : state.filters;

      if (mode === 'quick') {
        dispatch(setIsQuickDrawing(true));
      } else {
        dispatch(setCardLoading(true));
      }
      dispatch(setCardError(null));

      try {
        let data = await fetchRandomCardFromApi(activeFilters, currentCard?.id);

        if (
          data.card &&
          currentCard &&
          data.card.id === currentCard.id &&
          data.totalMatches > 1
        ) {
          const retryData = await fetchRandomCardFromApi(activeFilters, currentCard.id);
          if (retryData.card) {
            data = retryData;
          }
        }

        if (data.card) {
          dispatch(recordNewDraw());
          dispatch(setCurrentCard(data.card));
          dispatch(setTotalMatches(data.totalMatches));
          dispatch(addCardToHistory(data.card));

          if (data.isCycleReset) {
            onCycleReset?.();
          }
          onDoneNavigate?.();
        }
      } catch (err: any) {
        if (err?.status === 404 && !force) {
          dispatch(
            setCardError(
              'No card matching this exact criteria was found. Try loosening the filters.'
            )
          );
          onDoneNavigate?.();
          return;
        }
        if (err?.status === 404 && force) {
          try {
            const unfilteredData = await fetchRandomCardFromApi({}, currentCard?.id);
            if (unfilteredData.card) {
              dispatch(recordNewDraw());
              dispatch(setCurrentCard(unfilteredData.card));
              dispatch(addCardToHistory(unfilteredData.card));
              onDoneNavigate?.();
              return;
            }
          } catch {
            // Fall through to local fallback pool below
          }
        }
        console.warn('Draw error, using local fallback pool:', err);
        let pool = filterFallbackCards(activeFilters, currentCard?.id);
        if (pool.length === 0) pool = FALLBACK_CARDS;
        if (currentCard && pool.length > 1) {
          pool = pool.filter((c) => c.id !== currentCard.id);
        }
        const fallback = pool[Math.floor(Math.random() * pool.length)];
        dispatch(recordNewDraw());
        dispatch(setCurrentCard(fallback));
        dispatch(addCardToHistory(fallback));
        onDoneNavigate?.();
      } finally {
        if (mode === 'quick') {
          dispatch(setIsQuickDrawing(false));
        } else {
          dispatch(setCardLoading(false));
        }
      }
    },
    [dispatch]
  );

  return {
    drawRandomCard,
    openMatchingCardsSheet
  };
}
