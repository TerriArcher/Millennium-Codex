import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Compass, History, Heart, Layers } from 'lucide-react';

interface NavbarProps {
  onQuickDraw: () => void;
  historyCount: number;
  onOpenHistory: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  isLoading?: boolean;
  activeFiltersCount?: number;
  totalMatches?: number;
  onOpenMatchingCards?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onQuickDraw,
  historyCount,
  onOpenHistory,
  favoritesCount,
  onOpenFavorites,
  isLoading = false,
  activeFiltersCount = 0,
  totalMatches,
  onOpenMatchingCards
}) => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md shadow-md shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 min-h-16 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-2 sm:gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark (Balanced Left Column on Desktop) */}
        <div className="flex items-center justify-start md:flex-1 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 text-base sm:text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              {/* Millennium eye stylized motif */}
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </div>
            <span className="font-display tracking-tight font-extrabold text-slate-100">
              <span className="hidden min-[400px]:inline">Millennium </span>
              <span className="text-amber-400">Codex</span>
            </span>
          </Link>
        </div>

        {/* Zone 2: Centered Navigation Links */}
        <nav className="flex items-center justify-center gap-2.5 sm:gap-5 lg:gap-6 text-xs sm:text-sm font-medium min-w-0">
          <Link
            to="/"
            className={`whitespace-nowrap shrink-0 transition-colors py-1 px-1 relative ${
              location.pathname === '/'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Random</span>
            <span className="hidden sm:inline"> Card</span>
            {location.pathname === '/' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </Link>

          <Link
            to="/resources"
            className={`whitespace-nowrap shrink-0 transition-colors py-1 px-1 relative hidden lg:flex items-center gap-1.5 ${
              location.pathname === '/resources'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Meta & Resources</span>
            {location.pathname === '/resources' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </Link>

          <button
            onClick={onOpenHistory}
            className="whitespace-nowrap shrink-0 transition-colors text-slate-400 hover:text-slate-200 flex items-center gap-1 sm:gap-1.5 cursor-pointer py-1 px-1.5 rounded-md hover:bg-slate-900/60"
            title="View drawn cards history"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="text-[10px] sm:text-xs bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                {historyCount}
              </span>
            )}
          </button>

          {/* Favorites item next to History */}
          <button
            onClick={onOpenFavorites}
            className="whitespace-nowrap shrink-0 transition-colors text-slate-400 hover:text-red-400 flex items-center gap-1 sm:gap-1.5 cursor-pointer py-1 px-1.5 rounded-md hover:bg-slate-900/60"
            title="View saved favorite cards"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'text-red-400 fill-red-400/20' : ''}`} />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] sm:text-xs bg-red-950/70 text-red-300 border border-red-800/40 px-1.5 py-0.2 rounded font-mono">
                {favoritesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions (Centered on Mobile, Balanced Right Column on Desktop) */}
        <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end md:flex-1 gap-2 sm:gap-2.5 shrink-0">
          {/* Matching Cards Button - Only displayed when filters are active */}
          {activeFiltersCount > 0 && totalMatches !== undefined && totalMatches > 0 && onOpenMatchingCards && (
            <button
              type="button"
              onClick={onOpenMatchingCards}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
              title="View all cards matching database criteria"
              aria-label={`View ${totalMatches} matching cards`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-mono font-bold">
                {totalMatches.toLocaleString()}
              </span>
              <span className="hidden sm:inline text-[11px] text-amber-400/90 font-medium">
                {totalMatches === 1 ? 'card' : 'cards'}
              </span>
            </button>
          )}

          <button
            onClick={onQuickDraw}
            disabled={isLoading}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 disabled:bg-slate-800 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border-slate-700/80 disabled:shadow-none disabled:cursor-not-allowed disabled:pointer-events-none ${
              isLoading
                ? 'bg-slate-800 text-slate-500 border border-slate-700/80 shadow-none cursor-not-allowed pointer-events-none'
                : 'text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer'
            }`}
            title={activeFiltersCount > 0 ? `Draw random card with ${activeFiltersCount} active filter criteria` : 'Draw random card'}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-slate-500' : ''}`} />
            <span>{isLoading ? 'Drawing...' : 'Draw Card'}</span>
            {activeFiltersCount > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full leading-none ${
                  isLoading ? 'bg-slate-700 text-slate-400' : 'bg-slate-950 text-amber-400'
                }`}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
