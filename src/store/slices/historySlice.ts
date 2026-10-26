import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { YugiohCard } from '../../types/card';
import { INITIAL_ACE_CARDS, FALLBACK_CARDS } from '../../data/fallbackCards';

const MAX_HISTORY = 50;
const FAVORITES_STORAGE_KEY = 'millennium_codex_favs';
const FAV_CARDS_STORAGE_KEY = 'millennium_codex_fav_cards';

function loadFavoritesFromStorage(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number);
    }
  } catch (e) {
    console.warn('Failed to load favorites from localStorage', e);
  }
  return [];
}

function saveFavoritesToStorage(favs: number[]) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs.slice(0, 200)));
  } catch (e) {
    console.warn('Failed to save favorites to localStorage', e);
  }
}

function loadFavoriteCardsFromStorage(): Record<number, YugiohCard> {
  const map: Record<number, YugiohCard> = {};
  // Prepopulate with fallback cards
  FALLBACK_CARDS.forEach((c) => {
    map[c.id] = c;
  });
  try {
    const raw = localStorage.getItem(FAV_CARDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(map, parsed);
      }
    }
  } catch (e) {
    console.warn('Failed to load favorite cards from localStorage', e);
  }
  return map;
}

function saveFavoriteCardsToStorage(cardsMap: Record<number, YugiohCard>) {
  try {
    localStorage.setItem(FAV_CARDS_STORAGE_KEY, JSON.stringify(cardsMap));
  } catch (e) {
    console.warn('Failed to save favorite cards to localStorage', e);
  }
}

interface HistoryState {
  history: YugiohCard[];
  favorites: number[];
  favoriteCards: Record<number, YugiohCard>;
  isHistoryOpen: boolean;
  isFavoritesOpen: boolean;
  isQuickDrawing: boolean;
}

const initialAce = INITIAL_ACE_CARDS[Math.floor(Math.random() * INITIAL_ACE_CARDS.length)];

const initialState: HistoryState = {
  history: [initialAce],
  favorites: loadFavoritesFromStorage(),
  favoriteCards: loadFavoriteCardsFromStorage(),
  isHistoryOpen: false,
  isFavoritesOpen: false,
  isQuickDrawing: false
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addCardToHistory: (state, action: PayloadAction<YugiohCard>) => {
      const card = action.payload;
      if (state.history.length > 0 && state.history[0].id === card.id) {
        return;
      }
      state.history = [card, ...state.history.slice(0, MAX_HISTORY - 1)];
      // Also cache in favoriteCards map in case it gets favorited
      state.favoriteCards[card.id] = card;
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
      } else {
        state.favorites.push(cardId);
        if (cardObj) {
          state.favoriteCards[cardId] = cardObj;
        } else if (!state.favoriteCards[cardId]) {
          const inHist = state.history.find((c) => c.id === cardId);
          if (inHist) {
            state.favoriteCards[cardId] = inHist;
          }
        }
      }
      saveFavoritesToStorage(state.favorites);
      saveFavoriteCardsToStorage(state.favoriteCards);
    },
    removeFavorite: (state, action: PayloadAction<number>) => {
      const cardId = action.payload;
      state.favorites = state.favorites.filter((id) => id !== cardId);
      saveFavoritesToStorage(state.favorites);
    },
    clearFavorites: (state) => {
      state.favorites = [];
      saveFavoritesToStorage([]);
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
