# Vercel Serverless API & Gemini Synergy Deployment Plan

Configure full cross-platform deployment compatibility so the Yu-Gi-Oh! Random Card Generator & Synergy Explorer works identically on Vercel, Node/Express hosts, and local development—ensuring AI Suggested Synergy and all card API endpoints route to serverless handlers and call the official `@google/genai` SDK models (`gemini-3.8-flash` and `gemini-3.1-flash-lite`) with automatic curated synergy fallbacks.

## User Review & Critical Decisions

- **Full Serverless Endpoint Coverage (Confirmed)**: All backend API endpoints (`/api/cards/synergy`, `/api/cards/random`, `/api/cards/filters`, and `/api/resources`) will be exposed as Vercel Serverless Functions alongside the existing Express server so both Vercel and Node/container platforms work out of the box.
- **Automatic Tactical Synergy Fallback (Confirmed)**: When `GEMINI_API_KEY` is not configured in the hosting environment or if the Gemini API request times out, `/api/cards/synergy` will automatically return curated tactical synergy fallback cards (`buildFallbackSynergySuggestions`) so the "AI Suggested" tab always populates cleanly.
- **Required Vercel Environment Variable Setup**: To enable live Gemini AI synergy reasoning on Vercel, add `GEMINI_API_KEY` in **Vercel Dashboard → Project Settings → Environment Variables** (enabled for Production, Preview, and Development) and redeploy.

---

## 1. Overview & Core Concept

When deployed to Vercel, a Vite application serves static frontend assets from the build output directory while routing `/api/*` requests to serverless functions. Previously, two issues prevented AI Suggested Synergy from working on Vercel:
1. **SPA Catch-All Rewrite Intercepting API Calls**: The routing configuration rewrote every path (`/(.*)`) to `/index.html`, causing `POST /api/cards/synergy` and `GET /api/cards/*` requests on Vercel to return the HTML entrypoint instead of JSON from the backend.
2. **Express-Only Backend Mounting & Model Alias Update**: The API routes were only mounted inside the standalone Express server (`server.ts`) rather than exported for Vercel's serverless runtime, and the Gemini model list used an older preview identifier with `ThinkingLevel.MINIMAL`.

This plan decouples the backend API logic into shared, runtime-agnostic handlers that are mounted by both Express (`server.ts`) and Vercel's `/api` serverless runtime, updates the routing rules so `/api/*` requests never get rewritten to `/index.html`, and configures `@google/genai` to use `gemini-3.8-flash` (`ThinkingLevel.LOW`) and `gemini-3.1-flash-lite` (`ThinkingLevel.MINIMAL`).

---

## 2. User Experience & Visual Design

- **Seamless AI Suggested Synergy Tab**: Opening the **Similar Cards** drawer and switching to **AI Suggested** will invoke `POST /api/cards/synergy`, returning 6 to 8 tactical synergy cards with detailed 1-to-2 sentence synergy reasoning badges and role tags (`Combo Extender`, `Searcher / Starter`, `Boss / Payoff`, `Protection / Disruption`, `Engine / Support`).
- **Zero-Downtime Fallback Resilience**: If a deployment environment lacks `GEMINI_API_KEY` or experiences upstream latency, the endpoint transparently responds with curated competitive staple and attribute/race-matched tactical cards so players never encounter an empty drawer or raw error screen.
- **Consistent Multi-Platform Card Drawing & Filtering**: Random draws (`/api/cards/random`), dynamic filter catalogs (`/api/cards/filters`), and external duel links (`/api/resources`) respond with low-latency cached data on Vercel just as they do in local development.

---

## 3. Key Product Decisions & Trade-Offs

- **Shared Express + Vercel Handler Architecture**: Rather than maintaining duplicate logic between local Express development and Vercel Serverless Functions, a unified API router/handler module will power both `server.ts` and the Vercel `/api` entry point. This guarantees zero drift between environments.
- **Production-Ready Gemini 3 Model Selection**:
  - Primary model: `gemini-3.8-flash` configured with `ThinkingLevel.LOW` and structured JSON schema output (`responseMimeType: "application/json"`).
  - Fast fallback model: `gemini-3.1-flash-lite` configured with `ThinkingLevel.MINIMAL` for sub-second recovery if the primary model is rate-limited or unavailable.
  - Curated deterministic fallback: `buildFallbackSynergySuggestions` when no key is present or both models fail.
- **Explicit API Rewrite Exclusion in Vercel Configuration**: Only non-API paths (`/((?!api/).*)`) will rewrite to `/index.html`, allowing `/api/cards/synergy`, `/api/cards/random`, `/api/cards/filters`, and `/api/resources` to hit the serverless backend directly.

---

## 4. Technical Architecture & Data Strategy

```
+-------------------------------------------------------------------------+
|                        React Client (Browser UI)                        |
|   RelevantCardsSheet ("AI Suggested")  |  FilterBar / Random Card Draw  |
+-------------------+------------------------------------+----------------+
                    | POST /api/cards/synergy            | GET /api/cards/random
                    |                                    | GET /api/cards/filters
                    v                                    v GET /api/resources
+-------------------------------------------------------------------------+
|                     Platform Routing Layer                              |
|  - Vercel: vercel.json routes /api/* -> Serverless Function Runtime     |
|            and /((?!api/).*) -> /index.html                             |
|  - Node / Container / Local: Express server.ts mounts /api/* directly   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Unified Backend API Controller                         |
|  - In-Memory YGOPRODeck Card & Pricing Cache (1-Hour TTL)               |
|  - /api/cards/random   (Filtered draw + weighted pool selection)        |
|  - /api/cards/filters  (Archetypes, Races, Sets, Banlist catalogs)      |
|  - /api/resources      (Curated TCG tools & deckbuilder directory)      |
|  - /api/cards/synergy  (AI Tactical Synergy Engine)                     |
+-----------------+--------------------------------------+----------------+
                  |                                      |
                  v (If GEMINI_API_KEY set)              v (Missing key / timeout)
+-----------------------------------+  +----------------------------------+
|   @google/genai Server SDK        |  | Curated Tactical Synergy Engine  |
| 1. gemini-3.8-flash (LOW thinking)|  | - Attribute / Race / Type match  |
| 2. gemini-3.1-flash-lite (MINIMAL)|  | - Competitive Hand Traps & Staples|
+-----------------+-----------------+  +-----------------+----------------+
                  |                                      |
                  +------------------+-------------------+
                                     |
                                     v
               Resolved YuGiOhCard[] + Synergy Reason & Category
```

### Environment Variables Checklist for External Hosting (Vercel / Render / Railway / Cloud Run)
| Variable Name | Scope | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side only | Authenticates `@google/genai` requests in `/api/cards/synergy`. Never exposed with `VITE_` prefix to the browser. |
