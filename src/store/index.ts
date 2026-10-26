import { configureStore } from '@reduxjs/toolkit';
import filtersReducer from './slices/filtersSlice';
import cardsReducer from './slices/cardsSlice';
import historyReducer from './slices/historySlice';
import { ygoprodeckRtkApi } from './api/ygoprodeckApi';

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    cards: cardsReducer,
    history: historyReducer,
    [ygoprodeckRtkApi.reducerPath]: ygoprodeckRtkApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(ygoprodeckRtkApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
