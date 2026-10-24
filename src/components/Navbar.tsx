import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Compass, History, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onQuickDraw: () => void;
  historyCount: number;
  onOpenHistory: () => void;
  isLoading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onQuickDraw,
  historyCount,
  onOpenHistory,
  isLoading = false
}) => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
            {/* Millennium eye stylized motif */}
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          </div>
          <span className="font-display tracking-tight font-extrabold text-slate-100">
            Millennium <span className="text-amber-400">Codex</span>
          </span>
        </Link>

        {/* Zone 2: Navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              location.pathname === '/'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Random Card
            {location.pathname === '/' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </Link>

          <Link
            to="/resources"
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 ${
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
            className="whitespace-nowrap shrink-0 transition-colors text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
            title="View drawn cards history"
          >
            <History className="w-4 h-4" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="text-xs bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickDraw}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Drawing...' : 'Draw Card'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
