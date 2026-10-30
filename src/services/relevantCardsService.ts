import { YugiohCard, CardFilterState } from '../types/card';
import {
  getAllMatchingCards,
  fetchCardsByNamesBatch
} from './ygoprodeckApi';

export type SynergyBadgeType = 'mention' | 'archetype' | 'stat' | 'ai';

export interface RelevantCardRecommendation {
  card: YugiohCard;
  badge: string;
  badgeType: SynergyBadgeType;
  reason: string;
  isAiSuggested?: boolean;
}

export interface RuleBasedPoolBundle {
  mentionCards: RelevantCardRecommendation[];
  archetypeCards: RelevantCardRecommendation[];
  statCards: RelevantCardRecommendation[];
}

// Bounded client-side LRU caches so re-opening or re-sampling a card is fast
const MAX_RELEVANT_CACHE = 40;
const ruleBasedBundleCache = new Map<number, RuleBasedPoolBundle>();
const aiSuggestedCache = new Map<string, RelevantCardRecommendation[]>();

function setBoundedMap<K, V>(map: Map<K, V>, key: K, value: V, max: number) {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= max) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
  map.set(key, value);
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let s = (seed + 1) * 2654435761;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s ^ (s >>> 15)) * 2246822507;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Extracts double-quoted strings from card effect text (`"..."`), filtering out
 * generic rule phrases or the card's own name.
 */
export function extractQuotedNamesFromDesc(card: YugiohCard): string[] {
  if (!card.desc) return [];
  const matches = card.desc.match(/"([^"]{2,60})"/g);
  if (!matches) return [];

  const selfLower = card.name.trim().toLowerCase();
  const ignoredTerms = new Set([
    'token',
    'spell',
    'trap',
    'monster',
    'normal',
    'effect',
    'tuner',
    'pendulum',
    'fusion',
    'synchro',
    'xyz',
    'link',
    'ritual',
    'spirit',
    'toon',
    'union',
    'gemini'
  ]);

  const results: string[] = [];
  for (const raw of matches) {
    const cleaned = raw.replace(/^"+|"+$/g, '').trim();
    const lower = cleaned.toLowerCase();
    if (!cleaned || lower === selfLower || ignoredTerms.has(lower)) continue;
    if (lower.endsWith(' token')) continue;
    if (!results.some((r) => r.toLowerCase() === lower)) {
      results.push(cleaned);
    }
  }
  return results;
}

/**
 * Builds and caches the full candidate pools (Direct Mentions, Archetypal Cards, and Stat/Type Synergy Cards)
 * for a given source card so toggling "Include Archetypal cards" or reloading the pool can sample fresh cards immediately.
 */
