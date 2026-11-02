import { YugiohCard } from '../types/card';

export interface AiSynergySuggestion {
  name: string;
  category: string;
  reason: string;
}

/**
 * Curated tactical staple/engine fallback suggestions when GEMINI_API_KEY is missing
 * or upstream Gemini generation times out. Shared by both server and client services.
 */
export function buildFallbackSynergySuggestions(
  card: Partial<YugiohCard>,
  excludeNames: Set<string> | string[] = new Set()
): AiSynergySuggestion[] {
  const excludeSet =
    excludeNames instanceof Set
      ? excludeNames
      : new Set(excludeNames.map((n) => String(n).trim().toLowerCase()));

  const cardName = String(card.name || 'this card').trim();
  const typeLower = String(card.type || '').toLowerCase();
  const attrUpper = String(card.attribute || '').toUpperCase();
  const raceLower = String(card.race || '').toLowerCase();
  const level = card.level;
  const candidates: AiSynergySuggestion[] = [];

  if (level === 8) {
    candidates.push(
      {
        name: 'Trade-In',
        category: 'AI Draw Engine',
        reason: `Discards Level 8 "${cardName}" to draw 2 cards while loading the Graveyard.`
      },
      {
        name: 'Number 38: Hope Harbinger Dragon Titanic Galaxy',
        category: 'AI Rank 8 Boss',
        reason: `High-impact Rank 8 Xyz monster easily overlaid using Level 8 monsters like "${cardName}".`
      },
      {
        name: 'Dingirsu, the Orcust of the Evening Star',
        category: 'AI Rank 8 Utility',
        reason: `Provides non-targeting removal and destruction protection for Rank 8 setups.`
      }
    );
  }
  if (level === 7) {
    candidates.push(
      {
        name: 'Sacred Sword of Seven Stars',
        category: 'AI Draw Engine',
        reason: `Banishes a Level 7 monster like "${cardName}" to draw 2 cards and accelerate deck cycling.`
      },
      {
        name: 'Number 11: Big Eye',
        category: 'AI Rank 7 Xyz',
        reason: `Rank 7 Xyz play that permanently steals an opponent's monster using Level 7 materials.`
      }
    );
  }
  if (level === 4) {
    candidates.push(
      {
        name: 'Time Thief Redoer',
        category: 'AI Rank 4 Control',
        reason: `Versatile Rank 4 Xyz monster that pairs with Level 4 extenders like "${cardName}".`
      },
      {
        name: 'Bagooska the Terribly Tired Tapir',
        category: 'AI Rank 4 Lock',
        reason: `Defensive Rank 4 Xyz option easily summoned alongside "${cardName}".`
      }
    );
  }
  if (raceLower.includes('dragon')) {
    candidates.push(
      {
        name: 'Dragon Shrine',
        category: 'AI GY Setup',
        reason: `Sends Dragon monsters directly from Deck to Graveyard to trigger recursion.`
      },
      {
        name: 'Return of the Dragon Lords',
        category: 'AI Revival & Shield',
        reason: `Revives high-level Dragons from the GY and banishes itself to protect "${cardName}".`
      },
      {
        name: 'Hieratic Seal of the Heavenly Spheres',
        category: 'AI Dragon Link',
        reason: `Tributes a Dragon to bounce an opponent's card and summon a Dragon from the Deck.`
      }
    );
  }
  if (raceLower.includes('spellcaster')) {
    candidates.push(
      {
        name: 'Selene, Queen of the Master Magicians',
        category: 'AI Link Extender',
        reason: `Accumulates Spell Counters to Special Summon Spellcasters like "${cardName}" from GY.`
      },
      {
        name: "Magicians' Souls",
        category: 'AI Consistency',
        reason: `Sends high-level Spellcasters from Deck to GY and converts extra Spells/Traps into draws.`
      }
    );
  }
  if (raceLower.includes('warrior')) {
    candidates.push(
      {
        name: 'Reinforcement of the Army',
        category: 'AI Searcher',
        reason: `Searches Warrior combo starters and extenders to pair with "${cardName}".`
      },
      {
        name: 'Isolde, Two Tales of the Noble Knights',
        category: 'AI Warrior Link',
        reason: `Searches a Warrior on Link Summon and Special Summons another Warrior from the Deck.`
      }
    );
  }
  if (attrUpper === 'DARK') {
    candidates.push(
      {
        name: 'Allure of Darkness',
        category: 'AI Draw Engine',
        reason: `Draws 2 cards by banishing a DARK monster, smoothing hands built around "${cardName}".`
      },
      {
        name: 'Dharc the Dark Charmer, Gloomy',
        category: 'AI Link Climber',
        reason: `Links using DARK monsters like "${cardName}" and revives a DARK monster from the opponent's GY.`
      }
    );
  }
  if (attrUpper === 'LIGHT') {
    candidates.push({
      name: 'Lyna the Light Charmer, Lustrous',
      category: 'AI Link Climber',
      reason: `Uses LIGHT monsters like "${cardName}" as Link material and searches LIGHT follow-up on destruction.`
    });
  }
  if (typeLower.includes('spell') || typeLower.includes('trap')) {
    candidates.push(
      {
        name: 'Triple Tactics Thrust',
        category: 'AI Spell/Trap Tutor',
        reason: `Sets or searches key Normal Spells/Traps to complement "${cardName}".`
      },
      {
        name: 'Lord of the Heavenly Prison',
        category: 'AI Backrow Shield',
        reason: `Protects set Spells and Traps from destruction and sets a Spell/Trap directly from the Deck.`
      }
    );
  }

  candidates.push(
    {
      name: 'Monster Reborn',
      category: 'AI Revival Tech',
      reason: `Extends plays by Special Summoning "${cardName}" or key combo pieces from either Graveyard.`
    },
    {
      name: 'Called by the Grave',
      category: 'AI Combo Protection',
      reason: `Insulates "${cardName}"'s effects and summon sequences against hand traps.`
    },
    {
      name: 'Infinite Impermanence',
      category: 'AI Board Breaker',
      reason: `Negates opposing monster effects to clear the way for "${cardName}".`
    },
    {
      name: 'S:P Little Knight',
      category: 'AI Link Utility',
      reason: `Banishes threats on summon and temporarily banishes "${cardName}" to dodge removal.`
    },
    {
      name: 'Foolish Burial',
      category: 'AI GY Starter',
      reason: `Sends key monsters directly from the Deck to the GY to enable graveyard synergies.`
    },
    {
      name: 'Crossout Designator',
      category: 'AI Handtrap Shield',
      reason: `Protects high-commitment plays involving "${cardName}" from disruption.`
    }
  );

  const selfLower = cardName.toLowerCase();
  const filtered: AiSynergySuggestion[] = [];
  const seen = new Set<string>();
  for (const item of candidates) {
    const lower = item.name.toLowerCase();
    if (lower === selfLower || excludeSet.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    filtered.push(item);
    if (filtered.length >= 6) break;
  }
  return filtered;
}
