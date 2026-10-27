import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { YugiohCard } from '../../types/card';
import { INITIAL_START_CARD, FALLBACK_CARDS } from '../../data/fallbackCards';
import { normalizeCard } from '../../services/ygoprodeckApi';

const MAX_HISTORY = 30;
const MAX_FAVORITES = 100;
const FAVORITES_STORAGE_KEY = 'millennium_codex_favs';
const FAV_CARDS_STORAGE_KEY = 'millennium_codex_fav_cards';

function loadFavoritesFromStorage(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.map(Number).filter((n) => !isNaN(n)))).slice(
          0,
          MAX_FAVORITES
        );
      }
    }
  } catch (e) {
    console.warn('Failed to load favorites from localStorage', e);
  }
  return [];
}

function saveFavoritesToStorage(favs: number[]) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs.slice(0, MAX_FAVORITES)));
  } catch (e) {
    console.warn('Failed to save favorites to localStorage', e);
  }
}

function saveFavoriteCardsToStorage(
  cardsMap: Record<number, YugiohCard>,
  activeFavIds: number[]
) {
  try {
    const favSet = new Set(activeFavIds);
    const prunedMap: Record<number, YugiohCard> = {};
    for (const id of favSet) {
      if (cardsMap[id]) {
        prunedMap[id] = normalizeCard(cardsMap[id]);
      }
    }
    localStorage.setItem(FAV_CARDS_STORAGE_KEY, JSON.stringify(prunedMap));
  } catch (e) {
    console.warn('Failed to save favorite cards to localStorage', e);
  }
}

function loadFavoriteCardsFromStorage(activeFavIds: number[]): Record<number, YugiohCard> {
  const favSet = new Set(activeFavIds);
  const prunedMap: Record<number, YugiohCard> = {};
  if (favSet.size === 0) {
    // Clean up any stale bloated map in localStorage when no favorites are active
    try {
      localStorage.removeItem(FAV_CARDS_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    return prunedMap;
  }

  try {
    const raw = localStorage.getItem(FAV_CARDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const id of favSet) {
          if (parsed[id]) {
            prunedMap[id] = normalizeCard(parsed[id]);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load favorite cards from localStorage', e);
  }

  // Resolve any missing favorite from fallback cards if available
  for (const id of favSet) {
    if (!prunedMap[id]) {
      const fb = FALLBACK_CARDS.find((c) => c.id === id);
      if (fb) {
        prunedMap[id] = normalizeCard(fb);
      }
    }
  }

  // Replace localStorage with the strictly pruned & slimmed map
  saveFavoriteCardsToStorage(prunedMap, activeFavIds);
  return prunedMap;
}

interface HistoryState {
  history: YugiohCard[];
  favorites: number[];
  favoriteCards: Record<number, YugiohCard>;
  isHistoryOpen: boolean;
  isFavoritesOpen: boolean;
  isQuickDrawing: boolean;
}

const initialAce = normalizeCard(INITIAL_START_CARD);
const initialFavorites = loadFavoritesFromStorage();

const initialState: HistoryState = {
  history: [initialAce],
  favorites: initialFavorites,
  favoriteCards: loadFavoriteCardsFromStorage(initialFavorites),
  isHistoryOpen: false,
  isFavoritesOpen: false,
  isQuickDrawing: false
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addCardToHistory: (state, action: PayloadAction<YugiohCard>) => {
      const card = normalizeCard(action.payload);
      if (state.history.length > 0 && state.history[0].id === card.id) {
        return;
      }
      // Promote position to top of recent history instead of duplicating
      const remainingHistory = state.history.filter((c) => c.id !== card.id);
      state.history = [card, ...remainingHistory.slice(0, MAX_HISTORY - 1)];

      // Only update favoriteCards if this card is actually favorited
      if (state.favorites.includes(card.id)) {
        state.favoriteCards[card.id] = card;
        saveFavoriteCardsToStorage(state.favoriteCards, state.favorites);
      }
    },
    clearHistory: (state) => {
      state.history = [];
    },
    toggleFavorite: (
      state,
      action: PayloadAction<{ id: number; card?: YugiohCard } | number>
    ) => {
      const cardId = typeof action.payload === 'number' ? action.payload : action.payload.id;
      const cardObj = typeof action.payload === 'object' ? action.payload.card : undefined;

      if (state.favorites.includes(cardId)) {
        state.favorites = state.favorites.filter((id) => id !== cardId);
        delete state.favoriteCards[cardId];
      } else {
        if (state.favorites.length >= MAX_FAVORITES) {
          const evictedId = state.favorites.shift();
          if (evictedId !== undefined) {
            delete state.favoriteCards[evictedId];
          }
        }
        state.favorites.push(cardId);
        if (cardObj) {
          state.favoriteCards[cardId] = normalizeCard(cardObj);
        } else if (!state.favoriteCards[cardId]) {
          const inHist = state.history.find((c) => c.id === cardId);
          if (inHist) {
            state.favoriteCards[cardId] = normalizeCard(inHist);
          }
        }
      }
      saveFavoritesToStorage(state.favorites);
      saveFavoriteCardsToStorage(state.favoriteCards, state.favorites);
    },
    removeFavorite: (state, action: PayloadAction<number>) => {
      const cardId = action.payload;
      state.favorites = state.favorites.filter((id) => id !== cardId);
      delete state.favoriteCards[cardId];
      saveFavoritesToStorage(state.favorites);
      saveFavoriteCardsToStorage(state.favoriteCards, state.favorites);
    },
    clearFavorites: (state) => {
      state.favorites = [];
      state.favoriteCards = {};
      saveFavoritesToStorage([]);
      try {
        localStorage.removeItem(FAV_CARDS_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    },
    setIsHistoryOpen: (state, action: PayloadAction<boolean>) => {
      state.isHistoryOpen = action.payload;
      if (action.payload) {
        state.isFavoritesOpen = false;
      }
    },
    setIsFavoritesOpen: (state, action: PayloadAction<boolean>) => {
      state.isFavoritesOpen = action.payload;
      if (action.payload) {
        state.isHistoryOpen = false;
      }
    },
    setIsQuickDrawing: (state, action: PayloadAction<boolean>) => {
      state.isQuickDrawing = action.payload;
    }
  }
});

export const {
  addCardToHistory,
  clearHistory,
  toggleFavorite,
  removeFavorite,
  clearFavorites,
  setIsHistoryOpen,
  setIsFavoritesOpen,
  setIsQuickDrawing
} = historySlice.actions;

export default historySlice.reducer;
