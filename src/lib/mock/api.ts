/**
 * Mock service layer — mirrors the future REST API.
 * Every function simulates network latency (300–800 ms) and returns typed data.
 * Swapping to a live backend later means replacing the bodies here, nothing else.
 *
 *   GET  /api/masks?tradition=&artisan=&q=      → api.listMasks
 *   GET  /api/masks/:slug                        → api.getMask
 *   GET  /api/artisans /:slug                    → api.listArtisans / getArtisan
 *   GET  /api/articles /:slug                    → api.listArticles / getArticle
 *   GET  /api/traditions                         → api.listTraditions
 *   GET  /api/verify/:certId                     → api.verifyCertificate
 *   GET  /api/orders                             → api.listOrders
 *   GET  /api/search?q=                          → api.search
 */
import type { Article, Artisan, Certificate, Mask, Order, SearchHit, Tradition } from "../types";
import { articles, artisans, certificates, masks, orders, traditions } from "./data";

const wait = (min = 300, max = 800) =>
  new Promise<void>((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));

export interface MaskQuery {
  tradition?: Tradition | "all";
  artisan?: string;
  q?: string;
  arOnly?: boolean;
  verifiedOnly?: boolean;
  maxPriceLKR?: number;
  sizes?: string[];
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
}

export function sizeOf(mask: Mask): "compact" | "display" | "monumental" {
  if (mask.heightCm < 30) return "compact";
  if (mask.heightCm < 48) return "display";
  return "monumental";
}

export const api = {
  async listMasks(query: MaskQuery = {}): Promise<Mask[]> {
    await wait();
    let out = [...masks];
    if (query.tradition && query.tradition !== "all") out = out.filter((m) => m.tradition === query.tradition);
    if (query.artisan && query.artisan !== "all") out = out.filter((m) => m.artisanSlug === query.artisan);
    if (query.arOnly) out = out.filter((m) => m.arAvailable);
    if (query.verifiedOnly) out = out.filter((m) => m.verified);
    const maxPrice = query.maxPriceLKR;
    if (typeof maxPrice === "number") out = out.filter((m) => m.priceLKR <= maxPrice);
    if (query.sizes && query.sizes.length) out = out.filter((m) => query.sizes!.includes(sizeOf(m)));
    if (query.q) {
      const q = query.q.toLowerCase();
      out = out.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.sinhala.includes(query.q!) ||
          m.story.toLowerCase().includes(q) ||
          m.region.toLowerCase().includes(q)
      );
    }
    switch (query.sort ?? "featured") {
      case "price-asc": out.sort((a, b) => a.priceLKR - b.priceLKR); break;
      case "price-desc": out.sort((a, b) => b.priceLKR - a.priceLKR); break;
      case "newest": out.sort((a, b) => b.year - a.year); break;
      default:
        out.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || b.priceLKR - a.priceLKR);
    }
    return out;
  },

  async getMask(slug: string): Promise<Mask | undefined> {
    await wait(250, 500);
    return masks.find((m) => m.slug === slug);
  },

  async relatedMasks(slug: string, tradition: Tradition): Promise<Mask[]> {
    await wait(200, 400);
    return masks.filter((m) => m.tradition === tradition && m.slug !== slug).slice(0, 3);
  },

  async featuredMasks(): Promise<Mask[]> {
    await wait(250, 500);
    return masks.filter((m) => m.featured);
  },

  async listArtisans(): Promise<Artisan[]> {
    await wait();
    return artisans;
  },

  async getArtisan(slug: string): Promise<Artisan | undefined> {
    await wait(250, 500);
    return artisans.find((a) => a.slug === slug);
  },

  async masksByArtisan(slug: string): Promise<Mask[]> {
    await wait(200, 400);
    return masks.filter((m) => m.artisanSlug === slug);
  },

  async listTraditions() {
    await wait(250, 500);
    return traditions;
  },

  async listArticles(kind?: Article["kind"]): Promise<Article[]> {
    await wait(250, 550);
    return kind ? articles.filter((a) => a.kind === kind) : articles;
  },

  async getArticle(slug: string): Promise<Article | undefined> {
    await wait(250, 500);
    return articles.find((a) => a.slug === slug);
  },

  async verifyCertificate(certId: string): Promise<{ cert: Certificate | null; found: boolean }> {
    await wait(900, 1600);
    const cert = certificates.find((c) => c.id.toLowerCase() === certId.trim().toLowerCase()) ?? null;
    return { cert, found: cert !== null };
  },

  async certificateForMask(maskSlug: string): Promise<Certificate | null> {
    await wait(200, 400);
    return certificates.find((c) => c.maskSlug === maskSlug) ?? null;
  },

  async listOrders(): Promise<Order[]> {
    await wait();
    return orders;
  },

  async search(q: string): Promise<SearchHit[]> {
    await wait(120, 300);
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const hits: SearchHit[] = [];
    for (const m of masks) {
      if (m.name.toLowerCase().includes(query) || m.tradition.includes(query) || m.region.toLowerCase().includes(query)) {
        const artisan = artisans.find((a) => a.slug === m.artisanSlug);
        hits.push({ kind: "mask", title: m.name, subtitle: `${m.tradition[0].toUpperCase()}${m.tradition.slice(1)} · ${artisan?.name ?? "Ambalangoda"}`, href: `/masks/${m.slug}`, tradition: m.tradition });
      }
    }
    for (const a of artisans) {
      if (a.name.toLowerCase().includes(query) || a.region.toLowerCase().includes(query)) {
        hits.push({ kind: "artisan", title: a.name, subtitle: `${a.role} · ${a.region}`, href: `/artisans/${a.slug}` });
      }
    }
    for (const a of articles) {
      if (a.title.toLowerCase().includes(query)) {
        hits.push({ kind: "article", title: a.title, subtitle: `${a.kind === "film" ? "Film" : "Essay"} · ${a.readMinutes} min read`, href: `/heritage?article=${a.slug}` });
      }
    }
    return hits.slice(0, 8);
  },
};
