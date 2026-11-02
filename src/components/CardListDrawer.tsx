import React, { useState, useEffect } from 'react';
import { YugiohCard } from '../types/card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openSimilarCardsForCard } from '../store/slices/cardsSlice';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { CardPreviewModal } from './CardPreviewModal';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { useOverlayTransition } from '../hooks/useOverlayTransition';
import { getCardSmallImageUrl } from '../utils/cardFormatters';

export interface CardListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  title: string;
  subtitle: string;
  count: number;
  accentColor: 'amber' | 'red';
  headerIcon: React.ReactNode;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  cards: YugiohCard[];
  onSelectCard: (card: YugiohCard) => void;
  onClearAll?: () => void;
  clearAllTitle?: string;
  renderCardAction: (card: YugiohCard) => React.ReactNode;
}

export const CardListDrawer: React.FC<CardListDrawerProps> = ({
  isOpen,
  onClose,
  side,
  title,
  subtitle,
  count,
  accentColor,
  headerIcon,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  cards,
  onSelectCard,
  onClearAll,
  clearAllTitle = 'Clear all',
  renderCardAction
}) => {
  const dispatch = useAppDispatch();
  const currentCardId = useAppSelector((state) => state.cards.currentCard?.id);
  const [previewCard, setPreviewCard] = useState<YugiohCard | null>(null);

  useModalBackHandler(isOpen, onClose);

  const { shouldRender, isVisible } = useOverlayTransition({
    isOpen,
    onClose,
    exitDurationMs: 300,
    disableEscape: Boolean(previewCard)
  });

  useEffect(() => {
    if (!isOpen) {
      setPreviewCard(null);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const isRight = side === 'right';
  const isRed = accentColor === 'red';

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex ${
        isRight ? 'justify-end' : 'justify-start'
      } transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 w-full max-w-md bg-slate-900 ${
          isRight ? 'border-l' : 'border-r'
        } border-slate-800 h-full flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isVisible
            ? 'translate-x-0'
            : isRight
            ? 'translate-x-full'
            : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isRed
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}
            >
              {headerIcon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{title}</span>
                <span
                  className={`text-xs font-mono font-normal px-2 py-0.5 rounded-full border ${
                    isRed
                      ? 'bg-red-950/60 text-red-300 border-red-800/40'
                      : 'bg-slate-800 text-amber-300 border-slate-700'
                  }`}
                >
                  {count}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {count > 0 && onClearAll && (
              <button
                onClick={onClearAll}
                title={clearAllTitle}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cards.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div
                className={`w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 ${
                  isRed ? 'text-red-400/50' : 'text-slate-600'
                }`}
              >
                {emptyIcon}
              </div>
              <p className="text-sm font-semibold text-slate-300">{emptyTitle}</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                {emptyDescription}
              </p>
            </div>
          ) : (
            cards.map((card, index) => {
              const image = getCardSmallImageUrl(card);
              const isCurrent = currentCardId === card.id;

              return (
                <div
                  key={`${card.id}-${index}`}
                  className={`group p-3 bg-slate-950/80 hover:bg-slate-800/80 border ${
                    isCurrent && !isRed
                      ? 'border-amber-500/40'
                      : 'border-slate-800/80'
                  } ${
                    isRed ? 'hover:border-red-500/24' : 'hover:border-amber-500/30'
                  } rounded-xl transition-all flex items-center justify-between gap-3`}
                >
                  <div
                    onClick={() => setPreviewCard(card)}
                    title="Click to preview card details"
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={image}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-16 object-cover rounded border border-slate-700 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4
                          className={`text-sm font-bold text-slate-100 ${
                            isRed ? 'group-hover:text-red-300' : 'group-hover:text-amber-300'
                          } truncate`}
                        >
                          {card.name}
                        </h4>
                        {isCurrent && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="truncate">{card.race}</span>
                        {card.attribute && (
                          <>
                            <span>·</span>
                            <span>{card.attribute}</span>
                          </>
                        )}
                        {card.level !== undefined && (
                          <>
                            <span>·</span>
                            <span>★{card.level}</span>
                          </>
                        )}
                      </div>
                      {card.atk !== undefined && (
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          ATK: {card.atk} {card.def !== undefined ? `/ DEF: ${card.def}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {renderCardAction(card)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCard(card);
                        onClose();
                      }}
                      title="Select card immediately"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Card Preview Modal */}
      <CardPreviewModal
        card={previewCard}
        onClose={() => setPreviewCard(null)}
        onSelectCard={(selected) => {
          setPreviewCard(null);
          onSelectCard(selected);
          onClose();
        }}
        onViewSimilarCards={(selected) => {
          setPreviewCard(null);
          onClose();
          dispatch(openSimilarCardsForCard(selected));
        }}
        isCurrentCard={Boolean(previewCard && currentCardId === previewCard.id)}
      />
    </div>
  );
};
