import React, { useState, useEffect } from 'react';
import { YugiohCard } from '../types/card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleFavorite } from '../store/slices/historySlice';
import { X, Clock, Trash2, ArrowRight, Heart } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: YugiohCard[];
  onSelectCard: (card: YugiohCard) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectCard,
  onClearHistory
}) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.history.favorites);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let raf1: number;
    let raf2: number;
    let timer: number;

    if (isOpen) {
      setShouldRender(true);
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      timer = window.setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex justify-end transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Draw History</span>
                <span className="text-xs font-mono font-normal bg-slate-800 text-amber-300 border border-slate-700 px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Cards drawn during this session</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                title="Clear draw history"
                className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
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
          {history.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 text-slate-600">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No cards drawn yet</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                Cards you draw will appear here so you can revisit them anytime.
              </p>
            </div>
          ) : (
            history.map((card, index) => {
              const image =
                card.card_images?.[0]?.image_url_small ||
                `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`;
              const isFav = favorites.includes(card.id);

              return (
                <div
                  key={`${card.id}-${index}`}
                  className="group p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/50 rounded-xl transition-all flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => {
                      onSelectCard(card);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={image}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-16 object-cover rounded border border-slate-700 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 truncate">
                        {card.name}
                      </h4>
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
                      onClick={() => {
                        onSelectCard(card);
                        onClose();
                      }}
                      title="View card"
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
    </div>
  );
};
