import React, { useState } from 'react';
import { CardFilterState } from '../types/card';
import { Sparkles, SlidersHorizontal, RotateCcw, X, Search, Layers } from 'lucide-react';

interface FilterBarProps {
  filters: CardFilterState;
  onFilterChange: (filters: CardFilterState) => void;
  onDrawRandom: () => void;
  onResetFilters: () => void;
  isLoading: boolean;
  totalMatches?: number;
}

export const ATTRIBUTES = ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
export const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const SCALES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const SUPER_TYPES = ['Link', 'XYZ', 'Synchro', 'Ritual', 'Fusion', 'Pendulum', 'Spirit', 'Toon', 'Gemini', 'Union', 'Tuner'];
export const MONSTER_RACES = [
  'Dragon',
  'Spellcaster',
  'Warrior',
  'Fiend',
  'Zombie',
  'Machine',
  'Cyberse',
  'Fairy',
  'Insect',
  'Dinosaur',
  'Illusion',
  'Plant',
  'Aqua',
  'Pyro',
  'Rock',
  'Winged Beast',
  'Beast',
  'Beast-Warrior',
  'Psychic',
  'Wyrm',
  'Fish',
  'Sea Serpent',
  'Reptile',
  'Thunder',
  'Divine-Beast'
];
export const SPELL_SUBTYPES = ['Quick', 'Field', 'Continuous', 'Equip', 'Ritual', 'Normal'];
export const TRAP_SUBTYPES = ['Counter', 'Continuous', 'Normal'];
export const ALL_SUBTYPES = ['Quick', 'Field', 'Continuous', 'Counter', 'Ritual', 'Equip', 'Normal'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onDrawRandom,
  onResetFilters,
  isLoading,
  totalMatches
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAnyFilter = Boolean(
    filters.type ||
    filters.superType ||
    filters.attribute ||
    filters.level !== undefined ||
    filters.scale !== undefined ||
    filters.race ||
    filters.atk !== undefined ||
    filters.def !== undefined ||
    filters.archetype ||
    filters.keyword
  );

  const isSpell = filters.type === 'Spell Card' || (filters.type?.toLowerCase().includes('spell') ?? false);
  const isTrap = filters.type === 'Trap Card' || (filters.type?.toLowerCase().includes('trap') ?? false);
  const isMonster = filters.type === 'Monster';

  // Display value for current race/subtype (mapping 'Quick-Play' to 'Quick')
  const currentSubtype = filters.race === 'Quick-Play' ? 'Quick' : (filters.race || '');

  const handleSubtypeChange = (val: string) => {
    if (!val) {
      onFilterChange({ ...filters, race: undefined });
      return;
    }
    const raceVal = val === 'Quick' ? 'Quick-Play' : val;
    // Auto-align property if subtype is exclusive
    if (['Quick', 'Field', 'Equip', 'Ritual'].includes(val) && !isSpell) {
      onFilterChange({ ...filters, race: raceVal, type: 'Spell Card' });
    } else if (val === 'Counter' && !isTrap) {
      onFilterChange({ ...filters, race: raceVal, type: 'Trap Card' });
    } else {
      onFilterChange({ ...filters, race: raceVal });
    }
  };

  const handlePropertyChange = (newType: string) => {
    const updated: CardFilterState = {
      ...filters,
      type: newType || undefined
    };

    // If switching between Spell and Trap, ensure incompatible subtypes are cleared
    if (newType === 'Spell Card') {
      if (filters.race === 'Counter') updated.race = undefined;
      // Clear monster-only attributes
      updated.attribute = undefined;
      updated.level = undefined;
      updated.scale = undefined;
      updated.superType = undefined;
      updated.atk = undefined;
      updated.def = undefined;
    } else if (newType === 'Trap Card') {
      if (filters.race && ['Quick-Play', 'Field', 'Equip', 'Ritual'].includes(filters.race)) {
        updated.race = undefined;
      }
      updated.attribute = undefined;
      updated.level = undefined;
      updated.scale = undefined;
      updated.superType = undefined;
      updated.atk = undefined;
      updated.def = undefined;
    } else if (newType === 'Monster') {
      if (filters.race && ALL_SUBTYPES.includes(filters.race === 'Quick-Play' ? 'Quick' : filters.race)) {
        updated.race = undefined;
      }
    }

    onFilterChange(updated);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-sm">
      {/* Top Filter Controls: Main Card Properties & Primary Draw Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Card Property Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800/80 overflow-x-auto scrollbar-none">
          {[
            { id: '', label: 'All' },
            { id: 'Monster', label: 'Monster' },
            { id: 'Spell Card', label: 'Spell Card' },
            { id: 'Trap Card', label: 'Trap Card' }
          ].map((item) => {
            const isActive = (filters.type || '') === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handlePropertyChange(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Secondary controls and Main Draw CTA */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showAdvanced || hasAnyFilter
                ? 'bg-slate-800 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>More Filters</span>
            {hasAnyFilter && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Main Draw Action - Retains and checks filters */}
          <button
            onClick={onDrawRandom}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            title={hasAnyFilter ? 'Draw a random card matching active filters' : 'Draw random card'}
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Drawing...' : 'Draw Card'}</span>
            {hasAnyFilter && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-slate-950/25 rounded-md">
                Active
              </span>
            )}
          </button>

          {/* Clear all filters button positioned directly next to Draw Card */}
          <button
            onClick={onResetFilters}
            disabled={!hasAnyFilter}
            className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              hasAnyFilter
                ? 'bg-slate-800/90 hover:bg-red-950/50 border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-300 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Clear all active filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Active Filter Notification Bar */}
      {hasAnyFilter && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap text-slate-300">
            <span className="text-slate-500 font-medium mr-1">Active criteria:</span>
            {filters.type && (
              <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700 font-semibold">
                Property: {filters.type}
              </span>
            )}
            {filters.superType && (
              <span className="bg-amber-400/20 px-2 py-0.5 rounded text-amber-300 border border-amber-500/40 font-semibold">
                Super: {filters.superType}
              </span>
            )}
            {filters.scale !== undefined && (
              <span className="bg-teal-950 px-2 py-0.5 rounded text-teal-300 border border-teal-600/40 font-mono">
                Scale: {filters.scale}
              </span>
            )}
            {filters.archetype && (
              <span className="bg-amber-950/40 px-2 py-0.5 rounded text-amber-300 border border-amber-600/40">
                Archetype: {filters.archetype}
              </span>
            )}
            {filters.attribute && (
              <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">
                Attribute: {filters.attribute}
              </span>
            )}
            {filters.level !== undefined && (
              <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">
                Level/Rank: {filters.level}
              </span>
            )}
            {filters.race && (
              <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">
                {isSpell || isTrap || ALL_SUBTYPES.includes(currentSubtype)
                  ? `Subtype: ${currentSubtype}`
                  : `Monster Type: ${filters.race}`}
              </span>
            )}
            {filters.atk !== undefined && (
              <span className="bg-slate-800 px-2 py-0.5 rounded text-red-300 border border-red-900/50">
                ATK: {filters.atk}
              </span>
            )}
            {filters.def !== undefined && (
              <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-300 border border-blue-900/50">
                DEF: {filters.def}
              </span>
            )}
            {filters.keyword && (
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-200 border border-slate-700">
                Keyword: "{filters.keyword}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            {totalMatches !== undefined && (
              <span className="font-mono text-[11px]">
                {totalMatches} matching in database
              </span>
            )}
            <button
              onClick={onResetFilters}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* Expanded Filter Panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Property Dropdown */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
              Card Property
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
            >
              <option value="">Any Property</option>
              <option value="Monster">Monster</option>
              <option value="Spell Card">Spell Card</option>
              <option value="Trap Card">Trap Card</option>
            </select>
          </div>

          {/* 2. Spell / Trap Subtype (When Spell, Trap, or All is selected) */}
          {(!isMonster || !filters.type) && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                {isSpell ? 'Spell Subtype' : isTrap ? 'Trap Subtype' : 'Spell / Trap Subtype'}
              </label>
              <select
                value={ALL_SUBTYPES.includes(currentSubtype) ? currentSubtype : ''}
                onChange={(e) => handleSubtypeChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">Any Subtype</option>
                {(isSpell ? SPELL_SUBTYPES : isTrap ? TRAP_SUBTYPES : ALL_SUBTYPES).map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Monster-Specific: Super Type */}
          {(!isSpell && !isTrap) && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Super Type</span>
              </label>
              <select
                value={filters.superType || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    superType: e.target.value || undefined,
                    type: e.target.value ? 'Monster' : filters.type
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="">Any Super Type</option>
                {SUPER_TYPES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          )}

          {/* 4. Monster-Specific: Race / Monster Type */}
          {(!isSpell && !isTrap) && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                Monster Type / Race
              </label>
              <select
                value={MONSTER_RACES.includes(filters.race || '') ? filters.race : ''}
                onChange={(e) => onFilterChange({ ...filters, race: e.target.value || undefined })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">Any Monster Type</option>
                {MONSTER_RACES.map((race) => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Monster-Specific: Attribute */}
          {(!isSpell && !isTrap) && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                Attribute
              </label>
              <select
                value={filters.attribute || ''}
                onChange={(e) => onFilterChange({ ...filters, attribute: e.target.value || undefined })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">Any Attribute</option>
                {ATTRIBUTES.map((attr) => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
            </div>
          )}

          {/* 6. Monster-Specific: Level / Rank */}
          {(!isSpell && !isTrap) && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                Level / Rank (0–12)
              </label>
              <select
                value={filters.level !== undefined ? String(filters.level) : ''}
                onChange={(e) => onFilterChange({ ...filters, level: e.target.value !== '' ? Number(e.target.value) : undefined })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="">Any Level / Rank</option>
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>★ Level / Rank {lvl}</option>
                ))}
              </select>
            </div>
          )}

          {/* 7. Monster-Specific: Pendulum Scale */}
          {(!isSpell && !isTrap) && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                Pendulum Scale
              </label>
              <select
                value={filters.scale !== undefined ? String(filters.scale) : ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    scale: e.target.value !== '' ? Number(e.target.value) : undefined,
                    superType: e.target.value !== '' ? 'Pendulum' : filters.superType
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="">Any Scale</option>
                {SCALES.map((sc) => (
                  <option key={sc} value={sc}>◄ Scale {sc} ►</option>
                ))}
              </select>
            </div>
          )}

          {/* 8. Archetype Search */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
              Archetype Filter
            </label>
            <input
              type="text"
              placeholder="e.g. Blue-Eyes, HERO, Magician..."
              value={filters.archetype || ''}
              onChange={(e) => onFilterChange({ ...filters, archetype: e.target.value || undefined })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* 9. Card Name / Keyword Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
              Card Name / Keyword Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search card text, partial names, or descriptions..."
                value={filters.keyword || ''}
                onChange={(e) => onFilterChange({ ...filters, keyword: e.target.value || undefined })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


