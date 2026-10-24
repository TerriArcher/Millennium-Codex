export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_price?: string;
}

export interface CardPrice {
  cardmarket_price?: string;
  tcgplayer_price?: string;
  ebay_price?: string;
  amazon_price?: string;
  coolstuffinc_price?: string;
}

export interface BanlistInfo {
  ban_tcg?: string;
  ban_ocg?: string;
  ban_goat?: string;
}

export interface YugiohCard {
  id: number;
  name: string;
  type: string; // e.g. "Effect Monster", "Normal Monster", "Spell Card", "Trap Card", "Link Monster", "XYZ Monster", etc.
  humanReadableCardType?: string;
  frameType?: string; // "effect", "normal", "spell", "trap", "fusion", "synchro", "xyz", "link", "ritual"
  desc: string;
  race: string; // e.g. "Dragon", "Spellcaster", "Continuous", "Quick-Play"
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string; // "DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE"
  archetype?: string;
  scale?: number; // Pendulum scale (e.g. 1, 8)
  linkval?: number; // Link rating
  linkmarkers?: string[]; // Link markers e.g. ["Top", "Bottom-Right"]
  card_images: CardImage[];
  card_sets?: CardSet[];
  card_prices?: CardPrice[];
  banlist_info?: BanlistInfo;
  ygoprodeck_url?: string;
}

export interface CardFilterState {
  type?: string;
  superType?: string; // "Link", "XYZ", "Synchro", "Ritual", "Spirit", "Pendulum", "Fusion"
  attribute?: string;
  level?: string | number;
  race?: string;
  atk?: string | number;
  def?: string | number;
  scale?: string | number;
  archetype?: string;
  keyword?: string;
  excludeId?: number;
}

export interface MetaResource {
  id: string;
  title: string;
  url: string;
  category: 'meta' | 'database' | 'simulator' | 'news';
  categoryLabel: string;
  description: string;
  highlights: string[];
  recommendedFor: string;
  badge?: string;
}
