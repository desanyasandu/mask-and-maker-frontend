export type Tradition = "raksha" | "sanni" | "kolam";
export type Currency = "LKR" | "USD";
export type MaskSize = "compact" | "display" | "monumental";

export interface Mask {
  slug: string;
  name: string;
  sinhala: string;
  tradition: Tradition;
  artisanSlug: string;
  priceLKR: number;
  year: number;
  heightCm: number;
  widthCm: number;
  depthCm: number;
  weightKg: number;
  wood: string;
  dyes: string[];
  carvingDays: number;
  /** Studio photograph; absent masks fall back to the archive-plate system. */
  image?: string;
  plateSeed: number;
  plateVariant: number;
  story: string;
  context: string;
  arAvailable: boolean;
  verified: boolean;
  stock: number;
  featured?: boolean;
  region: string;
  certId: string;
}

export interface ArtisanGeneration {
  name: string;
  years: string;
  note: string;
}

export interface Artisan {
  slug: string;
  name: string;
  sinhalaName: string;
  role: string;
  region: string;
  village: string;
  born: number;
  since: number;
  ordersFulfilled: number;
  rating: number;
  verified: boolean;
  photo?: string;
  initials: string;
  bio: string;
  story: string;
  tools: string[];
  styleNotes: string[];
  generations: ArtisanGeneration[];
  focusTraditions: Tradition[];
}

export interface TraditionDoc {
  slug: Tradition;
  name: string;
  sinhala: string;
  marker: "vermilion" | "forest" | "gold";
  tagline: string;
  description: string;
  ritual: string[];
  examples: string[];
  palette: string[];
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  tradition?: Tradition;
  kind: "essay" | "film" | "field-notes";
  readMinutes: number;
  date: string;
  image?: string;
  body: string[];
}

export interface CertificateEvent {
  label: string;
  date: string;
  actor: string;
}

export interface Certificate {
  id: string;
  maskSlug: string;
  artisanSlug: string;
  mintedAt: string;
  status: "unclaimed" | "claimed";
  chain: "Polygon";
  tokenId: string;
  ipfs: string;
  owner: string | null;
  history: CertificateEvent[];
}

export interface OrderItem {
  slug: string;
  qty: number;
  priceLKR: number;
}

export interface OrderEvent {
  label: string;
  date: string;
  done: boolean;
}

export interface Order {
  id: string;
  placedAt: string;
  status: "preparing" | "in-transit" | "delivered";
  items: OrderItem[];
  totalLKR: number;
  events: OrderEvent[];
}

export interface CraftStage {
  n: number;
  title: string;
  sinhala: string;
  body: string;
  detail: string;
}

export interface Workshop {
  title: string;
  date: string;
  place: string;
  priceLKR: number;
  spotsLeft: number;
}

export interface SearchHit {
  kind: "mask" | "artisan" | "article" | "page";
  title: string;
  subtitle: string;
  href: string;
  tradition?: Tradition;
}
