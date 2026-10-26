import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CardFilterState } from '../../types/card';

const FILTERS_STORAGE_KEY = 'millennium_codex_active_filters';

function loadFiltersFromStorage(): CardFilterState {
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load filters from sessionStorage', e);
  }
  return {};
}

function saveFiltersToStorage(filters: CardFilterState) {
  try {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.warn('Failed to save filters to sessionStorage', e);
  }
}

const initialState: CardFilterState = loadFiltersFromStorage();

export interface SetFilterFieldPayload {
  key: keyof CardFilterState;
  value: any;
  typeOverride?: string;
}

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilterField: (state, action: PayloadAction<SetFilterFieldPayload>) => {
      const { key, value, typeOverride } = action.payload;
      if (value === undefined || value === '') {
        delete state[key];
      } else {
        (state as any)[key] = value;
      }
      if (typeOverride) {
        state.type = typeOverride;
      }
      saveFiltersToStorage(state);
    },
    toggleFilterField: (state, action: PayloadAction<SetFilterFieldPayload>) => {
      const { key, value, typeOverride } = action.payload;
      const currentVal = (state as any)[key];
      if (currentVal === value) {
        delete state[key];
      } else {
        (state as any)[key] = value;
        if (typeOverride) {
          state.type = typeOverride;
        }
      }
      saveFiltersToStorage(state);
    },
    setAllFilters: (_state, action: PayloadAction<CardFilterState>) => {
      const updated = { ...action.payload };
      saveFiltersToStorage(updated);
      return updated;
    },
    resetFilters: () => {
      saveFiltersToStorage({});
      return {};
    }
  }
});

export const { setFilterField, toggleFilterField, setAllFilters, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
