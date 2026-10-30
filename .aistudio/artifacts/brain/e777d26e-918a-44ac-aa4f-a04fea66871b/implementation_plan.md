# UI, Modal Back Navigation & Interaction Refinements Plan

## Overview
We will implement seven targeted improvements across the application to streamline card inspection, filter ergonomics, mobile/tablet responsiveness, and browser/mobile back-button modal dismissal:

1. **Return to Top Opacity (`src/components/ScrollToTopButton.tsx`)**
   - Adjust the floating `"Return to top"` button opacity to **85%** (`opacity-85 hover:opacity-100`).

2. **Relocate "View Similar Cards" Next to Card Name Box & Dynamic Card Name Sizing (`src/components/CardDisplay.tsx`)**
   - Remove the standalone `"View Similar Cards"` button from below the card image column.
   - Place the `"View Similar Cards"` button directly to the **right** of the Card Name box within a shared flex row (`flex items-stretch gap-2.5 w-full`).
   - Constrain the `"View Similar Cards"` button to a compact icon + short label tile taking up **no more than 30%** of the row width (`max-w-[28%] sm:max-w-[24%] shrink-0`), while the Card Name box occupies the remaining width (`flex-1 min-w-0`).
   - Give the Card Name box a fixed height container with wrapping text (`whitespace-normal break-words line-clamp-2`) and dynamic font-size scaling based on card name length (`text-xl sm:text-2xl` for short names, scaling down to `text-base sm:text-lg`, `text-sm sm:text-base`, or `text-xs sm:text-sm` for longer card names) so longer names wrap cleanly inside the allotted space without expanding the box height.

3. **Card Preview Modal in History & Favorites Drawers (`src/components/HistoryDrawer.tsx`, `src/components/FavoritesDrawer.tsx`)**
   - Integrate `CardPreviewModal` into both `HistoryDrawer` and `FavoritesDrawer`.
   - Clicking a card row opens `CardPreviewModal` for that card while keeping the right-hand arrow button (`ArrowRight`) as a direct 1-click card selector.
   - Inside the preview modal:
     - Clicking **Select Card** selects the card and closes both the preview modal and the parent drawer.
     - Clicking **Similar Cards** dispatches `openSimilarCardsForCard(selected)`, closes the preview modal and drawer, and opens the Similar Cards sheet for that card.

4. **Seamless "Clear Filters" Integration (`src/components/FilterBar.tsx`)**
   - Keep `More Filters`, `Draw Card`, and `Clear Filters` aligned on a single horizontal row (`flex-nowrap items-center gap-2 sm:gap-2.5 w-full md:w-auto`) across both mobile and desktop views.
   - Render `Clear Filters` as a compact icon-only reset button (`RotateCcw`) on mobile viewports (`px-3 py-2.5`) and display the full `"Clear Filters"` label alongside the icon on `sm:` / desktop viewports (`hidden sm:inline`).

5. **Responsive Button Sizing in Similar Cards Header (`src/components/RelevantCardsSheet.tsx`)**
   - Refine the `"Include Archetypal cards"` and `"Include AI Suggested Synergies"` toggle buttons for mobile and tablet viewports using compact padding (`px-2 py-1 sm:px-2.5 sm:py-1.5`), responsive typography (`text-[11px] sm:text-xs`), and concise mobile labels (`Archetypal` / `AI Synergies` on small screens, expanding to `Include Archetypal cards` / `Include AI Suggested Synergies` on larger screens) so both buttons fit cleanly without crowding the sheet header.

6. **Card Preview Modal Header & Round Favorite Heart (`src/components/CardPreviewModal.tsx`)**
   - Remove the top-right `✕` close button and top-bar rectangular favorite button from the top banner, leaving only the `← Back` button in the top banner.
   - Relocate the Favorite Heart button next to the card name in the right-hand details column as a circular button (`rounded-full w-9 h-9 flex items-center justify-center`).

7. **Universal Desktop & Mobile Back Button Modal Dismissal (`src/hooks/useModalBackHandler.ts`)**
   - Create a centralized, stack-aware History API hook (`useModalBackHandler`) and wire it into every modal, sheet, and drawer in the app:
     - `CardPreviewModal`
     - `RelevantCardsSheet` (Similar Cards)
     - `MatchingCardsSheet` (All Matching Cards)
     - `HistoryDrawer` (Draw History)
     - `FavoritesDrawer` (Favorites)
     - Full-size Card Artwork Lightbox (`CardDisplay.tsx`)
   - Pressing the browser Back arrow on desktop or the hardware/gesture Back button on mobile will always close only the topmost open modal/sheet/drawer (e.g., closing `CardPreviewModal` first while keeping the parent `Similar Cards` / `Matching Cards` / `History` / `Favorites` view open, and closing the parent sheet on the next Back press) without navigating away from the page.
