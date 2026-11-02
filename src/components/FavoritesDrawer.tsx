import React from 'react';
import { YugiohCard } from '../types/card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeFavorite, clearFavorites } from '../store/slices/historySlice';
import { Heart, Trash2 } from 'lucide-react';
import { FALLBACK_CARDS } from '../data/fallbackCards';
import { CardListDrawer } from './CardListDrawer';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: YugiohCard) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  onSelectCard
}) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.history.favorites);
  const favoriteCardsMap = useAppSelector((state) => state.history.favoriteCards);
  const history = useAppSelector((state) => state.history.history);

  const resolvedCards: YugiohCard[] = favorites
    .map((id) => {
      if (favoriteCardsMap[id]) return favoriteCardsMap[id];
      const inHistory = history.find((c) => c.id === id);
      if (inHistory) return inHistory;
      const fallback = FALLBACK_CARDS.find((c) => c.id === id);
      if (fallback) return fallback;
      return null;
    })
    .filter(Boolean) as YugiohCard[];

  return (
    <CardListDrawer
      isOpen={isOpen}
      onClose={onClose}
      side="left"
      title="Favorites"
      subtitle="Your bookmarked Yu-Gi-Oh! cards"
      count={favorites.length}
      accentColor="red"
      headerIcon={<Heart className="w-4 h-4 fill-red-500" />}
      emptyIcon={<Heart className="w-8 h-8" />}
      emptyTitle="No favorite cards yet"
      emptyDescription="Click the heart icon on any card display to bookmark it here for quick access at any time."
      cards={resolvedCards}
      onSelectCard={onSelectCard}
      onClearAll={() => dispatch(clearFavorites())}
      clearAllTitle="Clear all favorites"
      renderCardAction={(card) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch(removeFavorite(card.id));
          }}
          title="Remove from favorites"
          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    />
  );
};
