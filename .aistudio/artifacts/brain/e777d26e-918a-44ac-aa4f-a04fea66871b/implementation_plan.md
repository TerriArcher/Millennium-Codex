# Codebase Cleanup, Deduplication & Hardening Plan

## 1. Overview
This plan addresses all findings from the codebase audit across four core pillars:
1. **Dead Code & Unused Route Removal**: Remove the unused RTK Query slice (`ygoprodeckRtkApi`), unused backend routes (`/api/cards/random`, `/api/cards/filters`, `/api/resources`), dead component props/handlers, unused Redux actions, and unused dependencies/imports.
2. **Logic & UI Deduplication**: Unify the 3x-duplicated synergy fallback builder, consolidate `/api/cards/synergy.ts` to re-export from `/src/server/apiHandlers.ts`, share card draw & matching-cards handlers across `App.tsx` and `CardRandomizerPage.tsx`, centralize card frame/price/image helpers, extract a shared `useOverlayTransition` hook for modals/sheets/drawers, and unify `HistoryDrawer` and `FavoritesDrawer` around a shared `CardListDrawer` component.
3. **Security & Runtime Hardening**: Add strict request body size limits (`32 KB`), sanitize and cap all fields interpolated into the Gemini synergy prompt, add per-IP rate limiting and stricter CORS handling on `/api/cards/synergy`, bound `resolvedCardByNameCache`, and validate external `http(s):` URLs when normalizing cards from `localStorage`.
4. **`CardDisplay.tsx` Modular Decomposition**: Hoist `useAnimatedStat` out of the `CardDisplay` render body into `/src/hooks/useAnimatedStat.ts` and decompose the 1,988-line `CardDisplay.tsx` into focused subcomponents (`CardCarousel3D`, `CardStatsGrid`, `CardSetsSection`).

---

## 2. Phase-by-Phase Changes

### Phase 1: Remove Unused / Dead Code & Endpoints
- **Delete Unused Files**:
  - `/src/store/api/ygoprodeckApi.ts` (unused RTK Query API slice).
  - `/api/cards/random.ts`, `/api/cards/filters.ts`, `/api/resources.ts` (unused Vercel serverless endpoints).
- **Clean Up Store & Server Entry Points**:
  - `/src/store/index.ts`: Remove `ygoprodeckRtkApi` reducer and middleware registration.
  - `/server.ts`: Remove unused routes `/api/cards/random`, `/api/cards/filters`, and `/api/resources`; configure `express.json({ limit: '32kb' })`.
  - `/src/server/apiHandlers.ts`: Remove `handleRandomCard`, `handleCardFilters`, `handleResources`, and their supporting server-only cache/filter dead code, keeping only the hardened `handleCardSynergy` handler.
- **Clean Up Unused Props, Actions, Handlers & Imports**:
  - `/src/store/slices/filtersSlice.ts`: Remove unused `toggleFilterField` action and unused `typeOverride` field on `SetFilterFieldPayload`.
  - `/src/pages/CardRandomizerPage.tsx`: Remove unused `handleSelectCard` and `handleExploreStat` functions.
  - `/src/components/CardDisplay.tsx`: Remove unused `onExploreStat` prop from `CardDisplayProps` and unused `Maximize2`, `X` icon imports.
  - `/src/pages/ResourcesPage.tsx`: Remove unused `ArrowRight` icon import.
  - `/package.json`: Remove unused `"motion"` dependency.

### Phase 2: Consolidate Duplicate Logic & UI Components
- **Shared Synergy Fallback Module (`/src/utils/synergyFallback.ts`)**:
  - Extract `buildFallbackSynergySuggestions` into `/src/utils/synergyFallback.ts` so both `/src/server/apiHandlers.ts` and `/src/services/relevantCardsService.ts` import a single implementation instead of maintaining 3 copies.
- **Single Synergy Serverless Handler (`/api/cards/synergy.ts`)**:
  - Replace the 449-line duplicate implementation in `/api/cards/synergy.ts` with a thin wrapper that delegates directly to `handleCardSynergy` from `../../src/server/apiHandlers.js`.
