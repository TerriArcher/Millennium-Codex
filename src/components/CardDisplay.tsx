import React, { useState } from 'react';
import { YugiohCard } from '../types/card';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Swords,
  Star,
  Layers,
  Maximize2,
  Bookmark,
  Tag
} from 'lucide-react';

interface CardDisplayProps {
  card: YugiohCard;
  onExploreStat: (statFilter: {
    attribute?: string;
    level?: number;
    race?: string;
    type?: string;
    superType?: string;
    archetype?: string;
    scale?: number;
    atk?: number;
    def?: number;
  }) => void;
  isLoading?: boolean;
}

// Color schemes matching authentic Yu-Gi-Oh card frames
function getCardFrameDetails(card: YugiohCard) {
  const typeStr = (card.type || '').toLowerCase();
  const hasScale = typeof card.scale === 'number' && !isNaN(card.scale) && card.scale >= 0;
  
  if (typeStr.includes('pendulum') || hasScale) {
    return {
      bg: 'bg-teal-950/40',
      border: 'border-teal-600/40',
      text: 'text-teal-400',
      accent: 'teal',
      label: card.type || 'Pendulum Monster'
    };
  }
  if (typeStr.includes('spell')) {
    return {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-600/40',
      text: 'text-emerald-400',
      accent: 'emerald',
      label: 'Spell Card'
    };
  }
  if (typeStr.includes('trap')) {
    return {
      bg: 'bg-pink-950/40',
      border: 'border-pink-600/40',
      text: 'text-pink-400',
      accent: 'pink',
      label: 'Trap Card'
    };
  }
  if (typeStr.includes('fusion')) {
    return {
      bg: 'bg-purple-950/40',
      border: 'border-purple-600/40',
      text: 'text-purple-400',
      accent: 'purple',
      label: 'Fusion Monster'
    };
  }
  if (typeStr.includes('ritual')) {
    return {
      bg: 'bg-sky-950/40',
      border: 'border-sky-600/40',
      text: 'text-sky-400',
      accent: 'sky',
      label: 'Ritual Monster'
    };
  }
  if (typeStr.includes('synchro')) {
    return {
      bg: 'bg-slate-900',
      border: 'border-slate-300/40',
      text: 'text-slate-200',
      accent: 'slate',
      label: 'Synchro Monster'
    };
  }
  if (typeStr.includes('xyz')) {
    return {
      bg: 'bg-zinc-950',
      border: 'border-zinc-700',
      text: 'text-zinc-200',
      accent: 'zinc',
      label: 'Xyz Monster'
    };
  }
  if (typeStr.includes('link')) {
    return {
      bg: 'bg-blue-950/50',
      border: 'border-blue-600/40',
      text: 'text-blue-400',
      accent: 'blue',
      label: 'Link Monster'
    };
  }
  if (typeStr.includes('spirit')) {
    return {
      bg: 'bg-amber-950/40',
      border: 'border-amber-600/40',
      text: 'text-amber-300',
      accent: 'amber',
      label: 'Spirit Monster'
    };
  }
  if (typeStr.includes('normal')) {
    return {
      bg: 'bg-amber-950/30',
      border: 'border-amber-700/40',
      text: 'text-amber-300',
      accent: 'amber',
      label: 'Normal Monster'
    };
  }
  return {
    bg: 'bg-amber-950/40',
    border: 'border-amber-600/40',
    text: 'text-amber-400',
    accent: 'amber',
    label: card.type || 'Monster Card'
  };
}

