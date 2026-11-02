import React from 'react';
import { YugiohCard, CardFilterState } from '../../types/card';
import { useAnimatedStat } from '../../hooks/useAnimatedStat';
import { Shield, Swords, Star } from 'lucide-react';

export interface CardStatsGridProps {
  card: YugiohCard;
  isMonster: boolean;
  isXyz: boolean;
  isLink: boolean;
  hasScale: boolean;
  safeType: string;
  typeStr: string;
  superType?: string;
  isCriterionSelected: (key: keyof CardFilterState, value: any) => boolean;
  onSelectFilterCriterion: (
    key: keyof CardFilterState,
    value: any,
    displayLabel: string
  ) => void;
}

export const CardStatsGrid: React.FC<CardStatsGridProps> = ({
  card,
  isMonster,
  isXyz,
  isLink,
  hasScale,
  safeType,
  typeStr,
  superType,
  isCriterionSelected,
  onSelectFilterCriterion
}) => {
  const animatedAtk = useAnimatedStat(card.atk);
  const animatedDef = useAnimatedStat(card.def);

  return (
    <>
      {/* PENDULUM SCALE DISPLAY & CLICKABLE FILTER */}
      {hasScale &&
        (() => {
          const isScaleSelected = isCriterionSelected('scale', card.scale);
          const scaleLabel = `Scale: ${card.scale}`;
          return (
            <div
              onClick={() => onSelectFilterCriterion('scale', card.scale, scaleLabel)}
              title={
                isScaleSelected
                  ? `Click to turn off ${scaleLabel}`
                  : `Click to turn on Pendulum Scale ${card.scale}`
              }
              className={`group mb-4 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isScaleSelected
                  ? 'bg-gradient-to-r from-blue-950/60 via-teal-900/50 to-red-950/60 border-amber-400 ring-1 ring-amber-400/40'
                  : 'bg-gradient-to-r from-blue-950/40 via-teal-950/40 to-red-950/40 hover:from-blue-950/60 hover:via-teal-900/40 hover:to-red-950/60 border-teal-500/40 hover:border-teal-400/70'
              }`}
            >
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/50 text-blue-400 font-mono font-extrabold text-sm shadow-sm shrink-0">
                <span className="text-xs">◄</span>
                <span>{card.scale}</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-center">
                <span
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isScaleSelected
                      ? 'text-amber-300'
                      : 'text-teal-300 group-hover:text-teal-200'
                  }`}
                >
                  Pendulum Scale
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                    isScaleSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isScaleSelected
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span>{isScaleSelected ? 'ON' : 'OFF'}</span>
                </span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-red-400 font-mono font-extrabold text-sm shadow-sm shrink-0">
                <span>{card.scale}</span>
                <span className="text-xs">►</span>
              </div>
            </div>
          );
        })()}

      {/* CLICKABLE ATTRIBUTES & STATS SECTION */}
      {isMonster ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-5">
          {/* 1. Attribute */}
          {card.attribute &&
            (() => {
              const isAttrSelected = isCriterionSelected('attribute', card.attribute);
              const attrLabel = `Attribute: ${card.attribute}`;
              return (
                <div
                  onClick={() =>
                    onSelectFilterCriterion('attribute', card.attribute, attrLabel)
                  }
                  title={
                    isAttrSelected
                      ? `Click to turn off ${attrLabel}`
                      : `Click to turn on ${card.attribute} attribute`
                  }
                  className={`group flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isAttrSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                      Attribute
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isAttrSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAttrSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isAttrSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 mt-1">
                    <span className={isAttrSelected ? 'text-amber-300' : ''}>
                      {card.attribute}
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* 2. Level / Rank / Link Rating */}
          {(card.level !== undefined || card.linkval !== undefined) &&
            (() => {
              const lvlVal = card.level ?? card.linkval;
              const lvlName = isXyz ? 'Rank' : isLink ? 'Link Rating' : 'Level';
              const lvlLabel = `${lvlName}: ${lvlVal}`;
              const isLvlSelected = isCriterionSelected('level', lvlVal);
              return (
                <div
                  onClick={() => onSelectFilterCriterion('level', lvlVal, lvlLabel)}
                  title={
                    isLvlSelected
                      ? `Click to turn off ${lvlLabel}`
                      : `Click to turn on ${lvlLabel}`
                  }
                  className={`group flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isLvlSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                      {lvlName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isLvlSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isLvlSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isLvlSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 flex items-center gap-1 mt-1 font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className={isLvlSelected ? 'text-amber-300' : ''}>{lvlVal}</span>
                  </div>
                </div>
              );
            })()}

          {/* 3. Monster Type */}
          {card.race &&
            (() => {
              const isRaceSelected = isCriterionSelected('race', card.race);
              const raceLabel = `Monster Type: ${card.race}`;
              return (
                <div
                  onClick={() => onSelectFilterCriterion('race', card.race, raceLabel)}
                  title={
                    isRaceSelected
                      ? `Click to turn off ${raceLabel}`
                      : `Click to turn on ${card.race} Monster Type`
                  }
                  className={`group flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isRaceSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                      Monster Type
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                        isRaceSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRaceSelected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>{isRaceSelected ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 mt-1 min-w-0">
                    <span className={`block truncate ${isRaceSelected ? 'text-amber-300' : ''}`}>
                      {card.race}
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* 4. Super Type or Category */}
          {(() => {
            const filterKey: keyof CardFilterState = superType ? 'superType' : 'type';
            const filterVal = superType ? superType : 'Monster';
            const displayVal = superType || safeType.replace(' Monster', '');
            const filterLabel = superType ? `Super: ${superType}` : 'Property: Monster';
            const isStSelected = isCriterionSelected(filterKey, filterVal);
            return (
              <div
                onClick={() => onSelectFilterCriterion(filterKey, filterVal, filterLabel)}
                title={
                  isStSelected
                    ? `Click to turn off ${filterLabel}`
                    : `Click to turn on ${filterLabel}`
                }
                className={`group flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isStSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                    : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                    {superType ? 'Super Type' : 'Type'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                      isStSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isStSelected
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span>{isStSelected ? 'ON' : 'OFF'}</span>
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 mt-1 min-w-0">
                  <span className={`block truncate ${isStSelected ? 'text-amber-300' : ''}`}>
                    {displayVal}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-5">
          {/* 1. Property: "Spell Card" or "Trap Card" */}
          {(() => {
            const propVal = typeStr.includes('trap') ? 'Trap Card' : 'Spell Card';
            const propLabel = `Property: ${propVal}`;
            const isPropSelected = isCriterionSelected('type', propVal);
            return (
              <div
                onClick={() => onSelectFilterCriterion('type', propVal, propLabel)}
                title={
                  isPropSelected
                    ? `Click to turn off ${propLabel}`
                    : `Click to turn on ${propVal}`
                }
                className={`group flex flex-col justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isPropSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                    : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-amber-400 font-semibold flex items-center gap-1.5">
                    <span>Property</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        typeStr.includes('trap') ? 'bg-pink-400' : 'bg-emerald-400'
                      }`}
                    />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                      isPropSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isPropSelected
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span>{isPropSelected ? 'ON' : 'OFF'}</span>
                  </span>
                </div>
                <div className="text-base font-bold text-slate-100 group-hover:text-amber-300 mt-1">
                  <span className={typeStr.includes('trap') ? 'text-pink-300' : 'text-emerald-300'}>
                    {propVal}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 2. Subtype */}
          {(() => {
            const mappedRace =
              (card.race || '').toLowerCase() === 'quick'
                ? 'Quick-Play'
                : card.race || 'Normal';
            const subDisplay = card.race === 'Quick-Play' ? 'Quick' : card.race || 'Normal';
            const subLabel = `Subtype: ${subDisplay}`;
            const isSubSelected = isCriterionSelected('race', mappedRace);
            return (
              <div
                onClick={() => onSelectFilterCriterion('race', mappedRace, subLabel)}
                title={
                  isSubSelected ? `Click to turn off ${subLabel}` : `Click to turn on ${subLabel}`
                }
                className={`group flex flex-col justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSubSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
                    : 'bg-slate-950/70 hover:bg-amber-950/30 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-amber-400 font-semibold">
                    Subtype
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                      isSubSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSubSelected
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span>{isSubSelected ? 'ON' : 'OFF'}</span>
                  </span>
                </div>
                <div className="text-base font-bold text-slate-100 group-hover:text-amber-300 mt-1">
                  <span className={isSubSelected ? 'text-amber-300' : ''}>{subDisplay}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* COMBAT STATS (ATK & DEF) FOR MONSTERS */}
      {isMonster && (
        <div className="grid grid-cols-2 gap-3 pb-5">
          {card.atk !== undefined &&
            (() => {
              const isAtkSelected = isCriterionSelected('atk', card.atk);
              const atkLabel = `ATK: ${card.atk}`;
              return (
                <div
                  onClick={() => onSelectFilterCriterion('atk', card.atk, atkLabel)}
                  title={
                    isAtkSelected
                      ? `Click to turn off ${atkLabel}`
                      : `Click to turn on ${atkLabel}`
                  }
                  className={`group p-3 rounded-xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-2 ${
                    isAtkSelected
                      ? 'bg-red-950/60 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-gradient-to-r from-red-950/40 to-slate-950/60 hover:from-red-950/70 hover:to-amber-950/40 border-red-900/40 hover:border-red-500/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-red-950/80 text-red-400 group-hover:text-red-300 border border-red-800/40 shrink-0 transition-transform duration-300 group-hover:scale-105">
                      <Swords className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-wider text-red-400/90">
                        ATK
                      </div>
                      <div
                        className={`text-xl font-extrabold font-mono tabular-nums transition-colors duration-200 ${
                          animatedAtk.trend === 'up'
                            ? 'text-emerald-300'
                            : animatedAtk.trend === 'down'
                            ? 'text-amber-300'
                            : 'text-white'
                        }`}
                      >
                        {card.atk < 0 ? '?' : animatedAtk.displayVal}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 transition-all duration-200 ${
                      isAtkSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        isAtkSelected
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span>{isAtkSelected ? 'ON' : 'OFF'}</span>
                  </span>
                </div>
              );
            })()}

          {card.def !== undefined ? (
            (() => {
              const isDefSelected = isCriterionSelected('def', card.def);
              const defLabel = `DEF: ${card.def}`;
              return (
                <div
                  onClick={() => onSelectFilterCriterion('def', card.def, defLabel)}
                  title={
                    isDefSelected
                      ? `Click to turn off ${defLabel}`
                      : `Click to turn on ${defLabel}`
                  }
                  className={`group p-3 rounded-xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-2 ${
                    isDefSelected
                      ? 'bg-blue-950/60 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-gradient-to-r from-blue-950/40 to-slate-950/60 hover:from-blue-950/70 hover:to-amber-950/40 border-blue-900/40 hover:border-blue-500/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 group-hover:text-blue-300 border border-blue-800/40 shrink-0 transition-transform duration-300 group-hover:scale-105">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-wider text-blue-400/90">
                        DEF
                      </div>
                      <div
                        className={`text-xl font-extrabold font-mono tabular-nums transition-colors duration-200 ${
                          animatedDef.trend === 'up'
                            ? 'text-emerald-300'
                            : animatedDef.trend === 'down'
                            ? 'text-amber-300'
                            : 'text-white'
                        }`}
                      >
                        {card.def < 0 ? '?' : animatedDef.displayVal}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 transition-all duration-200 ${
                      isDefSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-slate-900/90 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        isDefSelected
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span>{isDefSelected ? 'ON' : 'OFF'}</span>
                  </span>
                </div>
              );
            })()
          ) : isLink ? (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between transition-all duration-300">
              <div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-blue-400">
                  Link Markers
                </div>
                <div className="text-xs text-slate-300 font-mono mt-1">
                  {card.linkmarkers?.join(', ') || 'N/A'}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
};
