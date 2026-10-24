# Millennium Codex - Yu-Gi-Oh! Random Card & Meta Hub

A full-stack JavaScript web application featuring an Express backend powered directly by the **YGOPRODeck API** and a modern React (Vite + React Router) frontend. It delivers a 2-page experience: an interactive Random Yu-Gi-Oh! Card Generator with multifaceted filters and interactive chained exploration, alongside a curated Meta & Community Hub providing direct access to top competitive resources including YugiohMeta, MasterduelMeta, and official tournament databases.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Interactive Card Mechanics**:
> - **Card Presentation Layout**: Clean vertical flow featuring the high-resolution official card image on top.
> - **Hover Magnification**: Hovering over the card image smoothly enlarges it (`scale-105` to `scale-110` with subtle elevation shadow) for fine detail inspection without layout shift.
> - **Card Details & Effect Underneath**: Card name, attribute, level/rank/rating, type/race, attack/defense stats, and full effect text positioned directly below the image.
> - **Chained Exploration by Click**: Every key stat and trait is an interactive trigger. Clicking on the card's **Level / Rank / Rating**, **Attribute** (e.g. DARK, LIGHT), **Type / Race** (e.g. Dragon, Spellcaster, Continuous Spell), **ATK**, or **DEF** immediately filters and draws another random card sharing that exact property, complete with a visual feedback indicator.
> - **YGOPRODeck API Sourcing**: Express backend queries `https://db.ygoprodeck.com/api/v7/cardinfo.php` and `https://db.ygoprodeck.com/api/v7/randomcard.php` with support for `atk`, `def`, `level`, `attribute`, `race`, and `type` query parameters, backed by local cache and fallback snapshots.

---

### 1. Overview & Core Concept

- **What It Does**: 
  - **Randomizer Page (`/`)**: Sourced live from the YGOPRODeck database. Users can roll random cards using top-level filter controls, or dynamically "surf" the card universe by clicking on any property of the currently displayed card (e.g., clicking "ATK 2500" rolls another 2500 ATK card; clicking "DARK" rolls another DARK monster; clicking "Level 7" rolls another Level 7 monster).
  - **Meta & Resources Page (`/resources`)**: A central launchpad linking to competitive hubs (YugiohMeta, MasterduelMeta), deck building tools (YGOPRODeck, DuelingBook, Project Ignis), official ruling wikis, and weekly meta tournament analysis reports.
- **Target Audience / Persona**: Yu-Gi-Oh! duelists, theory-crafters, collectors, and casual players seeking discovery and competitive resources.
- **Key Value**: Novel chained discovery mechanic that lets users explore connected card archetypes and statlines seamlessly, backed by quick navigation to competitive meta sites.

---

### 2. User Experience & Visual Design

#### Visual Identity & Theme
- **Aesthetic Direction**: Sleek modern dark mode with subtle Egyptian gold and obsidian tones inspired by the Millennium Items and holographic trading card aesthetics, without AI-cliché glowing neon.
- **Color Palette & Discipline (60-30-10)**:
  - *60% Dominant Neutral Canvas*: Obsidian deep charcoal background (`#0B0F17` / `slate-950`).
  - *30% Structural Surfaces*: Matte slate cards (`#141B2B` / `slate-900`) with hairline borders (`#1E293B` / `slate-800`), authentic card frame accents (Effect amber-orange, Spell teal-green, Trap magenta-pink, Fusion violet, Synchro silver-white, Xyz cosmic black, Link deep navy).
  - *10% Focal Accent Budget*: Millennium Gold (`#EAB308` / `#F59E0B`) focused on primary action buttons, clickable stat badges, active navigation indicators, and key stat callouts.
- **Typography & Scale**:
  - *Display / Brand*: `Plus Jakarta Sans` with bold geometric weight for hero titles and card titles.
  - *Body Prose*: `DM Sans` with 1.6 line height for card effect text clarity.
  - *Data & Stats*: Monospace tabular numbers (`font-mono tabular-nums`) for ATK, DEF, Level stars, and Card Passcodes.

#### Vertical Card Showcase & Chained Exploration Flow

