/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  setCurrentCard,
  setIsMatchingSheetOpen
} from './store/slices/cardsSlice';
import {
  addCardToHistory,
  removeCardFromHistory,
  clearHistory,
  setIsHistoryOpen,
  setIsFavoritesOpen
} from './store/slices/historySlice';
import { Navbar } from './components/Navbar';
import { CardRandomizerPage } from './pages/CardRandomizerPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { HistoryDrawer } from './components/HistoryDrawer';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { MatchingCardsSheet } from './components/MatchingCardsSheet';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { YugiohCard } from './types/card';
import { useCardActions } from './hooks/useCardActions';

function AppContent() {
  const dispatch = useAppDispatch();
  const currentCard = useAppSelector((state) => state.cards.currentCard);
  const filters = useAppSelector((state) => state.filters);
  const history = useAppSelector((state) => state.history.history);
  const favorites = useAppSelector((state) => state.history.favorites);
  const isHistoryOpen = useAppSelector((state) => state.history.isHistoryOpen);
  const isFavoritesOpen = useAppSelector((state) => state.history.isFavoritesOpen);
  const isCardLoading = useAppSelector((state) => state.cards.isLoading);
  const isQuickDrawing = useAppSelector((state) => state.history.isQuickDrawing);
  const isCardAnimating = useAppSelector((state) => state.cards.isCardAnimating);
  const isDrawDisabled = isCardLoading || isQuickDrawing || isCardAnimating;
  const totalMatches = useAppSelector((state) => state.cards.totalMatches);
  const isMatchingSheetOpen = useAppSelector((state) => state.cards.isMatchingSheetOpen);
  const matchingCards = useAppSelector((state) => state.cards.matchingCards);
  const isMatchingLoading = useAppSelector((state) => state.cards.isMatchingLoading);

  const navigate = useNavigate();
  const { drawRandomCard, openMatchingCardsSheet } = useCardActions();

  const handleQuickDraw = () => {
    void drawRandomCard({
      mode: 'quick',
      onDoneNavigate: () => navigate('/')
    });
  };

  const handleSelectCard = (card: YugiohCard) => {
    dispatch(setCurrentCard(card));
    navigate('/');
  };

  const handleClearHistory = () => {
    dispatch(clearHistory(currentCard));
  };

  const handleDeleteHistoryCard = (cardToDelete: YugiohCard) => {
    const isDeletingCurrent = currentCard?.id === cardToDelete.id;
    const deletedIndex = history.findIndex((c) => c.id === cardToDelete.id);
    const remainingCards = history.filter((c) => c.id !== cardToDelete.id);

    dispatch(removeCardFromHistory(cardToDelete.id));

    if (isDeletingCurrent) {
      if (remainingCards.length === 0) {
        void drawRandomCard({
          mode: 'quick',
          force: true
        });
      } else {
        const nextIndex =
          deletedIndex >= 0 ? Math.min(deletedIndex, remainingCards.length - 1) : 0;
        dispatch(setCurrentCard(remainingCards[nextIndex]));
      }
    }
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== null
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500/20 selection:text-amber-300 w-full max-w-full">
      <Navbar
        onQuickDraw={handleQuickDraw}
        historyCount={history.length}
        onOpenHistory={() => dispatch(setIsHistoryOpen(true))}
        favoritesCount={favorites.length}
        onOpenFavorites={() => dispatch(setIsFavoritesOpen(true))}
        isLoading={isDrawDisabled}
        activeFiltersCount={activeFiltersCount}
        totalMatches={totalMatches}
        onOpenMatchingCards={() => void openMatchingCardsSheet()}
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
        onClearHistory={handleClearHistory}
        onDeleteCard={handleDeleteHistoryCard}
      />

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => dispatch(setIsFavoritesOpen(false))}
        onSelectCard={handleSelectCard}
      />

      <MatchingCardsSheet
        isOpen={isMatchingSheetOpen}
        onClose={() => dispatch(setIsMatchingSheetOpen(false))}
        cards={matchingCards}
        isLoading={isMatchingLoading}
        currentCardId={currentCard?.id}
        onSelectCard={(c) => {
          dispatch(setCurrentCard(c));
          dispatch(addCardToHistory(c));
          dispatch(setIsMatchingSheetOpen(false));
          navigate('/');
        }}
        activeFilters={filters}
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
