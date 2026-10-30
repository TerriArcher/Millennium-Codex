import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

interface AiSynergySuggestion {
  name: string;
  category: string;
  reason: string;
}

const aiSynergyCache = new Map<string, AiSynergySuggestion[]>();
const MAX_AI_SYNERGY_CACHE = 200;

function sendJson(res: any, status: number, payload: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(payload);
  }
  res.statusCode = status;
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.end?.(JSON.stringify(payload));
}

async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf-8'));
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on?.('data', (chunk: any) => {
      raw += chunk.toString();
    });
    req.on?.('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on?.('error', () => resolve({}));
  });
}

function buildFallbackSynergySuggestions(
  card: Record<string, any>,
  excludeNames: Set<string>
): AiSynergySuggestion[] {
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
        reason: `Discards Level 8 "${card.name}" to draw 2 cards while loading the Graveyard.`
      },
      {
        name: 'Number 38: Hope Harbinger Dragon Titanic Galaxy',
        category: 'AI Rank 8 Boss',
        reason: `High-impact Rank 8 Xyz monster easily overlaid using Level 8 monsters like "${card.name}".`
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
        reason: `Banishes a Level 7 monster like "${card.name}" to draw 2 cards and accelerate deck cycling.`
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
        reason: `Versatile Rank 4 Xyz monster that pairs with Level 4 extenders like "${card.name}".`
      },
      {
        name: 'Bagooska the Terribly Tired Tapir',
        category: 'AI Rank 4 Lock',
        reason: `Defensive Rank 4 Xyz option easily summoned alongside "${card.name}".`
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
        reason: `Revives high-level Dragons from the GY and banishes itself to protect "${card.name}".`
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
        reason: `Accumulates Spell Counters to Special Summon Spellcasters like "${card.name}" from GY.`
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
        reason: `Searches Warrior combo starters and extenders to pair with "${card.name}".`
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
        reason: `Draws 2 cards by banishing a DARK monster, smoothing hands built around "${card.name}".`
      },
      {
        name: 'Dharc the Dark Charmer, Gloomy',
        category: 'AI Link Climber',
        reason: `Links using DARK monsters like "${card.name}" and revives a DARK monster from the opponent's GY.`
      }
    );
  }
  if (attrUpper === 'LIGHT') {
    candidates.push({
      name: 'Lyna the Light Charmer, Lustrous',
      category: 'AI Link Climber',
      reason: `Uses LIGHT monsters like "${card.name}" as Link material and searches LIGHT follow-up on destruction.`
    });
  }
  if (typeLower.includes('spell') || typeLower.includes('trap')) {
    candidates.push(
      {
        name: 'Triple Tactics Thrust',
        category: 'AI Spell/Trap Tutor',
        reason: `Sets or searches key Normal Spells/Traps to complement "${card.name}".`
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
      reason: `Extends plays by Special Summoning "${card.name}" or key combo pieces from either Graveyard.`
    },
    {
      name: 'Called by the Grave',
      category: 'AI Combo Protection',
      reason: `Insulates "${card.name}"'s effects and summon sequences against hand traps.`
    },
    {
      name: 'Infinite Impermanence',
      category: 'AI Board Breaker',
      reason: `Negates opposing monster effects to clear the way for "${card.name}".`
    },
    {
      name: 'S:P Little Knight',
      category: 'AI Link Utility',
      reason: `Banishes threats on summon and temporarily banishes "${card.name}" to dodge removal.`
    },
    {
      name: 'Foolish Burial',
      category: 'AI GY Starter',
      reason: `Sends key monsters directly from the Deck to the GY to enable graveyard synergies.`
    },
    {
      name: 'Crossout Designator',
      category: 'AI Handtrap Shield',
      reason: `Protects high-commitment plays involving "${card.name}" from disruption.`
    }
  );

  const selfLower = String(card.name || '').trim().toLowerCase();
  const filtered: AiSynergySuggestion[] = [];
  const seen = new Set<string>();
  for (const item of candidates) {
    const lower = item.name.toLowerCase();
    if (lower === selfLower || excludeNames.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    filtered.push(item);
    if (filtered.length >= 6) break;
  }
  return filtered;
}

export default async function handler(req: any, res: any) {
  if (req.method && req.method.toUpperCase() === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  let body: any = {};
  try {
    body = await parseJsonBody(req);
  } catch {
    body = {};
  }

  try {
    const card = body?.card as Record<string, any> | undefined;
    const excludeList: string[] = Array.isArray(body?.excludeNames)
      ? body.excludeNames.map((n: any) => String(n).trim().toLowerCase())
      : [];
    const excludeSet = new Set<string>(excludeList);

    if (!card || !card.name) {
      return sendJson(res, 400, {
        message: 'Valid card payload is required.',
        suggestions: []
      });
    }

    const cardId = Number(card.id) || 0;
    const cacheKey = `${cardId}:${[...excludeList].sort().join('|')}`;
    if (cardId && aiSynergyCache.has(cacheKey)) {
      const cached = aiSynergyCache.get(cacheKey)!;
      aiSynergyCache.delete(cacheKey);
      aiSynergyCache.set(cacheKey, cached);
      return sendJson(res, 200, { suggestions: cached, source: 'cache' });
    }

    const rawApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';
    const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      const fallback = buildFallbackSynergySuggestions(card, excludeSet);
      return sendJson(res, 200, { suggestions: fallback, source: 'fallback' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const truncatedDesc = String(card.desc || 'None')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280);

    const cardSummary = [
      `Name: ${card.name}`,
      `Type: ${card.type || 'Unknown'}`,
      card.attribute ? `Attr: ${card.attribute}` : null,
      card.race ? `Race: ${card.race}` : null,
      card.level !== undefined ? `Lv/Rank: ${card.level}` : null,
      card.linkval !== undefined ? `Link: ${card.linkval}` : null,
      card.scale !== undefined ? `Scale: ${card.scale}` : null,
      card.atk !== undefined ? `ATK/DEF: ${card.atk}/${card.def ?? '?'}` : null,
      card.archetype ? `Archetype: ${card.archetype}` : null,
      `Text: ${truncatedDesc}`
    ]
      .filter(Boolean)
      .join(' | ');

    const excludeClause =
      excludeList.length > 0
        ? ` Exclude: ${excludeList.slice(0, 8).join(', ')}.`
        : '';

    const prompt = `Recommend 5 real official English Yu-Gi-Oh! TCG cards with strong combo, search, or engine synergy with "${card.name}". Do not include "${card.name}".${excludeClause}\nCard: ${cardSummary}`;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Exact official English TCG card name.'
          },
          category: {
            type: Type.STRING,
            description: '2-3 word label (e.g. "AI Combo Piece", "AI Searcher").'
          },
          reason: {
            type: Type.STRING,
            description: 'Brief 1-sentence synergy reason under 85 chars.'
          }
        },
        required: ['name', 'category', 'reason']
      }
    };

    const candidateConfigs: Array<{ model: string; thinkingConfig: Record<string, any> }> = [
      {
        model: 'gemini-3.1-flash-lite',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
      },
      {
        model: 'gemini-flash-latest',
        thinkingConfig: { thinkingBudget: 0 }
      },
      {
        model: 'gemini-2.5-flash',
        thinkingConfig: { thinkingBudget: 0 }
      }
    ];

    const parseSuggestions = (rawText: string): AiSynergySuggestion[] => {
      const cleaned = (rawText || '[]')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const json = JSON.parse(cleaned);
      if (!Array.isArray(json)) return [];
      return json
        .filter(
          (item) =>
            item &&
            typeof item.name === 'string' &&
            item.name.trim().toLowerCase() !== String(card.name).trim().toLowerCase() &&
            !excludeSet.has(item.name.trim().toLowerCase())
        )
        .slice(0, 6)
        .map((item) => ({
          name: item.name.trim(),
          category: String(item.category || 'AI Synergy').trim(),
          reason: String(
            item.reason || 'Recommended by Gemini AI for tactical deck synergy.'
          ).trim()
        }));
    };

    let parsed: AiSynergySuggestion[] = [];
    const activeTimers: Array<ReturnType<typeof setTimeout>> = [];

    try {
      const racePromises = candidateConfigs.map(async ({ model, thinkingConfig }) => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          const id = setTimeout(() => reject(new Error(`Timeout calling ${model}`)), 3200);
          activeTimers.push(id);
        });

        const genPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            thinkingConfig,
            temperature: 0.3,
            maxOutputTokens: 420,
            responseMimeType: 'application/json',
            responseSchema
          }
        });

        const response = await Promise.race([genPromise, timeoutPromise]);
        const items = parseSuggestions(response.text || '[]');
        if (items.length === 0) {
          throw new Error(`Empty suggestions from ${model}`);
        }
        return items;
      });

      parsed = await Promise.any(racePromises);
    } catch {
      // All parallel fast candidates failed or timed out; fallback handled below
    } finally {
      for (const timerId of activeTimers) {
        clearTimeout(timerId);
      }
    }

    let source: 'gemini' | 'fallback' = 'gemini';
    if (parsed.length === 0) {
      parsed = buildFallbackSynergySuggestions(card, excludeSet);
      source = 'fallback';
    } else if (cardId) {
      if (aiSynergyCache.size >= MAX_AI_SYNERGY_CACHE) {
        const oldestKey = aiSynergyCache.keys().next().value;
        if (oldestKey !== undefined) aiSynergyCache.delete(oldestKey);
      }
      aiSynergyCache.set(cacheKey, parsed);
    }

    return sendJson(res, 200, { suggestions: parsed, source });
  } catch {
    const card = body?.card as Record<string, any> | undefined;
    const fallback = card ? buildFallbackSynergySuggestions(card, new Set()) : [];
    return sendJson(res, 200, {
      suggestions: fallback,
      source: 'fallback'
    });
  }
}
