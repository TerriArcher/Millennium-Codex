/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setCurrentCard, setTotalMatches, setCardError } from './store/slices/cardsSlice';
import {
  addCardToHistory,
  clearHistory,
  setIsHistoryOpen,
  setIsFavoritesOpen,
  setIsQuickDrawing
} from './store/slices/historySlice';
import { Navbar } from './components/Navbar';
import { CardRandomizerPage } from './pages/CardRandomizerPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { HistoryDrawer } from './components/HistoryDrawer';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { YugiohCard } from './types/card';
import { FALLBACK_CARDS } from './data/fallbackCards';
import { fetchRandomCardFromApi, filterFallbackCards } from './services/ygoprodeckApi';

function AppContent() {
  const dispatch = useAppDispatch();
  const currentCard = useAppSelector((state) => state.cards.currentCard);
  const filters = useAppSelector((state) => state.filters);
  const history = useAppSelector((state) => state.history.history);
  const favorites = useAppSelector((state) => state.history.favorites);
  const isHistoryOpen = useAppSelector((state) => state.history.isHistoryOpen);
  const isFavoritesOpen = useAppSelector((state) => state.history.isFavoritesOpen);
  const isQuickDrawing = useAppSelector((state) => state.history.isQuickDrawing);

  const navigate = useNavigate();

  // Quick draw preserves and prioritizes active filters
  const handleQuickDraw = async () => {
    dispatch(setIsQuickDrawing(true));
    dispatch(setCardError(null));

    // Get current active criteria from Redux store
    const activeFilters = store.getState().filters;

    try {
      const data = await fetchRandomCardFromApi(activeFilters, currentCard?.id);
      if (data.card) {
        dispatch(setCurrentCard(data.card));
        dispatch(addCardToHistory(data.card));
        dispatch(setTotalMatches(data.totalMatches));
        navigate('/');
      }
    } catch (err: any) {
      if (err?.status === 404) {
        dispatch(setCardError('No card matching this exact criteria was found. Try loosening the filters.'));
        navigate('/');
        return;
      }
      console.warn('Quick draw error, fallback:', err);
      let pool = filterFallbackCards(activeFilters, currentCard?.id);
      if (pool.length === 0) pool = FALLBACK_CARDS;
      if (currentCard && pool.length > 1) {
        pool = pool.filter((c) => c.id !== currentCard.id);
      }
      const randomCard = pool[Math.floor(Math.random() * pool.length)];
      dispatch(setCurrentCard(randomCard));
      dispatch(addCardToHistory(randomCard));
      navigate('/');
    } finally {
      dispatch(setIsQuickDrawing(false));
    }
  };

  const handleSelectCard = (card: YugiohCard) => {
    dispatch(setCurrentCard(card));
    navigate('/');
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500/20 selection:text-amber-300 w-full max-w-full">
      <Navbar
        onQuickDraw={handleQuickDraw}
        historyCount={history.length}
        onOpenHistory={() => dispatch(setIsHistoryOpen(true))}
        favoritesCount={favorites.length}
        onOpenFavorites={() => dispatch(setIsFavoritesOpen(true))}
        isLoading={isQuickDrawing}
        activeFiltersCount={activeFiltersCount}
      />

      <main className="flex-1 w-full max-w-full">
        <Routes>
          <Route path="/" element={<CardRandomizerPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Routes>
      </main>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => dispatch(setIsHistoryOpen(false))}
        history={history}
        onSelectCard={handleSelectCard}
        onClearHistory={() => dispatch(clearHistory())}
      />

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => dispatch(setIsFavoritesOpen(false))}
        onSelectCard={handleSelectCard}
      />

      <ScrollToTopButton />

      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Millennium Codex</span>
            <span>·</span>
            <span>Card data provided by the official YGOPRODeck API</span>
          </div>
          <div className="text-center sm:text-right">
            Yu-Gi-Oh! is © Studio Dice / SHUEISHA, TV TOKYO, KONAMI. This is an unofficial enthusiast explorer.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}
