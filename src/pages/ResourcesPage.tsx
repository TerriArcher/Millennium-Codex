import React, { useState, useEffect } from 'react';
import { MetaResource } from '../types/card';
import { META_RESOURCES } from '../data/fallbackCards';
import {
  ExternalLink,
  Search,
  Copy,
  Check,
  Compass,
  Trophy,
  Database,
  Gamepad2,
  Newspaper,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<MetaResource[]>(META_RESOURCES);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let list = [...META_RESOURCES];
    if (activeCategory !== 'all') {
      list = list.filter((r) => r.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.highlights.some((h) => h.toLowerCase().includes(q))
      );
    }
    setResources(list);
  }, [activeCategory, searchQuery]);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = [
    { id: 'all', label: 'All Resources', icon: Compass },
    { id: 'meta', label: 'Competitive Meta', icon: Trophy },
    { id: 'database', label: 'Databases & Rulings', icon: Database },
    { id: 'simulator', label: 'Simulators & Tools', icon: Gamepad2 },
    { id: 'news', label: 'News & Community', icon: Newspaper }
  ];

  // Featured top cards explicitly requested: MasterduelMeta and YugiohMeta
  const featuredMetaResources = META_RESOURCES.filter(
    (r) => r.id === 'masterduelmeta' || r.id === 'yugiohmeta'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Page Title & Mission */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Curated Yu-Gi-Oh! Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white mb-3">
          Meta Guides & Competitive Resources
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Direct links to essential community hubs, official Konami card databases,
          automated tournament simulators, and premier tier lists like <strong className="text-slate-200">YugiohMeta</strong> and <strong className="text-slate-200">MasterduelMeta</strong>.
        </p>
      </div>

      {/* FEATURED SPOTLIGHT: YugiohMeta & MasterduelMeta */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            Featured Competitive Flagships
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredMetaResources.map((res) => (
            <div
              key={res.id}
              className="relative group p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl shadow-xl shadow-black/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-display">
                    {res.badge || 'Featured Flagship'}
                  </span>
                  <button
                    onClick={() => handleCopyUrl(res.url, res.id)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    title="Copy link"
                  >
                    {copiedId === res.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="text-2xl font-bold font-display text-white group-hover:text-amber-300 transition-colors">
                  {res.title}
                </h3>
                <p className="text-xs text-amber-400/90 font-mono mt-0.5 mb-3">{res.url}</p>

                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {res.description}
                </p>

                <div className="space-y-1.5 mb-5">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                    Key Features:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                    {res.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 italic">
                  {res.recommendedFor}
                </span>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 group-hover:scale-102"
                >
                  <span>Open Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar for All Resources */}
      <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((item) => {
          const isFeatured = item.id === 'masterduelmeta' || item.id === 'yugiohmeta';
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                isFeatured
                  ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {item.categoryLabel}
                  </span>
                  <button
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <h3 className="text-lg font-bold font-display text-white group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono block truncate mb-3">
                  {item.url}
                </span>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Highlights */}
                <div className="space-y-1 mb-4">
                  {item.highlights.slice(0, 3).map((h, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer with Direct Action */}
              <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 truncate mr-2">
                  {item.recommendedFor}
                </span>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-amber-500 hover:text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <span>Visit</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {resources.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm">No resources found matching "{searchQuery}".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-2 text-xs text-amber-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
