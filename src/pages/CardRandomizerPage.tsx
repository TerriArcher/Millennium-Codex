import React, { useState, useEffect } from 'react';
import { YugiohCard, CardFilterState } from '../types/card';
import { FilterBar } from '../components/FilterBar';
import { CardDisplay } from '../components/CardDisplay';
import { FALLBACK_CARDS, INITIAL_ACE_CARDS } from '../data/fallbackCards';
import { AlertCircle, Shuffle, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CardRandomizerPageProps {
  onCardDrawn: (card: YugiohCard) => void;
  currentCard: YugiohCard | null;
  setCurrentCard: (card: YugiohCard) => void;
}

export const CardRandomizerPage: React.FC<CardRandomizerPageProps> = ({
  onCardDrawn,
  currentCard,
  setCurrentCard
}) => {
  const [filters, setFilters] = useState<CardFilterState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [totalMatches, setTotalMatches] = useState<number | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Function to fetch a random card from Express backend with non-duplication guarantee
  const fetchRandomCard = async (appliedFilters: CardFilterState = filters) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams();
      if (appliedFilters.type) params.append('type', appliedFilters.type);
      if (appliedFilters.superType) params.append('superType', appliedFilters.superType);
      if (appliedFilters.attribute) params.append('attribute', appliedFilters.attribute);
      if (appliedFilters.level !== undefined && appliedFilters.level !== '') {
        params.append('level', String(appliedFilters.level));
      }
      if (appliedFilters.scale !== undefined && appliedFilters.scale !== '') {
        params.append('scale', String(appliedFilters.scale));
      }
      if (appliedFilters.race) params.append('race', appliedFilters.race);
      if (appliedFilters.atk !== undefined && appliedFilters.atk !== '') {
        params.append('atk', String(appliedFilters.atk));
      }
      if (appliedFilters.def !== undefined && appliedFilters.def !== '') {
        params.append('def', String(appliedFilters.def));
      }
      if (appliedFilters.archetype) params.append('archetype', appliedFilters.archetype);
      if (appliedFilters.keyword) params.append('fname', appliedFilters.keyword);

      // Rule: The "Draw Random Card" button should never display the most recent card
      if (currentCard?.id) {
        params.append('excludeId', String(currentCard.id));
      }

      const url = `/api/cards/random${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          setErrorMsg('No card matching this exact criteria was found. Try loosening the filters.');
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to load card: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.card) {
        // Double check client-side: never display the same card if another can be drawn
        if (currentCard && data.card.id === currentCard.id && data.totalMatches > 1) {
          // Re-roll once to ensure a new card is drawn
          const retryRes = await fetch(url);
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (retryData.card) {
              setCurrentCard(retryData.card);
              setTotalMatches(retryData.totalMatches);
              onCardDrawn(retryData.card);
              setIsLoading(false);
              return;
            }
          }
        }

        setCurrentCard(data.card);
        setTotalMatches(data.totalMatches);
        onCardDrawn(data.card);
      }
    } catch (err: any) {
      console.warn('Backend fetch error, using local seed fallback:', err);
      // Select non-recent card from fallback
      let pool = FALLBACK_CARDS;
      if (currentCard && pool.length > 1) {
        pool = pool.filter((c) => c.id !== currentCard.id);
      }
      const fallback = pool[Math.floor(Math.random() * pool.length)];
      setCurrentCard(fallback);
      onCardDrawn(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial draw if no card is present
  useEffect(() => {
    if (!currentCard) {
      const initial = INITIAL_ACE_CARDS[Math.floor(Math.random() * INITIAL_ACE_CARDS.length)];
      setCurrentCard(initial);
      onCardDrawn(initial);
    }
  }, []);

  // Chained Exploration Handler
  const handleExploreStat = (statFilter: {
    attribute?: string;
    level?: number;
    race?: string;
    type?: string;
    superType?: string;
    archetype?: string;
    scale?: number;
    atk?: number;
    def?: number;
  }) => {
    const updatedFilters: CardFilterState = {
      ...filters,
      ...statFilter
    };
    setFilters(updatedFilters);
    fetchRandomCard(updatedFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
    setTotalMatches(undefined);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white mb-2">
          Random Yu-Gi-Oh! Card Generator
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Discover cards sourced live from the YGOPRODeck database. Filter by Super Types, Attributes, Scales, or click any stat or archetype below to surf related cards!
        </p>
      </div>

      {/* Filter Control Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
        }}
        onDrawRandom={() => fetchRandomCard(filters)}
        onResetFilters={handleResetFilters}
        isLoading={isLoading}
        totalMatches={totalMatches}
      />

      {/* Error message if no match found */}
      {errorMsg && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="underline hover:text-white font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Card Showcase Area */}
      {currentCard && (
        <div className="relative">
          <CardDisplay
            card={currentCard}
            onExploreStat={handleExploreStat}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Bottom Quick Links to Meta Resources */}
      <div className="mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>Looking for competitive tournament decks and banlist tier lists?</span>
        </div>
        <Link
          to="/resources"
          className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
        >
          Explore YugiohMeta & MasterduelMeta Resources →
        </Link>
      </div>
    </div>
  );
};
