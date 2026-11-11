import {
  Eye,
  FileCheck2,
  Loader2,
  Package,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaStreamUrl } from "@/lib/mock/api";
import type { Mask } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/kit";

interface ArtisanCollectionProps {
  artisanSlug?: string;
  artisanName?: string;
  onAddNew: () => void;
}

export function ArtisanCollection({
  artisanSlug = "chandana-bandara",
  artisanName = "Chandana Bandara",
  onAddNew,
}: ArtisanCollectionProps) {
  const [masks, setMasks] = useState<Mask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const toast = useApp((s) => s.toast);
  const currency = useApp((s) => s.currency);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const [list, dashData] = await Promise.all([
        api.masksByArtisan(artisanSlug).catch(() => []),
        api.getPortalDashboard(artisanSlug).catch(() => null),
      ]);

      const portalListings = (dashData as any)?.listings || [];
      const portalMasks: Mask[] = portalListings.map((l: any) => ({
        slug: l.maskSlug || l.id,
        name: l.name,
        sinhala: l.sinhala || l.name,
        tradition: l.tradition || "raksha",
        artisanSlug: l.artisanSlug || artisanSlug,
        priceLKR: l.priceLKR || 85000,
        priceUSD: Math.round((l.priceLKR || 85000) * 0.0033),
        year: 2026,
        heightCm: 44,
        widthCm: 36,
        depthCm: 18,
        weightKg: 1.4,
        sizeCategory: "medium" as const,
        wood: l.woodSpecies || "Kaduru",
        dyes: ["Natural Pigments"],
        carvingDays: 24,
        image: l.photos?.[0]
          ? l.photos[0].startsWith("http") || l.photos[0].startsWith("/")
            ? l.photos[0]
            : mediaStreamUrl(l.photos[0])
          : "/images/masks/default.jpg",
        plateSeed: 1,
        plateVariant: 0,
        story: "Traditional mask",
        context: "Ambalangoda lineage",
        arAvailable: !!l.scanUrl,
        verified: !!l.certificateId,
        stock: l.stock ?? 1,
        region: "Ambalangoda",
        certId: l.certificateId || "",
      }));

      const combined = [...list];
      portalMasks.forEach((pm) => {
        if (!combined.some((m) => m.slug === pm.slug)) {
          combined.push(pm);
        }
      });

      setMasks(combined);
    } catch {
      toast("Failed to load collection", { kind: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [artisanSlug]);

  const toggleStock = async (mask: Mask) => {
    const newStock = (mask.stock ?? 0) > 0 ? 0 : 1;
    setUpdatingSlug(mask.slug);
    try {
      const ok = await api.updateMaskStock(mask.slug, newStock);
      if (ok) {
        setMasks((prev) =>
          prev.map((m) => (m.slug === mask.slug ? { ...m, stock: newStock } : m))
        );
        toast(`Stock updated for ${mask.name}`, {
          description: newStock > 0 ? "Marked as In Stock (1 unit)" : "Marked as Made to Order",
          kind: "success",
        });
      }
    } catch {
      toast("Could not update stock", { kind: "error" });
    } finally {
      setUpdatingSlug(null);
    }
  };

  const totalMasks = masks.length;
  const inStockCount = masks.filter((m) => (m.stock ?? 0) > 0).length;
  const totalValueLKR = masks.reduce((sum, m) => sum + (m.priceLKR || 0), 0);

  return (
    <div className="mt-8 space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="edge rounded-lg bg-s1 p-5">
          <span className="text-xs text-ink3">Collection Size</span>
          <p className="mt-1 font-display text-2xl text-ink">{totalMasks} Masks</p>
          <span className="mt-1 block text-[11px] text-ink3">Carved by {artisanName}</span>
        </div>
        <div className="edge rounded-lg bg-s1 p-5">
          <span className="text-xs text-ink3">Marketplace Availability</span>
          <p className="mt-1 font-display text-2xl text-emerald-400">
            {inStockCount} In Stock
          </p>
          <span className="mt-1 block text-[11px] text-ink3">
            {totalMasks - inStockCount} Available on Order
          </span>
        </div>
        <div className="edge rounded-lg bg-s1 p-5">
          <span className="text-xs text-ink3">Catalogue Retail Value</span>
          <p className="mt-1 font-display text-2xl text-gold">{formatMoney(totalValueLKR, currency)}</p>
          <span className="mt-1 block text-[11px] text-ink3">61% payable upon customer purchase</span>
        </div>
      </div>

      {/* Header with CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-ink">My Workshop Collection</h2>
          <p className="text-xs text-ink3">
            Manage your registered masks, update inventory availability, and preview 3D studies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCollection}
            className="inline-flex size-9 items-center justify-center rounded-md border border-line bg-s1 text-ink2 transition-colors hover:text-ink"
            aria-label="Refresh collection"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin text-gold")} />
          </button>
          <Button variant="primary" onClick={onAddNew}>
            <Plus className="size-4" />
            Post New Mask
          </Button>
        </div>
      </div>

      {/* Mask Cards Grid */}
      {loading ? (
        <div className="grid place-items-center rounded-lg border border-line bg-s1 py-16">
          <Loader2 className="size-6 animate-spin text-gold" />
          <p className="mt-3 text-xs text-ink3">Loading workshop collection...</p>
        </div>
      ) : masks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-s1 p-12 text-center">
          <Package className="mx-auto size-8 text-ink3" />
          <h3 className="mt-3 font-display text-base text-ink">No masks listed yet</h3>
          <p className="mt-1 text-xs text-ink3">
            Begin by publishing your first hand-carved mask to the public registry.
          </p>
          <div className="mt-4">
            <Button variant="primary" onClick={onAddNew}>
              <Plus className="size-4" />
              Post Your First Mask
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {masks.map((mask) => {
            const hasStock = (mask.stock ?? 0) > 0;
            return (
              <div
                key={mask.slug}
                className="edge flex flex-col justify-between overflow-hidden rounded-lg bg-s1 transition-all hover:border-gold/30"
              >
                <div>
                  {/* Image header with tradition pill */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-s3">
                    <img
                      src={mask.image}
                      alt={mask.name}
                      className="size-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                      <span className="rounded bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
                        {mask.tradition}
                      </span>
                      {mask.arAvailable && (
                        <span className="rounded bg-gold/90 px-1.5 py-0.5 text-[9px] font-bold text-black backdrop-blur-sm">
                          3D · AR
                        </span>
                      )}
                    </div>
                    {mask.certId && (
                      <span className="absolute bottom-2 left-2.5 font-mono text-[10px] text-white/80 drop-shadow-sm">
                        {mask.certId}
                      </span>
                    )}
                  </div>

                  {/* Mask Info */}
                  <div className="p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate font-display text-base text-ink">{mask.name}</h3>
                      {mask.sinhala && (
                        <span className="font-sinhala text-xs text-ink3">{mask.sinhala}</span>
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink3">
                      {mask.story || mask.context || "Hand-carved from seasoned Kaduru timber."}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
                      <div>
                        <span className="block font-mono text-sm font-bold text-gold">
                          {formatMoney(mask.priceLKR, currency)}
                        </span>
                        <span className="text-[10px] text-ink3">≈ ${(mask.priceLKR / 303).toFixed(0)} USD</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] text-ink3">
                          {mask.heightCm} × {mask.widthCm} cm
                        </span>
                        <span className="text-[10px] text-ink3">{mask.carvingDays || 20} carving days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-line bg-s2/60 px-4 py-2.5 text-xs">
                  <button
                    type="button"
                    disabled={updatingSlug === mask.slug}
                    onClick={() => toggleStock(mask)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors",
                      hasStock
                        ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-s3 text-ink3 hover:text-ink"
                    )}
                  >
                    {updatingSlug === mask.slug ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <span className={cn("size-2 rounded-full", hasStock ? "bg-emerald-400" : "bg-ink3")} />
                    )}
                    {hasStock ? "In Stock (1)" : "Made to Order"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {mask.certId && (
                      <Link
                        to={`/verify/${mask.certId}`}
                        title="View Provenance Certificate"
                        className="rounded p-1 text-ink3 hover:bg-s3 hover:text-gold"
                      >
                        <FileCheck2 className="size-4" />
                      </Link>
                    )}
                    <Link
                      to={`/masks/${mask.slug}`}
                      title="View Public Marketplace Page"
                      className="rounded p-1 text-ink3 hover:bg-s3 hover:text-ink"
                    >
                      <Eye className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
