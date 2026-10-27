# Speed Up Card Draws, Optimize Caching & Fix Matching Sheet DOM Error

This plan addresses the full-project performance review to make drawing and displaying cards near-instantaneous, sharply reduce YGOPRODeck API calls, replace and bound cached browser data so memory/storage never bloats, and fix the nested `<button>` DOM validation error in the Matching Cards sheet.

## User Review & Critical Decisions

> [!IMPORTANT]
> Review the proposed caching and API optimization strategies below. Approving this plan will implement all five optimizations alongside the DOM nesting fix.

- **Unconstrained Draw Prefetch Queue**: Batch-fetch 30 random cards at a time and serve draws immediately from an in-memory queue while preloading the next card's artwork in the background (replaces discarded 15-card batch responses and cuts unconstrained API calls by ~30×).
- **Bounded LRU Query Cache with Slimmed Card Data**: Cap the filtered query cache to at most 3 filter pools (evicting and replacing older filter results) and strip unused heavy fields (excess set printings, alternate image arrays, unused vendor prices), cutting memory usage per cached card by ~70%.
- **Strict Replacement of `localStorage` Favorites Cache**: Store card objects in `localStorage` strictly for active Favorites (removing the bug where every drawn history card and all fallback cards were persisted to `localStorage` and never deleted on unfavorite).
- **Debounced & Deduplicated Filter Queries**: Debounce text-based filter count lookups (300ms) and deduplicate concurrent in-flight API requests so typing an archetype or keyword no longer fires an API request on every keystroke.
- **Matching Cards Sheet Virtual/Batched Rendering & DOM Fix**: Fix the nested `<button>` inside `<button>` error using an accessible card tile container and render large card pools in incremental batches (48 cards per batch) so broad filters (e.g., 8,000+ Monsters) open immediately without freezing the browser.

## 1. Overview & Core Concept

- **What It Does**: Eliminates network and image-loading bottlenecks during card draws, prevents redundant API calls to YGOPRODeck during filter selection, bounds all in-memory and `localStorage` caches with automatic replacement/eviction, and resolves the HTML button-nesting error.
- **Target Audience / Persona**: Yu-Gi-Oh! duelists and explorers who want instant card draws and responsive filter browsing without browser lag or storage bloat.
- **Key Value**: Near-zero latency when clicking **Draw Card**, up to 90%+ fewer requests to the YGOPRODeck API, and a tiny, strictly bounded browser storage footprint.

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Instant Unconstrained Draws**: Clicking **Draw Card** immediately pops a pre-normalized card whose front artwork is already preloaded in browser memory, allowing the 3D slide-in and card-back flip reveal to run at full speed with zero network wait.When 5 or fewer cards remain in the queue, a silent background fetch replenishes the buffer.
  2. **Fast Filtered Draws & Live Counts**: Selecting dropdown filters updates match counts via a shared in-flight request promise; typing in Archetype or Keyword inputs waits 300ms before querying the API. Drawing from an active filter reuses the cached pool and preloads the next random candidate's image.
  3. **Lean Favorites & History**: Favoriting a card saves a compact card record to `localStorage`; unfavoriting or clearing favorites immediately removes the record and replaces the stored map so `localStorage` stays tiny.
  4. **Responsive Matching Cards Sheet**: Opening **All Matching Cards** renders the first 48 cards immediately with smooth scroll-based batch loading for larger pools, and uses valid HTML semantics so clicking the Favorite heart icon never triggers nested-button errors.
- **Visual Identity & Theme**:
  - Preserves the existing dark slate and amber aesthetic (`bg-slate-950`, `text-amber-400`), 3D carousel perspective transitions, and disabled button states during animations.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1**: Prefetch Queue + Next-Image Preloading for Unconstrained Draws
  - *Chosen Approach*: Maintain a 30-card in-memory queue from YGOPRODeck's random endpoint (`num=30&offset=0&sort=random`) and preload the next 2 card images via `new Image()`.
  - *Why*: Previously, the app requested 15 random cards on every single draw, used 1, and discarded the other 14—forcing the user to wait for both an API round-trip and a cold image download on every click.
  - *Alternatives Considered*: Downloading the entire 13,000-card database on startup—rejected because a ~15MB JSON payload wastes bandwidth and violates the constraint against storing too much data in the browser.

- **Decision 2**: Bounded 3-Slot LRU Filter Cache with Payload Slimming
  - *Chosen Approach*: Normalize and slim card objects once upon API receipt (retaining only the primary image object, up to 8 card sets, and primary prices) and cap the filter query cache to 3 entries, replacing the oldest cached filter pool when a new filter is queried.
  - *Why*: Broad filters (such as `Property: Monster`) return thousands of cards. Replacing older filter pools and stripping unused array items prevents RAM bloat while keeping repeated draws within the current filter instant.
  - *Alternatives Considered*: Caching every filter query for 30 minutes without eviction—rejected because switching across several broad filters accumulates tens of thousands of heavy objects in memory.

- **Decision 3**: Pruned `localStorage` Persistence & Reduced Redux Duplication
  - *Chosen Approach*: Only persist card objects in `localStorage` that are actively favorited, delete them immediately when unfavorited, and cap session draw history to 30 slimmed cards while removing the redundant 100-card entity cache in Redux.
  - *Why*: Previously, every drawn card in history and all fallback cards were copied into the persisted favorites map and written to `localStorage` without ever being cleaned up.

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UI & Interaction Layer                           │
│  • Navbar / FilterBar (300ms debounced text inputs, active badge)       │
│  • CardDisplay (3D Carousel + instant preloaded image flip)             │
│  • MatchingCardsSheet (Accessible div tile + inner Favorite <button>,   │
│    incremental 48-card batch rendering)                                 │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Lean State & Persistence Layer                       │
│  • Active Filters (sessionStorage, cleaned keys)                        │
│  • Draw History (In-memory only, capped at 30 slimmed cards)            │
│  • Favorites (localStorage, strictly synced & pruned on unfavorite)     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             Smart API, Cache Replacement & Preload Engine               │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐  │
│  │ Unconstrained Prefetch Queue  │  │ Bounded LRU Filter Cache (≤ 3) │  │
│  │ • Fetches 30 cards per call   │  │ • In-flight request deduping   │  │
│  │ • Pops in 0ms on Draw Card    │  │ • Evicts & replaces old pools  │  │
│  │ • Background refill at ≤ 5    │  │ • Pre-slims card JSON (~70%)   │  │
│  └──────────────┬────────────────┘  └───────────────┬────────────────┘  │
│                 └─────────────────┬─────────────────┘                   │
│                                   ▼                                     │
│            Next-Card Artwork Preloader (Bounded Image Ring)             │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Slimmed Card Normalization**: Strips `card_images` down to index `0`, caps `card_sets` to the 8 displayed sets, and retains only `tcgplayer_price` and `cardmarket_price` in `card_prices[0]`.
  - **In-Flight Deduplication Map**: Maps active query strings to pending Promises so concurrent count checks and card draws share a single network call.
- **Interactive Component & State Mapping**:
  - **Draw Card Action**: Checks if filters are active. If unconstrained, pops the next preloaded card from the prefetch queue (or fetches if empty) and preloads the subsequent card's image. If filtered, resolves from the 3-slot LRU cache (or shared in-flight request) and preloads the next random unseen candidate.
  - **Matching Cards Grid**: Renders an outer `<div role="button" tabIndex={0}>` for card selection and an inner `<button type="button">` for Favorite toggling, slicing the displayed array to a paginated visible count that increments on scroll or button click.
