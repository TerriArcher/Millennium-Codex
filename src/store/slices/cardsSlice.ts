import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { YugiohCard } from '../../types/card';
import { INITIAL_ACE_CARDS } from '../../data/fallbackCards';

const MAX_CACHED_CARDS = 100;

interface CardsState {
  currentCard: YugiohCard;
  cardEntities: Record<number, YugiohCard>;
  entityOrder: number[];
  totalMatches?: number;
  isLoading: boolean;
  error: string | null;
}

const initialCard = INITIAL_ACE_CARDS[Math.floor(Math.random() * INITIAL_ACE_CARDS.length)];

const initialState: CardsState = {
  currentCard: initialCard,
  cardEntities: { [initialCard.id]: initialCard },
  entityOrder: [initialCard.id],
  totalMatches: undefined,
  isLoading: false,
  error: null
};

export const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    setCurrentCard: (state, action: PayloadAction<YugiohCard>) => {
      const card = action.payload;
      state.currentCard = card;
      state.error = null;

      // LRU cache management
      if (!state.cardEntities[card.id]) {
        if (state.entityOrder.length >= MAX_CACHED_CARDS) {
          const oldestId = state.entityOrder.shift();
          if (oldestId) {
            delete state.cardEntities[oldestId];
          }
        }
        state.cardEntities[card.id] = card;
        state.entityOrder.push(card.id);
      } else {
        // Move to end of LRU list
        state.entityOrder = state.entityOrder.filter((id) => id !== card.id);
        state.entityOrder.push(card.id);
      }
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
    }
  }
});

export const { setCurrentCard, setTotalMatches, setCardLoading, setCardError } = cardsSlice.actions;
export default cardsSlice.reducer;
