import type { Express, Request, Response } from 'express';
import { YugiohCard } from '../types/card';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  AiSynergySuggestion,
  buildFallbackSynergySuggestions
} from '../utils/synergyFallback';

export type { AiSynergySuggestion };

const aiSynergyCache = new Map<string, AiSynergySuggestion[]>();
const MAX_AI_SYNERGY_CACHE = 200;

// Bounded per-IP sliding window rate limiter (30 requests per 60s)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const MAX_TRACKED_IPS = 500;
const ipRequestTimestamps = new Map<string, number[]>();

const MAX_BODY_BYTES = 32 * 1024; // 32 KB

class PayloadTooLargeError extends Error {
  constructor() {
    super('Request payload exceeds 32KB limit.');
    this.name = 'PayloadTooLargeError';
  }
}

function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return String(req.socket?.remoteAddress || req.ip || 'unknown').slice(0, 64);
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = ipRequestTimestamps.get(ip) || [];
  const recent = existing.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipRequestTimestamps.set(ip, recent);
    return true;
  }

  recent.push(now);
  if (!ipRequestTimestamps.has(ip) && ipRequestTimestamps.size >= MAX_TRACKED_IPS) {
    const oldestKey = ipRequestTimestamps.keys().next().value;
    if (oldestKey !== undefined) ipRequestTimestamps.delete(oldestKey);
  }
  ipRequestTimestamps.set(ip, recent);
  return false;
}

