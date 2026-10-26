import React from 'react';
import {
  ATTRIBUTES,
  SUPER_TYPES,
  MONSTER_RACES,
  ALL_SUBTYPES
} from '../components/FilterBar';
import { CardFilterState } from '../types/card';

export interface KeywordDefinition {
  item: string;
  category: 'attribute' | 'superType' | 'race' | 'subtype';
  filterKey: keyof CardFilterState;
  filterValue: any;
  typeOverride?: string;
  displayLabel: string;
}

// Build array of definitions strictly from array items in FilterBar (lines 14-47)
const KEYWORD_DEFINITIONS: KeywordDefinition[] = [
  // Attributes
  ...ATTRIBUTES.map((attr) => ({
    item: attr,
    category: 'attribute' as const,
    filterKey: 'attribute' as keyof CardFilterState,
    filterValue: attr,
    displayLabel: `Attribute: ${attr}`
  })),

  // Super Types (includes newly added 'Tuner')
  ...SUPER_TYPES.map((st) => ({
    item: st,
    category: 'superType' as const,
    filterKey: 'superType' as keyof CardFilterState,
    filterValue: st,
    typeOverride: 'Monster',
    displayLabel: `Super: ${st}`
  })),

  // Monster Races
  ...MONSTER_RACES.map((race) => ({
    item: race,
    category: 'race' as const,
    filterKey: 'race' as keyof CardFilterState,
    filterValue: race,
    typeOverride: 'Monster',
    displayLabel: `Monster: ${race}`
  })),

  // Spell / Trap Subtypes
  ...ALL_SUBTYPES.map((sub) => {
    const isQuick = sub === 'Quick';
    const isCounter = sub === 'Counter';
    const isSpellExclusive = ['Quick', 'Field', 'Equip'].includes(sub);

    return {
      item: sub,
      category: 'subtype' as const,
      filterKey: 'race' as keyof CardFilterState,
      filterValue: isQuick ? 'Quick-Play' : sub,
      typeOverride: isCounter ? 'Trap Card' : isSpellExclusive ? 'Spell Card' : undefined,
      displayLabel: `Subtype: ${isQuick ? 'Quick-Play' : sub}`
    };
  })
];

// Also support hyphenated forms found in card texts for Quick-Play
const EXTENDED_KEYWORD_DEFINITIONS: KeywordDefinition[] = [
  ...KEYWORD_DEFINITIONS,
  {
    item: 'Quick-Play',
    category: 'subtype' as const,
    filterKey: 'race' as keyof CardFilterState,
    filterValue: 'Quick-Play',
    typeOverride: 'Spell Card',
    displayLabel: 'Subtype: Quick-Play'
  }
];

// Sort definitions by item string length descending so longer compound terms match first
const SORTED_KEYWORDS = [...EXTENDED_KEYWORD_DEFINITIONS].sort(
  (a, b) => b.item.length - a.item.length
);

// Escape regex special chars
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Compile a single regex matching only the string items inside the arrays
const KEYWORD_REGEX = new RegExp(
  `\\b(${SORTED_KEYWORDS.map((k) => escapeRegex(k.item)).join('|')})\\b`,
  'gi'
);

// Map lowercase item name to its keyword definition
const KEYWORD_MAP = new Map<string, KeywordDefinition>();
SORTED_KEYWORDS.forEach((kw) => {
  if (!KEYWORD_MAP.has(kw.item.toLowerCase())) {
    KEYWORD_MAP.set(kw.item.toLowerCase(), kw);
  }
});

interface HighlightedCardTextProps {
  text: string;
  activeFilters: CardFilterState;
  onSelectKeyword: (definition: KeywordDefinition) => void;
}

export const HighlightedCardText: React.FC<HighlightedCardTextProps> = ({
  text,
  activeFilters,
  onSelectKeyword
}) => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex index before running
  KEYWORD_REGEX.lastIndex = 0;

  while ((match = KEYWORD_REGEX.exec(text)) !== null) {
    const matchedText = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + matchedText.length;

    // Push preceding text segment
    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }

    const lowerMatch = matchedText.toLowerCase();

    // Check exclusion rules:
    // 1. Remove Normal if the next word is "or" (e.g. "Normal or Special Summon")
    // 2. Remove Quick if the next word is "effect" (e.g. "(Quick Effect):")
    const remainingText = text.slice(endIndex);
    const nextWordMatch = remainingText.match(/^[\s/]*([a-zA-Z]+)/);
    const nextWord = nextWordMatch ? nextWordMatch[1].toLowerCase() : '';

    const isExcluded =
      (lowerMatch === 'normal' && nextWord === 'or') ||
      (lowerMatch === 'quick' && nextWord === 'effect');

    const def = isExcluded ? undefined : KEYWORD_MAP.get(lowerMatch);

    if (def) {
      // Check if this criteria is currently active in the filter state
      const currentVal = activeFilters[def.filterKey];
      const isCurrentlyActive =
        currentVal !== undefined &&
        String(currentVal).toLowerCase() === String(def.filterValue).toLowerCase();

      parts.push(
        <button
          key={`${startIndex}-${matchedText}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectKeyword(def);
          }}
          title={
            isCurrentlyActive
              ? `Active in filter: ${def.displayLabel}. Click to remove.`
              : `Click to add ${def.displayLabel} to filter criteria.`
          }
          className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-semibold cursor-pointer transition-all duration-150 align-baseline ${
            isCurrentlyActive
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-1 ring-amber-300 scale-102'
              : 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 border border-amber-500/40 hover:border-amber-400'
          }`}
        >
          <span>{matchedText}</span>
          {isCurrentlyActive ? (
            <span className="ml-1 text-[10px] text-slate-950 font-bold">✓</span>
          ) : (
            <span className="ml-1 text-[10px] text-amber-400/80 font-mono">+</span>
          )}
        </button>
      );
    } else {
      parts.push(matchedText);
    }

    lastIndex = endIndex;
  }

  // Push remainder
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
};
