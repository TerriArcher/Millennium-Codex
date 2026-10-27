import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { YugiohCard } from '../../types/card';
import { INITIAL_START_CARD } from '../../data/fallbackCards';
import { normalizeCard } from '../../services/ygoprodeckApi';

interface CardsState {
  currentCard: YugiohCard;
  totalMatches?: number;
  isLoading: boolean;
  error: string | null;
  isMatchingSheetOpen: boolean;
  matchingCards: YugiohCard[];
  isMatchingLoading: boolean;
  drawCount: number;
  isCardAnimating: boolean;
}

const initialCard = normalizeCard(INITIAL_START_CARD);

const initialState: CardsState = {
  currentCard: initialCard,
  totalMatches: 13000,
  isLoading: false,
  error: null,
  isMatchingSheetOpen: false,
  matchingCards: [],
  isMatchingLoading: false,
  drawCount: 0,
  isCardAnimating: false
};

export const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    setCurrentCard: (state, action: PayloadAction<YugiohCard>) => {
      state.currentCard = normalizeCard(action.payload);
      state.error = null;
    },
    setTotalMatches: (state, action: PayloadAction<number | undefined>) => {
      state.totalMatches = action.payload;
    },
    setCardLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCardError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
      if (action.payload) {
        state.isCardAnimating = false;
      }
    },
    setIsMatchingSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.isMatchingSheetOpen = action.payload;
    },
    setMatchingCards: (state, action: PayloadAction<YugiohCard[]>) => {
      state.matchingCards = action.payload;
    },
    setIsMatchingLoading: (state, action: PayloadAction<boolean>) => {
      state.isMatchingLoading = action.payload;
    },
    recordNewDraw: (state) => {
      state.drawCount += 1;
      state.isCardAnimating = true;
    },
    setCardAnimating: (state, action: PayloadAction<boolean>) => {
      state.isCardAnimating = action.payload;
    }
  }
});

export const {
  setCurrentCard,
  setTotalMatches,
  setCardLoading,
  setCardError,
  setIsMatchingSheetOpen,
  setMatchingCards,
  setIsMatchingLoading,
  recordNewDraw,
  setCardAnimating
} = cardsSlice.actions;
export default cardsSlice.reducer;
