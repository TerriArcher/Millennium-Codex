import React, { useState } from 'react';
import { CardFilterState } from '../types/card';
import { Sparkles, SlidersHorizontal, RotateCcw, X, Search, Layers } from 'lucide-react';

interface FilterBarProps {
  filters: CardFilterState;
  onFilterChange: (filters: CardFilterState) => void;
  onDrawRandom: () => void;
  onResetFilters: () => void;
  isLoading: boolean;
  totalMatches?: number; onOpenMatchingCards?: () => void;
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
  totalMatches,
  onOpenMatchingCards
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

  const handleRemoveCriterion = (key: keyof CardFilterState) => {
    const updated = { ...filters };
    delete updated[key];
    onFilterChange(updated);
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
    <div className="w-full max-w-4xl mx-auto mb-6 sm:mb-8 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 sm:px-6 sm:py-5 shadow-lg backdrop-blur-sm">
      {/* Top Filter Controls: Main Card Properties & Primary Draw Action */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4">
        {/* Card Property Segmented Control */}
        <div className="grid grid-cols-4 sm:flex items-center gap-1 p-1 sm:p-1.5 bg-slate-950 rounded-xl border border-slate-800/80 w-full md:w-auto overflow-x-auto scrollbar-none">
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
                className={`flex-1 sm:flex-initial px-2 sm:px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap text-center flex items-center justify-center cursor-pointer ${
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
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-2 sm:gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 sm:px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showAdvanced || hasAnyFilter
                ? 'bg-slate-800 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span>More Filters</span>
            {hasAnyFilter && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            )}
          </button>

          {/* Main Draw Action - Retains and checks filters */}
          <button
            onClick={onDrawRandom}
            disabled={isLoading}
            className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:bg-slate-800 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border-slate-700/80 disabled:shadow-none disabled:cursor-not-allowed disabled:pointer-events-none ${
              isLoading
                ? 'bg-slate-800 text-slate-500 border border-slate-700/80 shadow-none cursor-not-allowed pointer-events-none'
                : 'text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 shadow-md shadow-amber-500/20 cursor-pointer'
            }`}
            title={hasAnyFilter ? 'Draw a random card matching active filters' : 'Draw random card'}
          >
            <Sparkles className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin text-slate-500' : ''}`} />
            <span>{isLoading ? 'Drawing...' : 'Draw Card'}</span>
            {hasAnyFilter && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-md ${
                  isLoading ? 'bg-slate-700/70 text-slate-400' : 'bg-slate-950/25'
                }`}
              >
                Active
              </span>
            )}
          </button>

          {/* Clear all filters button positioned directly next to Draw Card */}
          <button
            onClick={onResetFilters}
            disabled={!hasAnyFilter}
            className={`px-3 sm:px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              hasAnyFilter
                ? 'bg-slate-800/90 hover:bg-red-950/50 border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-300 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Clear all active filters"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Active Filter Notification Bar */}
      {hasAnyFilter && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap text-slate-300">
            <span className="text-slate-500 font-medium mr-1">Active criteria:</span>
            {filters.type && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('type')}
                title="Click to deselect Property filter"
                className="group bg-slate-800 hover:bg-red-950/40 px-2 py-0.5 rounded text-amber-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Property: {filters.type}</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.superType && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('superType')}
                title="Click to deselect Super Type filter"
                className="group bg-amber-400/20 hover:bg-red-950/40 px-2 py-0.5 rounded text-amber-300 hover:text-red-300 border border-amber-500/40 hover:border-red-500/50 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Super: {filters.superType}</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.scale !== undefined && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('scale')}
                title="Click to deselect Pendulum Scale filter"
                className="group bg-teal-950 hover:bg-red-950/40 px-2 py-0.5 rounded text-teal-300 hover:text-red-300 border border-teal-600/40 hover:border-red-500/50 font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Scale: {filters.scale}</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.archetype && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('archetype')}
                title="Click to deselect Archetype filter"
                className="group bg-amber-950/40 hover:bg-red-950/40 px-2 py-0.5 rounded text-amber-300 hover:text-red-300 border border-amber-600/40 hover:border-red-500/50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Archetype: {filters.archetype}</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.attribute && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('attribute')}
                title="Click to deselect Attribute filter"
                className="group bg-slate-800 hover:bg-red-950/40 px-2 py-0.5 rounded text-amber-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Attribute: {filters.attribute}</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.level !== undefined && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('level')}
                title="Click to deselect Level/Rank filter"
                className="group bg-slate-800 hover:bg-red-950/40 px-2 py-0.5 rounded text-amber-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Level/Rank: {filters.level}</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.race && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('race')}
                title="Click to deselect Type/Subtype filter"
                className="group bg-slate-800 hover:bg-red-950/40 px-2 py-0.5 rounded text-amber-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>
                  {isSpell || isTrap || ALL_SUBTYPES.includes(currentSubtype)
                    ? `Subtype: ${currentSubtype}`
                    : `Monster Type: ${filters.race}`}
                </span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.atk !== undefined && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('atk')}
                title="Click to deselect ATK filter"
                className="group bg-slate-800 hover:bg-red-950/40 px-2 py-0.5 rounded text-red-300 hover:text-red-200 border border-red-900/50 hover:border-red-500/50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>ATK: {filters.atk}</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.def !== undefined && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('def')}
                title="Click to deselect DEF filter"
                className="group bg-slate-800 hover:bg-red-950/40 px-2 py-0.5 rounded text-blue-300 hover:text-red-300 border border-blue-900/50 hover:border-red-500/50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>DEF: {filters.def}</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
            {filters.keyword && (
              <button
                type="button"
                onClick={() => handleRemoveCriterion('keyword')}
                title="Click to deselect Keyword filter"
                className="group bg-slate-800 hover:bg-red-950/40 px-2 py-0.5 rounded text-slate-200 hover:text-red-300 border border-slate-700 hover:border-red-500/50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Keyword: "{filters.keyword}"</span>
                <X className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-red-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            {totalMatches !== undefined && (
              <button
                type="button"
                onClick={onOpenMatchingCards}
                title="View all cards matching these criteria in a bottom gallery"
                className="font-mono text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm group"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold underline underline-offset-2">
                  {totalMatches} matching in database
                </span>
                <span className="text-[10px] text-amber-400/80">· View all ↑</span>
              </button>
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

      {/* Expanded Filter Panel with Smooth Expand/Collapse Animation */}
      <div
        aria-hidden={!showAdvanced}
        className={`grid transition-all duration-300 ease-in-out ${
          showAdvanced
            ? 'grid-rows-[1fr] opacity-100 mt-3 sm:mt-4'
            : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="pt-3 sm:pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
            {/* 1. Property Dropdown */}
            <div className="min-w-0">
              <label className="block text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] truncate">
                Card Property
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="">Any</option>
                <option value="Monster">Monster</option>
                <option value="Spell Card">Spell Card</option>
                <option value="Trap Card">Trap Card</option>
              </select>
            </div>

            {/* 2. Spell / Trap Subtype (When Spell, Trap, or All is selected) */}
            {(!isMonster || !filters.type) && (
              <div className="min-w-0">
                <label className="block text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] truncate">
                  {isSpell ? 'Spell Subtype' : isTrap ? 'Trap Subtype' : 'Spell / Trap Subtype'}
                </label>
                <select
                  value={ALL_SUBTYPES.includes(currentSubtype) ? currentSubtype : ''}
                  onChange={(e) => handleSubtypeChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="">Any</option>
                  {(isSpell ? SPELL_SUBTYPES : isTrap ? TRAP_SUBTYPES : ALL_SUBTYPES).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. Monster-Specific: Super Type */}
            {(!isSpell && !isTrap) && (
              <div className="min-w-0">
                <label className="text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1 truncate">
                  <Layers className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Super Type</span>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
                >
                  <option value="">Any</option>
                  {SUPER_TYPES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Monster-Specific: Race / Monster Type */}
            {(!isSpell && !isTrap) && (
              <div className="min-w-0">
                <label className="block text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] truncate">
                  Monster Type / Race
                </label>
                <select
                  value={MONSTER_RACES.includes(filters.race || '') ? filters.race : ''}
                  onChange={(e) => onFilterChange({ ...filters, race: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="">Any</option>
                  {MONSTER_RACES.map((race) => (
                    <option key={race} value={race}>{race}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 5. Monster-Specific: Attribute */}
            {(!isSpell && !isTrap) && (
              <div className="min-w-0">
                <label className="block text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] truncate">
                  Attribute
                </label>
                <select
                  value={filters.attribute || ''}
                  onChange={(e) => onFilterChange({ ...filters, attribute: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="">Any</option>
                  {ATTRIBUTES.map((attr) => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 6. Monster-Specific: Level / Rank */}
            {(!isSpell && !isTrap) && (
              <div className="min-w-0">
                <label className="block text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] truncate">
                  Level / Rank (0–12)
                </label>
                <select
                  value={filters.level !== undefined ? String(filters.level) : ''}
                  onChange={(e) => onFilterChange({ ...filters, level: e.target.value !== '' ? Number(e.target.value) : undefined })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                >
                  <option value="">Any</option>
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>★ Level / Rank {lvl}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 7. Monster-Specific: Pendulum Scale */}
            {(!isSpell && !isTrap) && (
              <div className="min-w-0">
                <label className="block text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] truncate">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                >
                  <option value="">Any</option>
                  {SCALES.map((sc) => (
                    <option key={sc} value={sc}>◄ Scale {sc} ►</option>
                  ))}
                </select>
              </div>
            )}

            {/* 8. Archetype Search (Full width on mobile since it is a text box) */}
            <div className="col-span-2 sm:col-span-1 min-w-0">
              <label className="block text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] truncate">
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

            {/* 9. Card Name / Keyword Search (Full width on mobile since it is a text box) */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-2 min-w-0">
              <label className="block text-slate-400 font-semibold mb-1 sm:mb-1.5 uppercase tracking-wider text-[10px] truncate">
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

            {/* More Filters Database Matches Summary Bar */}
            <div className="col-span-full pt-3 mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-500 font-medium">Matching cards in database:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {totalMatches !== undefined ? totalMatches.toLocaleString() : '13,000+'}
                </span>
                <span className="text-slate-400">cards</span>
              </div>
              {onOpenMatchingCards && (
                <button
                  type="button"
                  onClick={onOpenMatchingCards}
                  className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>View All Matching Cards ↑</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