1. **Card Visual Presentation**:
   - **Image Stage (Top)**: Centered high-resolution card artwork from YGOPRODeck CDN with rounded corners and a subtle card border. Hovering over the image activates a smooth magnification effect (`transform scale-105 transition-transform duration-200 ease-out cursor-zoom-in`).
   - **Interactive Details & Effect Box (Underneath)**:
     - **Card Header**: Card Name in bold display typography, card frame classification (`Effect Monster`, `Spell Card`, `Trap Card`, `Fusion`, `Synchro`, `Xyz`, `Link`).
     - **Clickable Attribute & Level/Rank Strip**:
       - *Attribute Button*: e.g. `[DARK]` — Clickable badge with hover tooltip: *"Find random DARK card"*.
       - *Level / Rank / Link Rating Button*: e.g. `[★ Level 8]` or `[Rank 4]` or `[Rating 3]` — Clickable badge with hover tooltip: *"Find random Level 8 card"*.
       - *Type / Race Bracket*: e.g. `[ Dragon / Effect ]` or `[ Spell / Quick-Play ]` — Clickable with hover tooltip: *"Find random Dragon card"*.
     - **Clickable Combat Stats (Monsters)**:
       - *ATK Button*: e.g. `ATK: 3000` (tabular numerals) — Clickable with hover tooltip: *"Find random card with ATK 3000"*.
       - *DEF Button*: e.g. `DEF: 2500` (tabular numerals) — Clickable with hover tooltip: *"Find random card with DEF 2500"*.
     - **Card Effect & Lore Text**: High-contrast, beautifully padded text block rendering the card's official effect, condition clauses, and lore.
     - **Metadata Bar**: Card Passcode, Banlist Status (TCG / OCG / Master Duel), and Card Archetype (if present, also clickable).
   - **Active Filter / Chained State Pill**: A quiet indicator above the card showing current criteria (e.g., *"Filtered by: ATK 3000 · Showing 1 of 84 matching cards"* with a `"Clear Filter"` button).

2. **Top Controls & Presets**:
   - A clean filter drawer or bar allowing manual selection of Card Type, Attribute, Level/Rank (1-12), and Race.
   - Primary **"Draw Random Card"** button that draws based on current active criteria or unconstrained if no filters are selected.
   - **"Draw History"** drawer to review and re-select cards drawn earlier in the session.

3. **Page 2: Meta & Resources Hub (`/resources`)**:
   - Clean top search bar to filter resources by title, game mode, or keywords.
   - Segmented category tabs: "All", "Competitive Meta & Tier Lists", "Databases & Rulings", "Simulators & Tools", "News & Communities".
   - Rich resource cards for:
     - **Master Duel Meta**: Tier lists, tournament breakdowns, deck archetypes, and gem guides.
     - **Yu-Gi-Oh! Meta**: TCG tournament reports, regional decklists, and banlist predictions.
     - **YGOPRODeck**: Community deck builder, card database, and price tracking.
     - **Yugipedia & Konami Official DB**: Complete official card text and tournament rulings.
     - **Dueling Nexus & DuelingBook**: Browser-based dueling simulators for testing decks.
     - **Road of the King**: In-depth weekly Asian OCG metagame analysis.
   - Direct external link triggers (`target="_blank" rel="noopener noreferrer"`) and quick copy buttons.

4. **Top Bar Contract**:
   - Zone 1 (Brand): **Millennium Codex** wordmark with duel crest.
   - Zone 2 (Nav Links): **Random Card**, **Meta & Resources**, **Draw History**.
   - Zone 3 (Action): Single-line primary action **"Draw Card"**.

---

### 3. Key Product Decisions & Trade-Offs

- **Chained Stat Querying via Express**:
  - *Chosen Approach*: Express route `/api/cards/random` accepts query parameters: `type`, `attribute`, `level`, `race`, `atk`, `def`. When a user clicks a stat, the client invokes `/api/cards/random?atk=3000` (or `?attribute=DARK`, etc.). Express maps these directly to the YGOPRODeck API parameter standards.
  - *Why*: Allows instant server-side random selection from the exact matching pool without downloading thousands of cards to the browser.
