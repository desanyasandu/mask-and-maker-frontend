/**
 * Live API Service Layer — connects frontend directly to Mask & Maker microservices via API Gateway.
 * All mock/dummy fallback data has been removed.
 *
 *   GET  /api/masks?tradition=&artisan=&q=      → api.listMasks
 *   GET  /api/masks/:slug                        → api.getMask
 *   GET  /api/masks/featured                     → api.featuredMasks
 *   GET  /api/masks/:slug/related                → api.relatedMasks
 *   GET  /api/masks/artisan/:slug                → api.masksByArtisan
 *   GET  /api/artisans                           → api.listArtisans
 *   GET  /api/artisans/:slug                     → api.getArtisan
 *   GET  /api/traditions                         → api.listTraditions
 *   GET  /api/traditions/:slug                   → api.getTradition
 *   GET  /api/articles                           → api.listArticles
 *   GET  /api/articles/:slug                     → api.getArticle
 *   GET  /api/stages                             → api.listStages
 *   GET  /api/workshops                          → api.listWorkshops
 *   POST /api/workshops/:id/book                 → api.bookWorkshop
 *   GET  /api/verify                             → api.listCertificates
 *   GET  /api/verify/:certId                     → api.verifyCertificate
 *   POST /api/verify/:certId/claim               → api.claimCertificate
 *   POST /api/verify/:certId/report              → api.reportCertificate
 *   GET  /api/verify/mask/:maskSlug              → api.certificateForMask
 *   GET  /api/orders                             → api.listOrders
 *   POST /api/orders                             → api.createOrder
 *   GET  /api/search?q=                          → api.search
 *   GET  /api/portal/dashboard                   → api.getPortalDashboard
 *   POST /api/portal/listing/mint                → api.mintCertificate
 *   POST /api/portal/listing/:id/publish         → api.publishListing
 *   POST /api/portal/onboarding                  → api.saveOnboarding
 */
import type {
  Article,
  Artisan,
  Certificate,
  CraftStage,
  Mask,
  Order,
  PortalDashboardData,
  SearchHit,
  Tradition,
  TraditionDoc,
  VerifyRegistryStats,
  Workshop,
} from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const liveMaskCache = new Map<string, Mask>();

function recordMasks(list: Mask | Mask[] | undefined | null) {
  if (!list) return;
  const arr = Array.isArray(list) ? list : [list];
  for (const m of arr) {
    if (m && typeof m.slug === "string") {
      liveMaskCache.set(m.slug, m);
    }
  }
}

export function getCachedMask(slug: string): Mask | undefined {
  return liveMaskCache.get(slug);
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("mm_jwt_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  return (await res.json()) as T;
}

function normalizeCert(
  raw: Record<string, unknown> | null | undefined,
  verificationStatus?: Certificate["verificationStatus"]
): Certificate | null {
  if (!raw) return null;
  return {
    id: String(raw.id || raw.certId || ""),
    maskSlug: String(raw.maskSlug || ""),
    artisanSlug: String(raw.artisanSlug || ""),
    mintedAt: String(raw.mintedAt || ""),
    status: raw.status === "claimed" ? "claimed" : "unclaimed",
    chain: "Polygon",
    contractAddress: typeof raw.contractAddress === "string" ? raw.contractAddress : undefined,
    tokenId: String(raw.tokenId || ""),
    ipfs: String(raw.ipfs || raw.ipfsUri || raw.ipfsHash || ""),
    owner: typeof raw.owner === "string" ? raw.owner : null,
    ownerWallet: typeof raw.ownerWallet === "string" ? raw.ownerWallet : null,
    artisanSignature: typeof raw.artisanSignature === "string" ? raw.artisanSignature : undefined,
    hashProof: typeof raw.hashProof === "string" ? raw.hashProof : undefined,
    isTampered: Boolean(raw.isTampered),
    nfcTag: raw.nfcTag ? (raw.nfcTag as Certificate["nfcTag"]) : undefined,
    verificationStatus:
      verificationStatus ||
      (raw.verificationStatus ? (raw.verificationStatus as Certificate["verificationStatus"]) : undefined),
    history: Array.isArray(raw.history) ? (raw.history as Certificate["history"]) : [],
  };
}

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

function applyMaskFilters(list: Mask[], query: MaskQuery = {}): Mask[] {
  let out = [...list];
  if (query.tradition && query.tradition !== "all") out = out.filter((m) => m.tradition === query.tradition);
  if (query.artisan && query.artisan !== "all") out = out.filter((m) => m.artisanSlug === query.artisan);
  if (query.arOnly) out = out.filter((m) => m.arAvailable);
  if (query.verifiedOnly) out = out.filter((m) => m.verified);
  if (typeof query.maxPriceLKR === "number") out = out.filter((m) => m.priceLKR <= query.maxPriceLKR!);
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
    case "price-asc":
      out.sort((a, b) => a.priceLKR - b.priceLKR);
      break;
    case "price-desc":
      out.sort((a, b) => b.priceLKR - a.priceLKR);
      break;
    case "newest":
      out.sort((a, b) => b.year - a.year);
      break;
    default:
      out.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || b.priceLKR - a.priceLKR);
  }
  return out;
}

