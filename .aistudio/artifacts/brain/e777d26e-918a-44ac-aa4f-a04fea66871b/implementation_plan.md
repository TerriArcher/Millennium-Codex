# Implementation Plan: Title Update, Left-Side Favorites, & Mobile Responsive Overhaul

## Overview
1. Update project title to **"Random Yu-Gi-Oh! Card Explorer"** across headings and metadata.
2. Reposition the **Favorites** sidebar to slide in smoothly from the **left** side of the screen (`justify-start`, `border-r`, `slide-in-from-left`).
3. Overhaul responsive styling and viewport constraints across the **Navbar**, **FilterBar**, and **CardDisplay** to ensure the entire page fits seamlessly on all mobile screens (320px+) with zero horizontal scrolling.

---

## User Review Required

> [!NOTE]
> On mobile devices (<640px), the Navbar will adapt by showing compact icon-and-badge items for History and Favorites (with full text visible on tablets/desktops), and the wordmark and Draw button will scale proportionally to prevent any horizontal overflow.

---

## Proposed Changes

### 1. Title Updates
- **`src/pages/CardRandomizerPage.tsx`**:
  - Update `<h1>` title to **`"Random Yu-Gi-Oh! Card Explorer"`**.
- **`index.html`**:
  - Update `<title>`, `og:title`, and `description` to reflect **`"Random Yu-Gi-Oh! Card Explorer - Millennium Codex"`**.

### 2. Left-Side Favorites Sidebar (`src/components/FavoritesDrawer.tsx`)
- Shift slide-over container from `justify-end` to **`justify-start`**.
- Change border from `border-l` to **`border-r border-slate-800`**.
- Update animation class to **`slide-in-from-left duration-200 ease-out`**.
- Ensure mobile drawer width (`w-full sm:max-w-md`) fits comfortably on small screens with clean backdrop dismiss.

### 3. Mobile Responsive Layout Overhaul

#### A. Header / Navigation (`src/components/Navbar.tsx`)
- **Prevent Overflow**: Add `max-w-full overflow-x-hidden` constraints.
- **Responsive Wordmark**: Scale text size on mobile (`text-base sm:text-lg`), keeping the iconic eye emblem visible.
- **Adaptive Nav Items**:
  - **History & Favorites**: Show icons + count badge on mobile, with text labels appearing on `sm:` screens (`<span className="hidden sm:inline">History</span>`, `<span className="hidden sm:inline">Favorites</span>`).
  - **Random Card / Meta**: Clean, touch-friendly tab links.
- **Compact Draw CTA**: Ensure padding and text scale smoothly (`px-3 sm:px-4 py-1.5 sm:py-2 text-xs`).

#### B. Filter Bar (`src/components/FilterBar.tsx`)
- Ensure Property selector (`All`, `Monster`, `Spell`, `Trap`) wraps or scrolls smoothly within its container with `w-full overflow-x-auto`.
- Ensure action buttons (`More Filters`, `Draw Card`, `Clear Filters`) flex-wrap cleanly without exceeding screen width.
- Ensure filter chips and sliders respect mobile max-width.

#### C. Card Display & Root Page (`src/components/CardDisplay.tsx` & `src/App.tsx`)
- **Card Image**: Ensure image has `max-w-full w-64 xs:w-72 sm:w-80 md:w-88 h-auto` to naturally adapt on narrow screens (e.g., iPhone SE at 320px–375px).
- **Combat Stats & Attributes**: Flex-wrap stat chips and ensure ATK/DEF cards fit cleanly in 2-column or 1-column mobile layouts.
- **Global Container**: Set `w-full max-w-full overflow-x-hidden` on the root layout wrapper in `App.tsx` so horizontal scroll is strictly prevented.

---

## Verification Plan

### Automated Checks
- `lint_applet`: Verify zero TypeScript errors and valid syntax.
- `compile_applet`: Verify successful Vite build.

### Manual Verification
- Test viewport widths down to 320px, 375px, and 414px (mobile emulation) to confirm zero horizontal scrollbar appears.
- Test that clicking **Favorites** slides out cleanly from the left.
- Test that clicking **History** slides out cleanly from the right.
- Verify the header and Draw Card button remain accessible and fit within mobile bounds.
