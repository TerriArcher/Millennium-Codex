import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CardFilterState } from '../../types/card';

const FILTERS_STORAGE_KEY = 'millennium_codex_active_filters';

function cleanFilters(filters: CardFilterState): CardFilterState {
  const cleaned: CardFilterState = {};
  (Object.keys(filters) as Array<keyof CardFilterState>).forEach((key) => {
    const val = filters[key];
    if (val !== undefined && val !== '' && val !== null) {
      (cleaned as any)[key] = val;
    }
  });
  return cleaned;
}

function loadFiltersFromStorage(): CardFilterState {
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return cleanFilters(parsed);
      }
    }
  } catch (e) {
    console.warn('Failed to load filters from sessionStorage', e);
  }
  return {};
}

function saveFiltersToStorage(filters: CardFilterState) {
  try {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(cleanFilters(filters)));
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
      const { key, value } = action.payload;
      if (value === undefined || value === '' || value === null) {
        delete state[key];
      } else {
        (state as any)[key] = value;
      }
      saveFiltersToStorage(state);
    },
    toggleFilterField: (state, action: PayloadAction<SetFilterFieldPayload>) => {
      const { key, value } = action.payload;
      const currentVal = (state as any)[key];
      if (
        currentVal !== undefined &&
        String(currentVal).toLowerCase() === String(value).toLowerCase()
      ) {
        delete state[key];
      } else {
        (state as any)[key] = value;
      }
      saveFiltersToStorage(state);
    },
    setAllFilters: (_state, action: PayloadAction<CardFilterState>) => {
      const updated = cleanFilters(action.payload);
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