- **Card Image Hover Experience**:
  - *Chosen Approach*: CSS compositor transform `scale-105` to `scale-110` with hardware-accelerated easing and elevation box-shadow on hover.
  - *Why*: Provides tactile inspection without causing reflows or pushing the card text down during hover.
- **Fail-Safe Fallback Snapshot**:
  - *Chosen Approach*: Express backend caches retrieved cards in memory and bundles an offline fallback seed of iconic cards spanning all types, attributes, and ATK/DEF profiles.
  - *Why*: Ensures seamless operation even during third-party API rate limits.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19 + Vite)                      │
│                                                                        │
│   ┌─────────────────────────── Top Navigation ─────────────────────┐   │
│   │ [Millennium Codex]   [Random Card]  [Meta Resources] [Draw Card]  │   │
│   └──────────────────────────────────┬─────────────────────────────┘   │
│                                      │                                 │
│                  ┌───────────────────┴──────────────────┐              │
│                  ▼                                      ▼              │
│        [Page 1: CardRandomizer]               [Page 2: ResourceHub]    │
│        ├── Filter Toolbar                      ├── Category Filter     │
│        ├── Card Showcase (Vertical):           ├── Search Input        │
│        │   ├── Image (Hover Zoom)              └── Resource Cards Grid │
│        │   └── Underneath:                            (MasterDuelMeta, │
│        │       ├── [Name] [Subtype]                    YugiohMeta,etc) │
│        │       ├── [Attribute] [Level]  <-- Clickable                  │
│        │       ├── [Race]               <-- Clickable                  │
│        │       ├── [ATK / DEF]          <-- Clickable                  │
│        │       └── Effect / Lore Box                                   │
│        └── History Sidebar Drawer                                      │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │ HTTP /api/cards/random?atk=...
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Backend (Node.js + Express)                       │
│                                                                        │
│   ├── GET /api/cards/random                                            │
│   │   (params: atk, def, level, attribute, race, type)                 │
│   ├── GET /api/cards/filters                                           │
│   └── GET /api/resources                                               │
│                     │                                                  │
│                     ▼                                                  │
│       [YGOPRODeck API v7 Live Integration]                             │
│       ├── https://db.ygoprodeck.com/api/v7/cardinfo.php                │
│       ├── https://db.ygoprodeck.com/api/v7/randomcard.php              │
│       └── In-Memory LRU Cache & Fallback Backup                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key API Contracts

- `GET /api/cards/random`
  - Parameters (optional): `atk`, `def`, `level`, `attribute`, `race`, `type`, `fname`
  - Express translates parameters into YGOPRODeck query format and retrieves a random card from the resulting set.
  - Returns: `{ card: CardObject, totalMatches: number, activeFilter: object, source: 'ygoprodeck' }`
- `GET /api/cards/filters`
  - Returns available attributes (`DARK`, `LIGHT`, `EARTH`, `WATER`, `FIRE`, `WIND`, `DIVINE`), monster types, card frames, and spell/trap categories.
- `GET /api/resources`
  - Returns curated meta resources list with titles, URLs, descriptions, categories, and tags.

#### Implementation Steps
1. **Package Setup**: Install `react-router-dom` on the frontend.
2. **Backend Server (`server.ts`)**: Implement Express server with proxy endpoints to YGOPRODeck API v7 supporting `atk`, `def`, `level`, `attribute`, `race`, and `type`, with LRU caching and fallback seed.
3. **Vite & Server Integration**: Update `vite.config.ts` to proxy `/api` calls to Express in dev.
4. **Card Randomizer View (`/`)**:
   - Build vertical card frame with hover magnification on the card image.
   - Build clickable stats (Level/Rank, Attribute, Race/Type, ATK, DEF) that trigger chained random draws.
   - Build card effect text area, banlist chips, and draw history drawer.
5. **Meta & Resources View (`/resources`)**:
   - Build categorized resource directory with search, category tabs, and direct links to MasterduelMeta, YugiohMeta, YGOPRODeck, etc.
6. **Verification**: Run `compile_applet` and verify responsiveness, layout integrity, and error-free operation.
