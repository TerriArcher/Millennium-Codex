import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Compass, History, Heart } from 'lucide-react';

interface NavbarProps {
  onQuickDraw: () => void;
  historyCount: number;
  onOpenHistory: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  isLoading?: boolean;
  activeFiltersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onQuickDraw,
  historyCount,
  onOpenHistory,
  favoritesCount,
  onOpenFavorites,
  isLoading = false,
  activeFiltersCount = 0
}) => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md shadow-md shadow-black/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Single text element wordmark */}
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
            <span className="hidden min-[420px]:inline">Millennium </span>
            <span className="text-amber-400">Codex</span>
          </span>
        </Link>

        {/* Zone 2: Navigation links */}
        <nav className="flex items-center gap-2 sm:gap-5 text-xs sm:text-sm font-medium min-w-0">
          <Link
            to="/"
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
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
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative hidden md:flex items-center gap-1.5 ${
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
            className="whitespace-nowrap shrink-0 transition-colors text-slate-400 hover:text-slate-200 flex items-center gap-1 sm:gap-1.5 cursor-pointer p-1 sm:p-0"
            title="View drawn cards history"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="text-[10px] sm:text-xs bg-slate-800 text-amber-300 px-1 sm:px-1.5 py-0.2 rounded font-mono">
                {historyCount}
              </span>
            )}
          </button>

          {/* Favorites item next to History */}
          <button
            onClick={onOpenFavorites}
            className="whitespace-nowrap shrink-0 transition-colors text-slate-400 hover:text-red-400 flex items-center gap-1 sm:gap-1.5 cursor-pointer p-1 sm:p-0"
            title="View saved favorite cards"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'text-red-400 fill-red-400/20' : ''}`} />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] sm:text-xs bg-red-950/70 text-red-300 border border-red-800/40 px-1 sm:px-1.5 py-0.2 rounded font-mono">
                {favoritesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onQuickDraw}
            disabled={isLoading}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
            title={activeFiltersCount > 0 ? `Draw random card with ${activeFiltersCount} active filter criteria` : 'Draw random card'}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Drawing...' : 'Draw Card'}</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-950/25 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