function sanitizePromptField(value: unknown, maxLength: number): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u001F\u007F`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function applyCorsHeaders(req: any, res: any) {
  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (typeof origin === 'string' && origin.length > 0) {
    try {
      const originUrl = new URL(origin);
      const isAllowed =
        (host && originUrl.host === host) ||
        originUrl.hostname === 'localhost' ||
        originUrl.hostname === '127.0.0.1' ||
        originUrl.hostname.endsWith('.vercel.app') ||
        originUrl.hostname.endsWith('.run.app');
      if (isAllowed) {
        res.setHeader?.('Access-Control-Allow-Origin', origin);
        res.setHeader?.('Vary', 'Origin');
      }
    } catch {
      // Ignore malformed Origin header
    }
  }
  res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

function sendJson(req: any, res: any, status: number, payload: any) {
  applyCorsHeaders(req, res);
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(payload);
  }
  res.statusCode = status;
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.end?.(JSON.stringify(payload));
}

async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    const serialized = JSON.stringify(req.body);
    if (Buffer.byteLength(serialized, 'utf-8') > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    return req.body;
  }
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf-8') > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    if (req.body.byteLength > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    try {
      return JSON.parse(req.body.toString('utf-8'));
    } catch {
      return {};
    }
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    let totalBytes = 0;
    let aborted = false;

    req.on?.('data', (chunk: any) => {
      if (aborted) return;
      const chunkStr = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk);
      totalBytes += Buffer.byteLength(chunkStr, 'utf-8');
      if (totalBytes > MAX_BODY_BYTES) {
        aborted = true;
        reject(new PayloadTooLargeError());
        return;
      }
      raw += chunkStr;
    });
    req.on?.('end', () => {
      if (aborted) return;
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on?.('error', () => {
      if (!aborted) resolve({});
    });
  });
}

// POST /api/cards/synergy
export async function handleCardSynergy(req: any, res: any) {
  if (req.method && req.method.toUpperCase() === 'OPTIONS') {
    return sendJson(req, res, 200, { ok: true });
  }

  if (req.method && req.method.toUpperCase() !== 'POST') {
    return sendJson(req, res, 405, { message: 'Method Not Allowed', suggestions: [] });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return sendJson(req, res, 429, {
      message: 'Too many synergy requests. Please wait a moment and try again.',
      suggestions: []
    });
  }

  let body: any = {};
  try {
    body = await parseJsonBody(req);
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      return sendJson(req, res, 413, {
        message: 'Request payload too large (max 32KB).',
        suggestions: []
      });
    }
    body = {};
  }

  try {
    const rawCard = body?.card as Partial<YugiohCard> | undefined;
    const sanitizedName = sanitizePromptField(rawCard?.name, 120);

    if (!rawCard || !sanitizedName) {
      return sendJson(req, res, 400, {
        message: 'Valid card payload is required.',
        suggestions: []
      });
    }

    const sanitizedCard: Partial<YugiohCard> = {
      id: Number(rawCard.id) || 0,
      name: sanitizedName,
      type: sanitizePromptField(rawCard.type, 60) || 'Unknown',
      attribute: sanitizePromptField(rawCard.attribute, 20) || undefined,
      race: sanitizePromptField(rawCard.race, 40) || undefined,
      archetype: sanitizePromptField(rawCard.archetype, 60) || undefined,
      level:
        typeof rawCard.level === 'number' && Number.isFinite(rawCard.level)
          ? Math.max(0, Math.min(13, Math.trunc(rawCard.level)))
          : undefined,
      linkval:
        typeof rawCard.linkval === 'number' && Number.isFinite(rawCard.linkval)
          ? Math.max(0, Math.min(8, Math.trunc(rawCard.linkval)))
          : undefined,
      scale:
        typeof rawCard.scale === 'number' && Number.isFinite(rawCard.scale)
          ? Math.max(0, Math.min(13, Math.trunc(rawCard.scale)))
          : undefined,
      atk:
        typeof rawCard.atk === 'number' && Number.isFinite(rawCard.atk)
          ? Math.max(-1, Math.min(100000, Math.trunc(rawCard.atk)))
          : undefined,
      def:
        typeof rawCard.def === 'number' && Number.isFinite(rawCard.def)
          ? Math.max(-1, Math.min(100000, Math.trunc(rawCard.def)))
          : undefined,
      desc: sanitizePromptField(rawCard.desc, 280)
    };

    const excludeList: string[] = Array.isArray(body?.excludeNames)
      ? body.excludeNames
          .slice(0, 25)
          .map((n: any) => sanitizePromptField(n, 120).toLowerCase())
          .filter(Boolean)
      : [];
    const excludeSet = new Set<string>(excludeList);

    const cardId = sanitizedCard.id || 0;
    const cacheKey = `${cardId}:${[...excludeSet].sort().join('|')}`;
    if (cardId && aiSynergyCache.has(cacheKey)) {
      const cached = aiSynergyCache.get(cacheKey)!;
      aiSynergyCache.delete(cacheKey);
      aiSynergyCache.set(cacheKey, cached);
      return sendJson(req, res, 200, { suggestions: cached, source: 'cache' });
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
      const fallback = buildFallbackSynergySuggestions(sanitizedCard, excludeSet);
      return sendJson(req, res, 200, { suggestions: fallback, source: 'fallback' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const cardSummary = [
      `Name: ${sanitizedCard.name}`,
      `Type: ${sanitizedCard.type}`,
      sanitizedCard.attribute ? `Attr: ${sanitizedCard.attribute}` : null,
      sanitizedCard.race ? `Race: ${sanitizedCard.race}` : null,
      sanitizedCard.level !== undefined ? `Lv/Rank: ${sanitizedCard.level}` : null,
      sanitizedCard.linkval !== undefined ? `Link: ${sanitizedCard.linkval}` : null,
      sanitizedCard.scale !== undefined ? `Scale: ${sanitizedCard.scale}` : null,
      sanitizedCard.atk !== undefined
        ? `ATK/DEF: ${sanitizedCard.atk}/${sanitizedCard.def ?? '?'}`
        : null,
      sanitizedCard.archetype ? `Archetype: ${sanitizedCard.archetype}` : null,
      `Text: ${sanitizedCard.desc || 'None'}`
    ]
      .filter(Boolean)
      .join(' | ');

    const excludeClause =
      excludeList.length > 0 ? ` Exclude: ${excludeList.slice(0, 8).join(', ')}.` : '';

    const prompt = `Recommend 5 real official English Yu-Gi-Oh! TCG cards with strong combo, search, or engine synergy with "${sanitizedCard.name}". Do not include "${sanitizedCard.name}".${excludeClause}\nCard: ${cardSummary}`;

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
            item.name.trim().toLowerCase() !== sanitizedName.toLowerCase() &&
            !excludeSet.has(item.name.trim().toLowerCase())
        )
        .slice(0, 6)
        .map((item) => ({
          name: sanitizePromptField(item.name, 120),
          category: sanitizePromptField(item.category || 'AI Synergy', 40),
          reason: sanitizePromptField(
            item.reason || 'Recommended by Gemini AI for tactical deck synergy.',
            160
          )
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
      parsed = buildFallbackSynergySuggestions(sanitizedCard, excludeSet);
      source = 'fallback';
    } else if (cardId) {
      if (aiSynergyCache.size >= MAX_AI_SYNERGY_CACHE) {
        const oldestKey = aiSynergyCache.keys().next().value;
        if (oldestKey !== undefined) aiSynergyCache.delete(oldestKey);
      }
      aiSynergyCache.set(cacheKey, parsed);
    }

    return sendJson(req, res, 200, { suggestions: parsed, source });
  } catch {
    const card = body?.card as Partial<YugiohCard> | undefined;
    const fallback = card ? buildFallbackSynergySuggestions(card, new Set()) : [];
    return sendJson(req, res, 200, {
      suggestions: fallback,
      source: 'fallback'
    });
  }
}

export function registerApiRoutes(app: Express) {
  app.post('/api/cards/synergy', (req: Request, res: Response) => {
    void handleCardSynergy(req, res);
  });
}