export const api = {
  async listMasks(query: MaskQuery = {}): Promise<Mask[]> {
    const params = new URLSearchParams();
    if (query.tradition && query.tradition !== "all") params.set("tradition", query.tradition);
    if (query.artisan && query.artisan !== "all") params.set("artisan", query.artisan);
    if (query.q) params.set("q", query.q);
    if (query.sort) params.set("sort", query.sort);
    if (query.maxPriceLKR) params.set("maxPrice", query.maxPriceLKR.toString());
    if (query.arOnly) params.set("arOnly", "true");
    if (query.verifiedOnly) params.set("verifiedOnly", "true");
    if (query.sizes?.length === 1) params.set("size", query.sizes[0]);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const data = await requestJson<Mask[]>(`/api/masks${qs}`);
    const list = Array.isArray(data) ? data : [];
    recordMasks(list);
    return applyMaskFilters(list, query);
  },

  async getMask(slug: string): Promise<Mask | undefined> {
    try {
      const m = await requestJson<Mask>(`/api/masks/${encodeURIComponent(slug)}`);
      recordMasks(m);
      return m;
    } catch {
      return undefined;
    }
  },

  async relatedMasks(slug: string, _tradition?: Tradition): Promise<Mask[]> {
    try {
      const data = await requestJson<Mask[]>(`/api/masks/${encodeURIComponent(slug)}/related`);
      const list = Array.isArray(data) ? data : [];
      recordMasks(list);
      return list;
    } catch {
      return [];
    }
  },

  async featuredMasks(): Promise<Mask[]> {
    const data = await requestJson<Mask[]>("/api/masks/featured");
    const list = Array.isArray(data) ? data : [];
    recordMasks(list);
    return list;
  },

  async listArtisans(): Promise<Artisan[]> {
    const data = await requestJson<Artisan[]>("/api/artisans");
    return Array.isArray(data) ? data : [];
  },

  async getArtisan(slug: string): Promise<Artisan | undefined> {
    try {
      return await requestJson<Artisan>(`/api/artisans/${encodeURIComponent(slug)}`);
    } catch {
      return undefined;
    }
  },

  async masksByArtisan(slug: string): Promise<Mask[]> {
    const data = await requestJson<Mask[]>(`/api/masks/artisan/${encodeURIComponent(slug)}`);
    const list = Array.isArray(data) ? data : [];
    recordMasks(list);
    return list;
  },

  async listTraditions(): Promise<TraditionDoc[]> {
    const data = await requestJson<TraditionDoc[]>("/api/traditions");
    return Array.isArray(data) ? data : [];
  },

  async getTradition(slug: string): Promise<TraditionDoc | undefined> {
    try {
      return await requestJson<TraditionDoc>(`/api/traditions/${encodeURIComponent(slug)}`);
    } catch {
      return undefined;
    }
  },

  async listArticles(kind?: Article["kind"]): Promise<Article[]> {
    const qs = kind ? `?kind=${encodeURIComponent(kind)}` : "";
    const data = await requestJson<Article[]>(`/api/articles${qs}`);
    const list = Array.isArray(data) ? data : [];
    return kind ? list.filter((a) => a.kind === kind) : list;
  },

  async getArticle(slug: string): Promise<Article | undefined> {
    try {
      return await requestJson<Article>(`/api/articles/${encodeURIComponent(slug)}`);
    } catch {
      return undefined;
    }
  },

  async listStages(): Promise<CraftStage[]> {
    const data = await requestJson<{ stages?: CraftStage[] } | CraftStage[]>("/api/stages");
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.stages) ? data.stages : [];
  },

  async listWorkshops(): Promise<Workshop[]> {
    const data = await requestJson<{ workshops?: Workshop[] } | Workshop[]>("/api/workshops");
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.workshops) ? data.workshops : [];
  },

  async bookWorkshop(id: string): Promise<Workshop | null> {
    try {
      const data = await requestJson<{ workshop?: Workshop } & Workshop>(`/api/workshops/${encodeURIComponent(id)}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return data?.workshop ?? data;
    } catch {
      return null;
    }
  },

  async listCertificates(): Promise<Certificate[]> {
    const data = await requestJson<{ certificates?: { cert?: Record<string, unknown> }[] } | Record<string, unknown>[]>(
      "/api/verify"
    );
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.certificates)
        ? data.certificates.map((item) => item.cert ?? (item as unknown as Record<string, unknown>))
        : [];
    return rawList.map((c) => normalizeCert(c)).filter((c): c is Certificate => c !== null);
  },

  async verifyCertificate(certId: string): Promise<{ cert: Certificate | null; found: boolean }> {
    try {
      const data = await requestJson<{
        found?: boolean;
        cert?: Record<string, unknown> | null;
        verificationStatus?: Certificate["verificationStatus"];
      }>(`/api/verify/${encodeURIComponent(certId.trim())}`);
      const cert = normalizeCert(data?.cert, data?.verificationStatus);
      return { cert, found: Boolean(data?.found && cert) };
    } catch {
      return { cert: null, found: false };
    }
  },

  async getVerifyStats(): Promise<VerifyRegistryStats | null> {
    try {
      return await requestJson<VerifyRegistryStats>("/api/verify/stats");
    } catch {
      return null;
    }
  },

  async authenticateNfc(
    tagId: string
  ): Promise<{ authenticated: boolean; uid: string; tapCount: number; cert: Certificate | null } | null> {
    try {
      const data = await requestJson<{
        authenticated: boolean;
        uid: string;
        tapCount: number;
        verification?: {
          cert?: Record<string, unknown>;
          verificationStatus?: Certificate["verificationStatus"];
        };
      }>("/api/verify/nfc/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, readerType: "WEBNFC_SIMULATOR" }),
      });
      return {
        authenticated: data.authenticated,
        uid: data.uid,
        tapCount: data.tapCount,
        cert: normalizeCert(data.verification?.cert, data.verification?.verificationStatus),
      };
    } catch {
      return null;
    }
  },

  async claimCertificate(certId: string, ownerName: string, ownerWallet?: string): Promise<Certificate | null> {
    const data = await requestJson<{ cert?: Record<string, unknown> } & Record<string, unknown>>(
      `/api/verify/${encodeURIComponent(certId.trim())}/claim`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName, ownerWallet: ownerWallet || undefined }),
      }
    );
    return normalizeCert((data?.cert as Record<string, unknown>) ?? data);
  },

  async reportCertificate(certId: string, reason: string, reporterContact?: string): Promise<boolean> {
    try {
      await requestJson(`/api/verify/${encodeURIComponent(certId.trim())}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, reporterContact }),
      });
      return true;
    } catch {
      return false;
    }
  },

  async certificateForMask(maskSlug: string): Promise<Certificate | null> {
    try {
      const data = await requestJson<{
        cert?: Record<string, unknown>;
        verificationStatus?: Certificate["verificationStatus"];
      } & Record<string, unknown>>(`/api/verify/mask/${encodeURIComponent(maskSlug)}`);
      return normalizeCert((data?.cert as Record<string, unknown>) ?? data, data?.verificationStatus);
    } catch {
      return null;
    }
  },

  async listOrders(): Promise<Order[]> {
    const data = await requestJson<{ orders?: Order[] } | Order[]>("/api/orders");
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.orders) ? data.orders : [];
  },

  async createOrder(payload: {
    items: { slug: string; name?: string; qty: number; priceLKR: number; weightKg?: number }[];
    shippingAddress: {
      name?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      line1?: string;
      city: string;
      postal?: string;
      country?: string;
    };
    carrier?: string;
    shippingCostLKR?: number;
    paymentMethod?: "card" | "crypto" | "cod" | "demo";
  }): Promise<Order> {
    return requestJson<Order>("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async search(q: string): Promise<SearchHit[]> {
    const query = q.trim();
    if (!query) return [];
    const data = await requestJson<{ hits?: SearchHit[] } | SearchHit[]>(
      `/api/search?q=${encodeURIComponent(query)}`
    );
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.hits) ? data.hits : [];
  },

  async getPortalDashboard(artisanSlug = "chandana-bandara"): Promise<PortalDashboardData> {
    return requestJson<PortalDashboardData>(
      `/api/portal/dashboard?artisanSlug=${encodeURIComponent(artisanSlug)}`
    );
  },

  async mintCertificate(payload: {
    artisanSlug?: string;
    maskTitle?: string;
    tradition?: Tradition;
    woodSpecies?: string;
    priceLKR?: number;
    photos?: string[];
    scanUrl?: string;
  }): Promise<{ certificateId: string; listingId?: string }> {
    const data = await requestJson<{
      certificateId?: string;
      listing?: { id?: string; certificateId?: string };
    }>("/api/portal/listing/mint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return {
      certificateId: data.certificateId || data.listing?.certificateId || "",
      listingId: data.listing?.id,
    };
  },

  async publishListing(listingId: string): Promise<boolean> {
    try {
      await requestJson(`/api/portal/listing/${encodeURIComponent(listingId)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return true;
    } catch {
      return false;
    }
  },

  async saveOnboarding(payload: {
    artisanSlug: string;
    language: "en" | "si" | "ta";
    village: string;
    tradition: Tradition;
    firstPhotoUrl?: string;
  }): Promise<boolean> {
    try {
      await requestJson("/api/portal/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return true;
    } catch {
      return false;
    }
  },

  async generate3DModel(
    imageFile: Blob | File,
    maskSlug: string,
    artisanSlug = "chandana-bandara"
  ): Promise<{ src: string; key: string }> {
    const form = new FormData();
    form.append("maskSlug", maskSlug);
    form.append("artisanSlug", artisanSlug);
    form.append("mc_resolution", "128");
    form.append("image", imageFile, imageFile instanceof File ? imageFile.name : `${maskSlug}.jpg`);

    const res = await fetch(`${API_BASE}/api/media/generate-3d`, {
      method: "POST",
      headers: {
        ...authHeaders(),
      },
      body: form,
    });
    if (!res.ok) {
      throw new Error(`3D generation failed: ${res.status}`);
    }
    const data = (await res.json()) as {
      asset?: { key?: string; publicUrl?: string };
      modelViewerProps?: { src?: string };
    };
    const key = data.asset?.key || `models/${maskSlug}.glb`;
    return {
      key,
      src: `/api/media/stream/${key}?t=${Date.now()}`,
    };
  },
};
