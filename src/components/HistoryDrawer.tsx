import React from 'react';
import { YugiohCard } from '../types/card';
import { X, Clock, Trash2, ArrowRight } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-bold text-white text-base">
              Drawn Cards History
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                title="Clear draw history"
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Clock className="w-10 h-10 mb-3 text-slate-700" />
              <p className="text-sm font-medium text-slate-400">No cards drawn yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Cards you draw will appear here so you can revisit them anytime.
              </p>
            </div>
          ) : (
            history.map((card, index) => {
              const image = card.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`;
              return (
                <div
                  key={`${card.id}-${index}`}
                  onClick={() => {
                    onSelectCard(card);
                    onClose();
                  }}
                  className="group p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/50 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                        <span>{card.race}</span>
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

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
