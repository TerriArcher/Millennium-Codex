/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CardRandomizerPage } from './pages/CardRandomizerPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { HistoryDrawer } from './components/HistoryDrawer';
import { YugiohCard } from './types/card';
import { FALLBACK_CARDS, INITIAL_ACE_CARDS } from './data/fallbackCards';
import { fetchRandomCardFromApi } from './services/ygoprodeckApi';

function AppContent() {
  const [currentCard, setCurrentCard] = useState<YugiohCard>(() => {
    return INITIAL_ACE_CARDS[Math.floor(Math.random() * INITIAL_ACE_CARDS.length)];
  });
  const [history, setHistory] = useState<YugiohCard[]>(() => [
    INITIAL_ACE_CARDS[Math.floor(Math.random() * INITIAL_ACE_CARDS.length)]
  ]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQuickDrawing, setIsQuickDrawing] = useState(false);

  const navigate = useNavigate();

  const handleCardDrawn = (card: YugiohCard) => {
    setHistory((prev) => {
      // Avoid duplicate consecutive entries
      if (prev.length > 0 && prev[0].id === card.id) return prev;
      return [card, ...prev.slice(0, 49)];
    });
  };

  const handleQuickDraw = async () => {
    setIsQuickDrawing(true);
    try {
      const data = await fetchRandomCardFromApi({}, currentCard?.id);
      if (data.card) {
        setCurrentCard(data.card);
        handleCardDrawn(data.card);
        navigate('/');
      }
    } catch (err) {
      console.warn('Quick draw error, fallback:', err);
      let pool = FALLBACK_CARDS;
      if (currentCard && pool.length > 1) {
        pool = pool.filter((c) => c.id !== currentCard.id);
      }
      const randomCard = pool[Math.floor(Math.random() * pool.length)];
      setCurrentCard(randomCard);
      handleCardDrawn(randomCard);
      navigate('/');
    } finally {
      setIsQuickDrawing(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500/20 selection:text-amber-300">
      <Navbar
        onQuickDraw={handleQuickDraw}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        isLoading={isQuickDrawing}
      />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <CardRandomizerPage
                onCardDrawn={handleCardDrawn}
                currentCard={currentCard}
                setCurrentCard={setCurrentCard}
              />
            }
          />
          <Route path="/resources" element={<ResourcesPage />} />
        </Routes>
      </main>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectCard={(card) => {
          setCurrentCard(card);
          navigate('/');
        }}
        onClearHistory={handleClearHistory}
      />

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
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
