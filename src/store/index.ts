import { configureStore } from '@reduxjs/toolkit';
import filtersReducer from './slices/filtersSlice';
import cardsReducer from './slices/cardsSlice';
import historyReducer from './slices/historySlice';

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    cards: cardsReducer,
    history: historyReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