// Determine monster super type if any
function detectSuperType(type?: string): string | undefined {
  if (!type) return undefined;
  const t = type.toLowerCase();
  if (t.includes('link')) return 'Link';
  if (t.includes('xyz')) return 'XYZ';
  if (t.includes('synchro')) return 'Synchro';
  if (t.includes('ritual')) return 'Ritual';
  if (t.includes('pendulum')) return 'Pendulum';
  if (t.includes('fusion')) return 'Fusion';
  if (t.includes('spirit')) return 'Spirit';
  if (t.includes('toon')) return 'Toon';
  if (t.includes('gemini')) return 'Gemini';
  if (t.includes('union')) return 'Union';
  return undefined;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  onExploreStat,
  isLoading = false
}) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSets, setShowSets] = useState(false);

  const safeType = card.type || (card.atk !== undefined || card.def !== undefined ? 'Effect Monster' : 'Card');
  const typeStr = safeType.toLowerCase();
  const frame = getCardFrameDetails(card);
  const isMonster = card.atk !== undefined || typeStr.includes('monster');
  const isXyz = typeStr.includes('xyz');
  const isLink = typeStr.includes('link');
  const hasScale = typeof card.scale === 'number' && !isNaN(card.scale) && card.scale >= 0;
  const isPendulum = typeStr.includes('pendulum') || hasScale;
  const superType = detectSuperType(card.type);

  // Extract TCGplayer price
  const rawPrice = card.card_prices?.[0]?.tcgplayer_price;
  const tcgPrice = rawPrice && rawPrice !== '0.00' && rawPrice !== '0'
    ? (rawPrice.startsWith('$') ? rawPrice.slice(1) : rawPrice)
    : (card.card_prices?.[0]?.cardmarket_price || '0.99');

  const cardImage = card.card_images?.[0]?.image_url || `https://images.ygoprodeck.com/images/cards/${card.id}.jpg`;

  const handleCopyName = () => {
    navigator.clipboard.writeText(card.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* 1. TOP: Card Image with Hover Zoom */}
      <div className="relative group/card-img mb-6 flex flex-col items-center">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-700/70 bg-slate-900 transition-all duration-300">
          {!imageError ? (
            <img
              src={cardImage}
              alt={card.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-72 sm:w-80 md:w-88 h-auto object-contain transition-transform duration-300 ease-out group-hover/card-img:scale-108 cursor-zoom-in drop-shadow-md select-none"
            />
          ) : (
            <div className="w-72 sm:w-80 h-112 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 p-6 flex flex-col items-center justify-between text-center border-2 border-dashed border-slate-700">
              <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                {frame.label}
              </div>
              <div>
                <Layers className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                <h3 className="text-xl font-bold font-display text-white">{card.name}</h3>
                <p className="text-sm text-slate-400 mt-2">{card.race} / {card.attribute}</p>
                {hasScale && (
                  <p className="text-xs text-teal-400 font-bold mt-1">Scale {card.scale}</p>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono">ID: {card.id}</div>
            </div>
          )}

          {/* Hover zoom hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded px-2.5 py-1 text-[11px] text-slate-300 pointer-events-none opacity-0 group-hover/card-img:opacity-100 transition-opacity flex items-center gap-1.5 whitespace-nowrap shadow-md">
            <Maximize2 className="w-3 h-3 text-amber-400" />
            <span>Hover zoomed · Card #{card.id}</span>
          </div>
        </div>
      </div>

      {/* 2. UNDERNEATH: Card Text and Details Box */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-950/60 backdrop-blur-sm">
        {/* Card Name Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="space-y-1.5 min-w-0 flex-1">
            {/* Row for ClassName, Archetype, and TCGplayer price */}
            <div className="flex items-center gap-2 flex-wrap pb-0.5 w-full">
              <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded border ${frame.bg} ${frame.border} ${frame.text} whitespace-nowrap`}>
                {frame.label}
              </span>

              {/* CLICKABLE ARCHETYPE BADGE - FULL NAME DISPLAY */}
              {card.archetype && (
                <button
                  onClick={() => onExploreStat({ archetype: card.archetype })}
                  disabled={isLoading}
                  title={`Click to find another card in the "${card.archetype}" archetype`}
                  className="shrink-0 group text-xs text-slate-300 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 px-2.5 py-0.5 rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Bookmark className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-slate-400 group-hover:text-amber-400 shrink-0">Archetype:</span>
                  <span className="font-bold text-amber-300 underline underline-offset-2 whitespace-nowrap">
                    {card.archetype}
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-mono shrink-0">↺</span>
                </button>
              )}

              {/* TCGPLAYER PRICE TEXT ICON */}
              {tcgPrice && (
                <a
                  href={`https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(card.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`TCGplayer Market Price: $${tcgPrice} (click to view listing on TCGplayer)`}
                  className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Tag className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    TCG
                  </span>
                  <span className="font-mono font-bold text-emerald-400">${tcgPrice}</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                {card.name}
              </h2>
              <button
                onClick={handleCopyName}
                className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 rounded-md transition-colors cursor-pointer shrink-0 border border-transparent hover:border-slate-700/60"
                title={copied ? "Copied card name!" : "Copy card name"}
                aria-label="Copy card name"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              {copied && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  Copied!
                </span>
              )}
            </div>
          </div>

          {/* Links Div docked at the bottom of the box */}
          <div
            className="flex items-center gap-2 shrink-0 self-end sm:self-end mt-0"
            style={{ marginTop: '0px' }}
          >
            <a
              href={card.ygoprodeck_url || `https://ygoprodeck.com/card/${encodeURIComponent(card.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-xs font-medium text-slate-300 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors flex items-center gap-1.5"
              title="Open direct page on YGOPRODeck in a new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">YGOPRODeck</span>
            </a>

            <a
              href={`https://www.yugiohmeta.com/cards/${encodeURIComponent(card.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-xs font-medium text-slate-300 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors flex items-center gap-1.5"
              title="Open card page on Yu-Gi-Oh! Meta in a new tab"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Yugioh Meta</span>
            </a>
          </div>
        </div>

        {/* Interactive Exploration Hint */}
        <div className="py-2.5 px-3 my-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs text-amber-300/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {hasScale
                ? 'Click any attribute, archetype, scale, level, race, ATK, or DEF to draw another matching card!'
                : isMonster
                ? 'Click any attribute, archetype, level, race, ATK, or DEF to draw another matching card!'
                : 'Click any property, subtype, or archetype to draw another matching card!'}
            </span>
          </div>
          {isLoading && <span className="animate-pulse font-mono text-[11px]">Searching...</span>}
        </div>

        {/* PENDULUM SCALE DISPLAY & CLICKABLE EXPLORER - ONLY DISPLAYED IF CARD HAS A PENDULUM SCALE */}
        {hasScale && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-950/40 via-teal-950/40 to-red-950/40 border border-teal-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Blue scale diamond */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/50 text-blue-400 font-mono font-extrabold text-sm shadow-sm">
                <span className="text-xs">◄</span>
                <span>{card.scale}</span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 block">
                  Pendulum Scale
                </span>
                <span className="text-[11px] text-slate-400">
                  Allows summoning monsters Level {card.scale}
                </span>
              </div>

              {/* Red scale diamond */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-red-400 font-mono font-extrabold text-sm shadow-sm">
                <span>{card.scale}</span>
                <span className="text-xs">►</span>
              </div>
            </div>

            <button
              onClick={() => onExploreStat({ scale: card.scale })}
              disabled={isLoading}
              title={`Find random card with Pendulum Scale ${card.scale}`}
              className="px-3 py-1.5 text-xs font-semibold text-teal-300 hover:text-white bg-teal-950/60 hover:bg-teal-900 border border-teal-600/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Roll Scale {card.scale}</span>
              <span className="text-xs">↺</span>
            </button>
          </div>
        )}

        {/* CLICKABLE ATTRIBUTES & STATS SECTION */}
        {isMonster ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-5">
            {/* 1. Attribute */}
            {card.attribute && (
              <button
                onClick={() => onExploreStat({ attribute: card.attribute })}
                disabled={isLoading}
                title={`Find random ${card.attribute} monster`}
                className="group flex flex-col p-2.5 bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                  Attribute
                </span>
                <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300 flex items-center justify-between mt-0.5">
                  <span>{card.attribute}</span>
                  <span className="text-[10px] text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    Roll ↺
                  </span>
                </span>
              </button>
            )}

            {/* 2. Level / Rank / Link Rating */}
            {(card.level !== undefined || card.linkval !== undefined) && (
              <button
                onClick={() => onExploreStat({ level: card.level ?? card.linkval })}
                disabled={isLoading}
                title={`Find random Level/Rank ${card.level ?? card.linkval} monster`}
                className="group flex flex-col p-2.5 bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium flex items-center gap-1">
                  {isXyz ? 'Rank' : isLink ? 'Link Rating' : 'Level'}
                </span>
                <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300 flex items-center justify-between mt-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{card.level ?? card.linkval}</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    Roll ↺
                  </span>
                </span>
              </button>
            )}

            {/* 3. Monster Type */}
            {card.race && (
              <button
                onClick={() => onExploreStat({ race: card.race })}
                disabled={isLoading}
                title={`Find random ${card.race} monster`}
                className="group flex flex-col p-2.5 bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                  Monster Type
                </span>
                <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300 flex items-center justify-between mt-0.5 truncate">
                  <span className="truncate">{card.race}</span>
                  <span className="text-[10px] text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    Roll ↺
                  </span>
                </span>
              </button>
            )}

            {/* 4. Super Type or Category */}
            <button
              onClick={() => onExploreStat(superType ? { superType } : card.type ? { type: card.type } : {})}
              disabled={isLoading}
              title={`Find random ${superType ? superType : safeType}`}
              className="group flex flex-col p-2.5 bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-amber-400 font-medium">
                {superType ? 'Super Type' : 'Type'}
              </span>
              <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300 flex items-center justify-between mt-0.5 truncate">
                <span className="truncate">{superType || safeType.replace(' Monster', '')}</span>
                <span className="text-[10px] text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  Roll ↺
                </span>
              </span>
            </button>
          </div>
        ) : (
          /* SPELL / TRAP STATS: PROPERTY & SUBTYPE */
          <div className="grid grid-cols-2 gap-3 pb-5">
            {/* 1. Property: "Spell Card" or "Trap Card" */}
            <button
              onClick={() => onExploreStat({ type: typeStr.includes('trap') ? 'Trap Card' : 'Spell Card' })}
              disabled={isLoading}
              title={`Find random ${typeStr.includes('trap') ? 'Trap Card' : 'Spell Card'}`}
              className="group flex flex-col p-3 bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-amber-400 font-semibold flex items-center gap-1.5">
                <span>Property</span>
                <span className={`w-2 h-2 rounded-full ${typeStr.includes('trap') ? 'bg-pink-400' : 'bg-emerald-400'}`} />
              </span>
              <span className="text-base font-bold text-slate-100 group-hover:text-amber-300 flex items-center justify-between mt-1">
                <span className={typeStr.includes('trap') ? 'text-pink-300' : 'text-emerald-300'}>
                  {typeStr.includes('trap') ? 'Trap Card' : 'Spell Card'}
                </span>
                <span className="text-xs text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  Roll ↺
                </span>
              </span>
            </button>

            {/* 2. Subtype: Quick, Field, Continuous, Counter, Ritual, Equip, Normal */}
            <button
              onClick={() => {
                const mappedRace = (card.race || '').toLowerCase() === 'quick' ? 'Quick-Play' : (card.race || 'Normal');
                onExploreStat({
                  race: mappedRace,
                  type: typeStr.includes('trap') ? 'Trap Card' : 'Spell Card'
                });
              }}
              disabled={isLoading}
              title={`Find random ${card.race === 'Quick-Play' ? 'Quick' : (card.race || 'Normal')} ${typeStr.includes('trap') ? 'Trap' : 'Spell'}`}
              className="group flex flex-col p-3 bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-amber-400 font-semibold flex items-center gap-1.5">
                <span>Subtype</span>
              </span>
              <span className="text-base font-bold text-slate-100 group-hover:text-amber-300 flex items-center justify-between mt-1">
                <span>{card.race === 'Quick-Play' ? 'Quick' : (card.race || 'Normal')}</span>
                <span className="text-xs text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  Roll ↺
                </span>
              </span>
            </button>
          </div>
        )}

        {/* COMBAT STATS (ATK & DEF) FOR MONSTERS */}
        {isMonster && (
          <div className="grid grid-cols-2 gap-3 pb-5">
            {/* Clickable ATK */}
            {card.atk !== undefined && (
              <button
                onClick={() => onExploreStat({ atk: card.atk })}
                disabled={isLoading}
                title={`Find random card with ${card.atk} ATK`}
                className="group p-3 bg-gradient-to-r from-red-950/40 to-slate-950/60 hover:from-red-950/70 hover:to-amber-950/40 border border-red-900/40 hover:border-red-500/60 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-950/80 text-red-400 group-hover:text-red-300 border border-red-800/40">
                    <Swords className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold tracking-wider text-red-400/90">ATK</div>
                    <div className="text-xl font-extrabold text-white font-mono tabular-nums">
                      {card.atk < 0 ? '?' : card.atk}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-red-400/80 group-hover:text-amber-300 group-hover:underline">
                  Roll ATK ↺
                </span>
              </button>
            )}

            {/* Clickable DEF */}
            {card.def !== undefined ? (
              <button
                onClick={() => onExploreStat({ def: card.def })}
                disabled={isLoading}
                title={`Find random card with ${card.def} DEF`}
                className="group p-3 bg-gradient-to-r from-blue-950/40 to-slate-950/60 hover:from-blue-950/70 hover:to-amber-950/40 border border-blue-900/40 hover:border-blue-500/60 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 group-hover:text-blue-300 border border-blue-800/40">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold tracking-wider text-blue-400/90">DEF</div>
                    <div className="text-xl font-extrabold text-white font-mono tabular-nums">
                      {card.def < 0 ? '?' : card.def}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-400/80 group-hover:text-amber-300 group-hover:underline">
                  Roll DEF ↺
                </span>
              </button>
            ) : isLink ? (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-blue-400">Link Markers</div>
                  <div className="text-xs text-slate-300 font-mono mt-1">
                    {card.linkmarkers?.join(', ') || 'N/A'}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* CARD TEXT / EFFECT BOX */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <span>
              {isMonster
                ? `[ ${card.race || 'Card'} / ${safeType.replace(' Monster', '')} ]`
                : `[ ${typeStr.includes('trap') ? 'Trap Card' : 'Spell Card'} / ${card.race === 'Quick-Play' ? 'Quick' : (card.race || 'Normal')} ]`}
            </span>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl font-sans text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line shadow-inner max-h-72 overflow-y-auto">
            {card.desc}
          </div>
        </div>

        {/* METADATA & BANLIST ROW */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Passcode:</span>
            <span className="font-mono text-slate-300 font-semibold">{card.id}</span>
          </div>

          {/* Banlist information */}
          <div className="flex items-center gap-3">
            {card.banlist_info?.ban_tcg && (
              <div className="flex items-center gap-1">
                <span>TCG:</span>
                <span className={`font-semibold ${
                  card.banlist_info.ban_tcg === 'Forbidden'
                    ? 'text-red-400'
                    : card.banlist_info.ban_tcg === 'Limited'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}>
                  {card.banlist_info.ban_tcg}
                </span>
              </div>
            )}
            {card.banlist_info?.ban_ocg && (
              <div className="flex items-center gap-1">
                <span>OCG:</span>
                <span className={`font-semibold ${
                  card.banlist_info.ban_ocg === 'Forbidden'
                    ? 'text-red-400'
                    : card.banlist_info.ban_ocg === 'Limited'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}>
                  {card.banlist_info.ban_ocg}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Sets */}
          {card.card_sets && card.card_sets.length > 0 && (
            <button
              onClick={() => setShowSets(!showSets)}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              {showSets ? 'Hide Card Sets' : `View ${card.card_sets.length} Card Sets`}
            </button>
          )}
        </div>

        {/* Expandable Card Sets List */}
        {showSets && card.card_sets && card.card_sets.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {card.card_sets.slice(0, 8).map((set, idx) => (
              <div key={idx} className="p-2 bg-slate-950/60 rounded border border-slate-800/60 flex items-center justify-between">
                <span className="text-slate-300 truncate mr-2">{set.set_name}</span>
                <span className="font-mono text-amber-400 shrink-0">{set.set_code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