async function getOrBuildRuleBasedBundle(card: YugiohCard): Promise<RuleBasedPoolBundle> {
  const cached = ruleBasedBundleCache.get(card.id);
  if (cached) {
    ruleBasedBundleCache.delete(card.id);
    ruleBasedBundleCache.set(card.id, cached);
    return cached;
  }

  const mentionMap = new Map<number, RelevantCardRecommendation>();
  const archetypeMap = new Map<number, RelevantCardRecommendation>();
  const statMap = new Map<number, RelevantCardRecommendation>();

  const quotedNames = extractQuotedNamesFromDesc(card);
  const typeLower = (card.type || '').toLowerCase();
  const isMonster = card.atk !== undefined || typeLower.includes('monster');
  const isXyz = typeLower.includes('xyz');
  const isSynchro = typeLower.includes('synchro');
  const isLink = typeLower.includes('link');
  const sourceArchLower = (card.archetype || '').trim().toLowerCase();

  const tasks: Promise<void>[] = [];

  // Task 1: Resolve explicitly quoted card names in a single pipe-batched call
  if (quotedNames.length > 0) {
    tasks.push(
      (async () => {
        const resolved = await fetchCardsByNamesBatch(quotedNames);
        for (const c of resolved) {
          if (c.id === card.id) continue;
          const isSameArch =
            sourceArchLower && (c.archetype || '').trim().toLowerCase() === sourceArchLower;
          const rec: RelevantCardRecommendation = {
            card: c,
            badge: 'Direct Mention',
            badgeType: isSameArch ? 'archetype' : 'mention',
            reason: `Explicitly referenced in ${card.name}'s card text.`,
            isAiSuggested: false
          };
          if (isSameArch) {
            archetypeMap.set(c.id, rec);
          } else {
            mentionMap.set(c.id, rec);
          }
        }
      })()
    );
  }

  // Task 2: Cards that mention this card's exact name in their effect text
  if (card.name.length >= 4) {
    tasks.push(
      (async () => {
        try {
          const mentioning = await getAllMatchingCards({ keyword: card.name });
          for (const c of mentioning.slice(0, 20)) {
            if (c.id !== card.id && c.desc.toLowerCase().includes(card.name.toLowerCase())) {
              const isSameArch =
                sourceArchLower && (c.archetype || '').trim().toLowerCase() === sourceArchLower;
              const rec: RelevantCardRecommendation = {
                card: c,
                badge: 'Mentions Card',
                badgeType: isSameArch ? 'archetype' : 'mention',
                reason: `Lists "${card.name}" directly in its card text.`,
                isAiSuggested: false
              };
              if (isSameArch) {
                archetypeMap.set(c.id, rec);
              } else {
                mentionMap.set(c.id, rec);
              }
            }
          }
        } catch {
          // Ignore if no keyword matches
        }
      })()
    );
  }

  // Task 3: Same Archetype members (up to 40 cached so reloads surface fresh archetypal cards)
  if (card.archetype) {
    tasks.push(
      (async () => {
        try {
          const archCards = await getAllMatchingCards({ archetype: card.archetype });
          for (const c of archCards) {
            if (c.id === card.id || archetypeMap.has(c.id)) continue;
            const isSupportSpellTrap =
              c.type.toLowerCase().includes('spell') || c.type.toLowerCase().includes('trap');
            archetypeMap.set(c.id, {
              card: c,
              badge: 'Same Archetype',
              badgeType: 'archetype',
              reason: isSupportSpellTrap
                ? `"${card.archetype}" Spell/Trap support for archetype consistency.`
                : `Core "${card.archetype}" archetype member sharing support cards.`,
              isAiSuggested: false
            });
          }
        } catch {
          // Ignore archetype fetch error
        }
      })()
    );
  }

  // Task 4: Non-archetypal Stat / Attribute / Race / Level-Rank Synergy Pool (always populated so toggling off "Include Archetypal cards" has plenty of relevant cards)
  tasks.push(
    (async () => {
      try {
        const statFilter: CardFilterState = {};
        let badgeLabel = 'Type Synergy';
        let reasonText = '';

        if (isMonster && card.race && card.attribute && card.level) {
          statFilter.race = card.race;
          statFilter.attribute = card.attribute;
          statFilter.level = card.level;
          badgeLabel = isXyz ? `Rank ${card.level} Pool` : `Lv.${card.level} ${card.race}`;
          reasonText = isXyz
            ? `Shares ${card.attribute} ${card.race} Rank/Level ${card.level} Xyz material profile.`
            : `Shares ${card.attribute} / ${card.race} / Level ${card.level} for Xyz, Synchro, or Tribute plays.`;
        } else if (isMonster && card.race && card.attribute) {
          statFilter.race = card.race;
          statFilter.attribute = card.attribute;
          if (isLink) {
            badgeLabel = `${card.race} Link Pool`;
            reasonText = `Matching ${card.attribute} ${card.race} monster for Link climbing and type support.`;
          } else if (isSynchro) {
            badgeLabel = `${card.race} Synchro`;
            reasonText = `Shares ${card.attribute} ${card.race} typing for Synchro and graveyard synergy.`;
          } else {
            badgeLabel = `${card.attribute} ${card.race}`;
            reasonText = `Shares ${card.attribute} Attribute and ${card.race} Type support.`;
          }
        } else if (!isMonster && quotedNames.length > 0) {
          statFilter.keyword = quotedNames[0];
          badgeLabel = 'Series Support';
          reasonText = `Matches "${quotedNames[0]}" series referenced in card text.`;
        } else {
          statFilter.type = card.type;
          statFilter.race = card.race;
          badgeLabel = `${card.race} ${card.type.includes('Trap') ? 'Trap' : 'Spell'}`;
          reasonText = `Shares ${card.race} ${card.type} classification for backrow synergy.`;
        }

        const statPool = await getAllMatchingCards(statFilter);
        for (const c of statPool) {
          if (c.id === card.id) continue;
          const isSameArch =
            sourceArchLower && (c.archetype || '').trim().toLowerCase() === sourceArchLower;
          if (isSameArch) continue;
          statMap.set(c.id, {
            card: c,
            badge: badgeLabel,
            badgeType: 'stat',
            reason: reasonText,
            isAiSuggested: false
          });
          if (statMap.size >= 48) break;
        }
      } catch {
        // Ignore stat fallback errors
      }
    })()
  );

  await Promise.all(tasks);

  const bundle: RuleBasedPoolBundle = {
    mentionCards: Array.from(mentionMap.values()),
    archetypeCards: Array.from(archetypeMap.values()),
    statCards: Array.from(statMap.values())
  };

  setBoundedMap(ruleBasedBundleCache, card.id, bundle, MAX_RELEVANT_CACHE);
  return bundle;
}

