import React from 'react';
import { YugiohCard } from '../types/card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleFavorite } from '../store/slices/historySlice';
import { Clock, Heart, Trash2 } from 'lucide-react';
import { CardListDrawer } from './CardListDrawer';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: YugiohCard[];
  onSelectCard: (card: YugiohCard) => void;
  onClearHistory: () => void;
  onDeleteCard: (card: YugiohCard) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectCard,
  onClearHistory,
  onDeleteCard
}) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.history.favorites);

  return (
    <CardListDrawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      title="Draw History"
      subtitle="Cards drawn during this session"
      count={history.length}
      accentColor="amber"
      headerIcon={<Clock className="w-4 h-4" />}
      emptyIcon={<Clock className="w-8 h-8" />}
      emptyTitle="No cards drawn yet"
      emptyDescription="Cards you draw will appear here so you can revisit them anytime."
      cards={history}
      onSelectCard={onSelectCard}
      onClearAll={history.length > 1 ? onClearHistory : undefined}
      clearAllTitle="Clear draw history (keeps current card)"
      renderCardAction={(card) => {
        const isFav = favorites.includes(card.id);
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch(toggleFavorite({ id: card.id, card }));
              }}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFav
                  ? 'text-red-400 hover:text-red-300 bg-red-950/40'
                  : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-red-400' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCard(card);
              }}
              title="Delete card from history"
              aria-label={`Delete ${card.name} from history`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        );
      }}
    />
  );
};