- **Shared Card Formatting & URL Utilities (`/src/utils/cardFormatters.ts`)**:
  - Centralize `getCardFrameTheme(card)`, `getFormattedCardTypeLine(card)`, `getCardSmallImageUrl(card)`, `getCardFullImageUrl(card)`, `getFormattedTcgPrice(card)`, and `sanitizeExternalHttpUrl(url)` for reuse across `CardDisplay`, `CardHoverTooltip`, `CardPreviewModal`, `MatchingCardsSheet`, `RelevantCardsSheet`, and `CardListDrawer`.
- **Shared Draw & Matching-Pool Hook (`/src/hooks/useCardActions.ts`)**:
  - Extract `drawRandomCard` and `openMatchingCardsSheet` into a shared custom hook used by both `App.tsx` (for Navbar's Quick Draw and matching-pool actions) and `CardRandomizerPage.tsx` so behavior (including cycle-reset feedback and duplicate avoidance) is 100% consistent.
- **Shared Overlay Animation & Escape Hook (`/src/hooks/useOverlayTransition.ts`)**:
  - Replace the 5x-duplicated `requestAnimationFrame` entrance/exit transition (`shouldRender`, `isVisible`) and `Escape` key listener in `HistoryDrawer`, `FavoritesDrawer`, `MatchingCardsSheet`, `RelevantCardsSheet`, and `CardPreviewModal`.
- **Shared Side Drawer Component (`/src/components/CardListDrawer.tsx`)**:
  - Extract the shared drawer backdrop, header, card list row item, action buttons, and `CardPreviewModal` integration into `CardListDrawer.tsx`, and refactor `HistoryDrawer.tsx` and `FavoritesDrawer.tsx` into lightweight wrappers configuring title, icon, empty state, and item actions.

### Phase 3: Security & Memory Hardening
- **Request Body Limit & Stream Guard**:
  - Enforce a 32 KB byte cap in `parseJsonBody` inside `/src/server/apiHandlers.ts` (rejecting oversized streams with HTTP `413 Payload Too Large`) and in `express.json({ limit: '32kb' })` inside `server.ts`.
- **Input Validation & Prompt Injection Hardening on `/api/cards/synergy`**:
  - Sanitize and strip control characters/quotes from `card.name` (max 120 chars), `card.type` (max 60 chars), `card.race` (max 40 chars), `card.attribute` (max 20 chars), `card.archetype` (max 60 chars), and `card.desc` (max 280 chars).
  - Cap `excludeNames` to at most 25 sanitized strings (max 120 chars each) before constructing the cache key or prompt.
- **Per-IP Rate Limiting & Origin Check**:
  - Add a bounded in-memory sliding-window rate limiter (e.g., 30 requests / minute per IP) and restrict CORS to same-origin or configured allowed origins in `handleCardSynergy`.
- **Bounded Caches & Safe External URLs**:
  - Bound `resolvedCardByNameCache` in `/src/services/ygoprodeckApi.ts` to 250 entries (LRU eviction).
  - Ensure `sanitizeCardForStorage` in `historySlice.ts` and external `<a href>` links in `CardDisplay` validate `https://` / `http://` URLs.

### Phase 4: Decompose `CardDisplay.tsx` into Focused Subcomponents
- **`/src/hooks/useAnimatedStat.ts`**:
  - Move `useAnimatedStat` out of the `CardDisplay` component body into its own dedicated hook file.
- **`/src/components/card-display/CardCarousel3D.tsx`**:
  - Encapsulate the 3D perspective carousel stage, swipe/wheel navigation hints, card-back flip overlay, and external image viewer link.
- **`/src/components/card-display/CardStatsGrid.tsx`**:
  - Encapsulate the interactive filterable stat pills (Type, Race, Attribute, Level/Rank/Link, ATK/DEF, Archetype) with active-filter badges and tooltips.
- **`/src/components/card-display/CardSetsSection.tsx`**:
  - Encapsulate the metadata/passcode/debut-year/banlist footer and expandable chronological Card Sets grid.
- **`/src/components/CardDisplay.tsx`**:
  - Retain the high-level card header, synergy/favorite/share toolbar, effect/lore text box, and orchestration of the new subcomponents.

---

## 3. Verification Criteria
- `compile_applet` and `lint_applet` pass with zero TypeScript or ESLint errors.
- Random card drawing (both main Draw button and Navbar Quick Draw), filter pill toggling, 3D history carousel navigation, History/Favorites drawers, Matching Cards sheet, and Gemini AI Synergy recommendations all work seamlessly.