/**
 * Returns up to 18 rule-based relevant cards.
 * - When `includeArchetype` is true (default), includes archetypal cards alongside direct mentions and stat synergies.
 * - When `includeArchetype` is false, filters out all archetypal cards and fills the visible pool with non-archetypal mentions & stat/type synergies.
 * - Changing `refreshSeed` reloads/re-samples the candidate pools so clicking the toggle buttons refreshes the visible cards.
 */
export async function getRuleBasedRelevantCards(
  card: YugiohCard,
  options: { includeArchetype?: boolean; refreshSeed?: number } = {}
): Promise<RelevantCardRecommendation[]> {
  const { includeArchetype = true, refreshSeed = 0 } = options;
  const bundle = await getOrBuildRuleBasedBundle(card);
  const sourceArchLower = (card.archetype || '').trim().toLowerCase();

  const mentions = shuffleWithSeed(bundle.mentionCards, refreshSeed);
  const archetypes = includeArchetype ? shuffleWithSeed(bundle.archetypeCards, refreshSeed + 7) : [];
  const stats = shuffleWithSeed(bundle.statCards, refreshSeed + 13);

  const combined = new Map<number, RelevantCardRecommendation>();

  for (const item of mentions) {
    if (!includeArchetype && sourceArchLower && (item.card.archetype || '').toLowerCase() === sourceArchLower) {
      continue;
    }
    combined.set(item.card.id, item);
  }

  if (includeArchetype) {
    for (const item of archetypes.slice(0, 10)) {
      if (!combined.has(item.card.id)) {
        combined.set(item.card.id, item);
      }
    }
  }

  for (const item of stats) {
    if (combined.size >= 18) break;
    if (!combined.has(item.card.id)) {
      combined.set(item.card.id, item);
    }
  }

  // If still under 18 and archetype is enabled, top up with any remaining archetype cards
  if (includeArchetype && combined.size < 18) {
    for (const item of archetypes.slice(10)) {
      if (combined.size >= 18) break;
      if (!combined.has(item.card.id)) {
        combined.set(item.card.id, item);
      }
    }
  }

  return Array.from(combined.values()).slice(0, 18);
}

/**
 * Fetches AI-powered synergy recommendations from `POST /api/cards/synergy` (powered by Gemini)
 * and resolves their card data in a single batched lookup.
 * ONLY called when the user explicitly enables "Include AI Suggested Synergies".
 */
export async function getAiSuggestedRelevantCards(
  card: YugiohCard,
  options: { includeArchetype?: boolean; refreshSeed?: number; excludeNames?: string[] } = {}
): Promise<RelevantCardRecommendation[]> {
  const { includeArchetype = true, refreshSeed = 0, excludeNames = [] } = options;
  const cacheKey = `${card.id}:${refreshSeed}`;

  let results = aiSuggestedCache.get(cacheKey);
  if (!results) {
    const response = await fetch('/api/cards/synergy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ card, excludeNames })
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      throw new Error('Failed to fetch AI synergy suggestions');
    }

    const data = await response.json();
    const suggestions: Array<{ name: string; category: string; reason: string }> = Array.isArray(
      data?.suggestions
    )
      ? data.suggestions
      : [];

    if (suggestions.length === 0) {
      return [];
    }

    const requestedNames = suggestions.map((s) => s.name);
    const resolvedCards = await fetchCardsByNamesBatch(requestedNames);

    const built: RelevantCardRecommendation[] = [];
    const usedIds = new Set<number>([card.id]);

    for (const sug of suggestions) {
      const targetLower = sug.name.trim().toLowerCase();
      const matchedCard =
        resolvedCards.find((c) => c.name.toLowerCase() === targetLower) ||
        resolvedCards.find(
          (c) =>
            !usedIds.has(c.id) &&
            (c.name.toLowerCase().includes(targetLower) ||
              targetLower.includes(c.name.toLowerCase()))
        );

      if (matchedCard && !usedIds.has(matchedCard.id)) {
        usedIds.add(matchedCard.id);
        built.push({
          card: matchedCard,
          badge: sug.category || 'AI Synergy',
          badgeType: 'ai',
          reason: sug.reason || 'Suggested by Gemini AI for tactical synergy.',
          isAiSuggested: true
        });
      }
    }

    results = built;
    if (results.length > 0) {
      setBoundedMap(aiSuggestedCache, cacheKey, results, MAX_RELEVANT_CACHE);
    }
  }

  if (!includeArchetype && card.archetype) {
    const sourceArchLower = card.archetype.trim().toLowerCase();
    return results.filter(
      (r) => (r.card.archetype || '').trim().toLowerCase() !== sourceArchLower
    );
  }

  return results;
}
