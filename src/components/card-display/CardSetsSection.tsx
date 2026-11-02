import React, { useState, useEffect } from 'react';
import { YugiohCard } from '../../types/card';
import {
  ensureCardSetsMetadataLoaded,
  enrichAndSortCardSets,
  getCardDebutYear
} from '../../services/ygoprodeckApi';
import { Calendar } from 'lucide-react';

export interface CardSetsSectionProps {
  card: YugiohCard;
}

export const CardSetsSection: React.FC<CardSetsSectionProps> = ({ card }) => {
  const [showSets, setShowSets] = useState(false);
  const [, setSetsMetadataRevision] = useState(0);

  useEffect(() => {
    void ensureCardSetsMetadataLoaded(() => {
      setSetsMetadataRevision((rev) => rev + 1);
    });
  }, []);

  const sortedCardSets = enrichAndSortCardSets(card.card_sets);
  const debutYear = getCardDebutYear(card);
  const debutSet = sortedCardSets.find((s) => s.release_year !== undefined) || sortedCardSets[0];

  const hasBanlistInfo = Boolean(card.banlist_info?.ban_tcg || card.banlist_info?.ban_ocg);

  return (
    <>
      {/* METADATA & BANLIST ROW */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2 text-[11px] sm:text-xs text-slate-400">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap w-full min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-3 flex-nowrap min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
              <span>Passcode:</span>
              <span className="font-mono text-slate-300 font-semibold">{card.id}</span>
            </div>

            {debutYear && (
              <div
                title={
                  debutSet
                    ? `First TCG release: ${debutSet.set_name} (${debutSet.set_code})${
                        debutSet.tcg_date ? ` on ${debutSet.tcg_date}` : ''
                      }`
                    : `Debut Year: ${debutYear}`
                }
                className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium shrink-0 whitespace-nowrap"
              >
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                <span className="text-slate-400">Debut:</span>
                <span className="font-mono font-bold text-amber-300">{debutYear}</span>
              </div>
            )}

            {/* Banlist information inline on larger screens */}
            {hasBanlistInfo && (
              <div className="hidden sm:flex items-center gap-3 shrink-0 whitespace-nowrap">
                {card.banlist_info?.ban_tcg && (
                  <div className="flex items-center gap-1">
                    <span>TCG:</span>
                    <span
                      className={`font-semibold ${
                        card.banlist_info.ban_tcg === 'Forbidden'
                          ? 'text-red-400'
                          : card.banlist_info.ban_tcg === 'Limited'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {card.banlist_info.ban_tcg}
                    </span>
                  </div>
                )}
                {card.banlist_info?.ban_ocg && (
                  <div className="flex items-center gap-1">
                    <span>OCG:</span>
                    <span
                      className={`font-semibold ${
                        card.banlist_info.ban_ocg === 'Forbidden'
                          ? 'text-red-400'
                          : card.banlist_info.ban_ocg === 'Limited'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {card.banlist_info.ban_ocg}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Link: Toggle Card Sets */}
          {sortedCardSets.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSets(!showSets)}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ml-auto"
            >
              {showSets ? 'Hide Card Sets' : `View ${sortedCardSets.length} Card Sets`}
            </button>
          )}
        </div>

        {/* Banlist information on mobile viewports */}
        {hasBanlistInfo && (
          <div className="flex sm:hidden items-center gap-3 text-[11px]">
            {card.banlist_info?.ban_tcg && (
              <div className="flex items-center gap-1">
                <span>TCG:</span>
                <span
                  className={`font-semibold ${
                    card.banlist_info.ban_tcg === 'Forbidden'
                      ? 'text-red-400'
                      : card.banlist_info.ban_tcg === 'Limited'
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {card.banlist_info.ban_tcg}
                </span>
              </div>
            )}
            {card.banlist_info?.ban_ocg && (
              <div className="flex items-center gap-1">
                <span>OCG:</span>
                <span
                  className={`font-semibold ${
                    card.banlist_info.ban_ocg === 'Forbidden'
                      ? 'text-red-400'
                      : card.banlist_info.ban_ocg === 'Limited'
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {card.banlist_info.ban_ocg}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable Card Sets List (Chronologically Sorted Oldest -> Newest) */}
      {showSets && sortedCardSets.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="uppercase tracking-wider font-semibold text-slate-400">
              Set Releases ({sortedCardSets.length})
            </span>
            <span className="text-slate-500 font-mono">
              Chronological (Oldest → Newest)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedCardSets.map((set, idx) => (
              <div
                key={`${set.set_code}-${set.set_rarity}-${idx}`}
                title={
                  set.tcg_date
                    ? `${set.set_name} (${set.set_code}) • ${set.set_rarity} • Released ${set.tcg_date}`
                    : `${set.set_name} (${set.set_code}) • ${set.set_rarity}`
                }
                className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60 flex items-center justify-between gap-2 hover:border-slate-700/80 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-slate-200 font-medium truncate">{set.set_name}</div>
                  {set.set_rarity && (
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {set.set_rarity}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {set.release_year && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-[10px] leading-none">
                      {set.release_year}
                    </span>
                  )}
                  <span className="font-mono text-amber-400 font-semibold text-[11px]">
                    {set.set_code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
