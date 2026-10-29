import { ArrowLeft, BadgeCheck, ChevronDown, Copy, FileCheck2, Heart, Package, ShoppingBag, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import type { Artisan, Mask } from "@/lib/types";
import { formatDate, formatMoney, hashString } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { MaskCard, TraditionTag } from "@/components/MaskCard";
import { ARLauncher, ModelViewerPanel } from "@/components/ui/ARLauncher";
import { ArchivePlate, MaskArtwork } from "@/components/ui/MaskImage";
import { AnimatedTabs, BorderBeam, VerifiedSeal } from "@/components/ui/surfaces";
import { Button, EmptyState, Skeleton } from "@/components/ui/kit";
import { ProvenanceTimeline, type ProvStep } from "@/components/ui/ProvenanceTimeline";
import { Drama } from "lucide-react";

/* Mock carrier quotes derived from weight. */
function shipRows(country: string, weightKg: number): { carrier: string; eta: string; priceLKR: number }[] {
  if (country === "Sri Lanka") return [{ carrier: "Island courier, signed for", eta: "2–3 days", priceLKR: 2800 }];
  return [
    { carrier: "DHL Express", eta: "5–8 days", priceLKR: Math.round(14500 + weightKg * 4200) },
    { carrier: "FedEx International Priority", eta: "4–7 days", priceLKR: Math.round(13200 + weightKg * 3900) },
  ];
}

const includes = [
  "Minted provenance certificate (Polygon registry)",
  "NFC chip + printed QR tag, set into the reverse",
  "Signed maker's card, Sinhala & English",
  "Care guide for natural pigments",
  "Custom crate, export papers, transit insurance",
];

export default function MaskDetail() {
  const { slug = "" } = useParams();
  const [mask, setMask] = useState<Mask | null>(null);
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [related, setRelated] = useState<Mask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("photographs");
  const [country, setCountry] = useState("Sri Lanka");

  const currency = useApp((s) => s.currency);
  const setCurrency = useApp((s) => s.setCurrency);
  const addToCart = useApp((s) => s.addToCart);
  const setCartOpen = useApp((s) => s.setCartOpen);
  const wishlisted = useApp((s) => s.wishlist.includes(slug));
  const toggleWishlist = useApp((s) => s.toggleWishlist);
  const toast = useApp((s) => s.toast);

  usePageMeta(mask ? mask.name : "Mask detail");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setTab("photographs");
    api.getMask(slug).then(async (m) => {
      if (!alive) return;
      setMask(m ?? null);
      if (m) {
        const [a, r] = await Promise.all([api.getArtisan(m.artisanSlug), api.relatedMasks(m.slug, m.tradition)]);
        if (alive) {
          setArtisan(a ?? null);
          setRelated(r);
        }
      }
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  const provenance = useMemo<ProvStep[]>(() => {
    if (!mask || !artisan) return [];
    const y = mask.year;
    return [
      { label: "Carved & awakened", date: formatDate(`${y}-02-14`), actor: `${artisan.name} · ${artisan.village}`, state: "done" },
      { label: "Photogrammetry & 3D scan", date: formatDate(`${y}-03-02`), actor: "M&M studio, Ambalangoda", state: "done" },
      { label: "Listed on the registry", date: formatDate(`${y}-03-11`), actor: "Heritage desk review", state: "done" },
      { label: "Certificate minted", date: formatDate(`${y}-03-12`), actor: "Polygon mainnet", state: "done" },
      { label: "NFC & QR tag attached", date: formatDate(`${y}-03-12`), actor: "Registry desk", state: "done" },
      { label: "Claimed by its keeper", state: "pending" },
    ];
  }, [mask, artisan]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <Skeleton className="h-4 w-40" />
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-[4/5]" />
          <div className="space-y-4">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!mask) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
        <EmptyState
          icon={Drama}
          title="That face isn't in the registry"
          body="The piece you're after has either found its keeper or never left the workshop. The shelf it came from is well worth a look."
        >
          <Link to="/masks" className="inline-flex h-10 items-center rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
            Back to the collection
          </Link>
        </EmptyState>
      </div>
    );
  }

  const quotes = shipRows(country, mask.weightKg);
  const techId = hashString(mask.slug).toString(16).slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: mask.name,
    description: mask.story,
    image: mask.image,
    brand: { "@type": "Brand", name: artisan?.name ?? "Mask & Maker" },
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: mask.priceLKR,
      availability: mask.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-4 sm:px-6">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <Link to="/masks" className="inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        The collection
      </Link>

      <div className="mt-5 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* -------------------------------- gallery */}
        <div>
          <AnimatedTabs
            id="gallery"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "photographs", label: "Studio photograph" },
              { id: "model", label: "3D study" },
              { id: "plate", label: "Archive plate" },
            ]}
            className="w-full justify-start"
          />
          <div className="mt-4">
            {tab === "photographs" && <MaskArtwork mask={mask} eager className="w-full" />}
            {tab === "model" && (
              <div>
                <ModelViewerPanel mask={mask} className="aspect-[4/5] w-full" />
                <p className="mt-3 text-xs leading-relaxed text-ink3">
                  Drag to turn the piece; pinch to examine the cut. On a phone, the cube icon places it on your wall at full size.
                </p>
              </div>
            )}
            {tab === "plate" && (
              <div className="edge rounded-lg bg-s2 p-1">
                <ArchivePlate seed={mask.plateSeed} variant={mask.plateVariant} tradition={mask.tradition} label={mask.name} className="aspect-[4/5] rounded-md" />
                <p className="px-3 py-3 text-xs leading-relaxed text-ink3">
                  Registry drawing № {String(mask.plateSeed * 137 + 109).padStart(5, "0")} — the line study taken before paint touched wood.
                </p>
              </div>
            )}
          </div>
          {tab === "photographs" && (
            <p className="mt-3 font-mono text-[11px] tracking-wide text-ink4 tnum">
              Studio photograph · {mask.region} · {mask.year}
            </p>
          )}

          {/* artisan card (desktop column) */}
          {artisan && (
            <Link
              to={`/artisans/${artisan.slug}`}
              className="edge group mt-8 flex items-center gap-4 rounded-lg bg-s1 p-4 transition-colors hover:bg-s2"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-line">
                {artisan.photo ? (
                  <img src={artisan.photo} alt={`Portrait of ${artisan.name}`} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-s3 font-display text-[15px] text-gold">{artisan.initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink group-hover:text-gold-strong">
                  {artisan.name}
                  {artisan.verified && <BadgeCheck className="size-3.5 text-gold" aria-label="Verified artisan" />}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink3">{artisan.role} · {artisan.village}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink3">
                  <Star className="size-3 fill-gold text-gold" aria-hidden="true" />
                  <span className="font-mono text-ink2 tnum">{artisan.rating}</span> · {artisan.ordersFulfilled} pieces fulfilled
                </p>
              </div>
              <span className="shrink-0 text-[13px] font-medium text-gold">Visit the workshop →</span>
            </Link>
          )}
        </div>

        {/* -------------------------------- info / buy column */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <TraditionTag tradition={mask.tradition} />
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink4">{mask.region} · {mask.year}</span>
          </div>
          <h1 className="mt-3 font-display text-[36px] leading-[1.05] tracking-[-0.01em] text-ink sm:text-[42px]">{mask.name}</h1>
          <p className="mt-1.5 font-sinhala text-[17px] text-ink2">{mask.sinhala}</p>

          <p className="mt-5 text-[15px] leading-relaxed text-ink2">{mask.story}</p>

          {/* price + buy */}
          <div className="edge relative mt-7 rounded-lg bg-s2 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink4">Workshop price</p>
                <p className="mt-1 font-mono text-[28px] leading-none text-ink tnum">{formatMoney(mask.priceLKR, currency)}</p>
                <p className="mt-1.5 text-xs text-ink3">
                  {mask.stock === 1 ? "One of one — when it's gone, it's gone" : `${mask.stock} pieces from this carving run`}
                </p>
              </div>
              <div className="flex rounded-lg border border-line bg-s1 p-0.5 font-mono text-[11px]" role="group" aria-label="Currency">
                {(["LKR", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    aria-pressed={currency === c}
                    className={cn("h-7 rounded-md px-2.5 transition-colors duration-180 tnum", currency === c ? "bg-s3 text-gold" : "text-ink3 hover:text-ink2")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
              <Button
                size="lg"
                onClick={() => {
                  addToCart(mask.slug);
                  toast("Added to your crate", { description: mask.name, kind: "success" });
                  setCartOpen(true);
                }}
                disabled={mask.stock === 0}
              >
                <ShoppingBag className="size-4" />
                Add to crate
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  toggleWishlist(mask.slug);
                  toast(wishlisted ? "Removed from wishlist" : "Kept in your wishlist", { description: mask.name });
                }}
                aria-pressed={wishlisted}
                aria-label="Toggle wishlist"
              >
                <Heart className={cn("size-4", wishlisted && "fill-gold text-gold")} />
              </Button>
            </div>
            <div className="mt-2.5">
              <ARLauncher mask={mask} />
            </div>
          </div>

          {/* shipping */}
          <div className="mt-4 rounded-lg border border-line bg-s1 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <Package className="size-4 text-gold" aria-hidden="true" />
                Insured home delivery
              </p>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-8 rounded-lg border border-line bg-s2 px-2 text-[13px] text-ink outline-none focus:border-gold/50"
                aria-label="Destination country"
              >
                {["Sri Lanka", "United States", "United Kingdom", "Germany", "Japan", "Australia"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {quotes.map((qt) => (
                <li key={qt.carrier} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                  <span className="text-ink2">
                    {qt.carrier}
                    <span className="ml-2 font-mono text-[11px] text-ink4 tnum">{qt.eta}</span>
                  </span>
                  <span className="font-mono text-ink tnum">{formatMoney(qt.priceLKR, currency)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-ink3">Crated in the workshop within three days of your order; papers handled for you.</p>
          </div>

          {/* what's included */}
          <div className="mt-4 rounded-lg border border-line bg-s1 p-4">
            <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
              <FileCheck2 className="size-4 text-gold" aria-hidden="true" />
              What arrives with it
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {includes.map((i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-ink2">
                  <ChevronDown className="mt-0.5 size-3 -rotate-90 text-gold/70" aria-hidden="true" />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          {/* specs */}
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-0 rounded-lg border border-line bg-s1 px-4 py-1 text-[13px]">
            {[
              ["Dimensions", `${mask.heightCm} × ${mask.widthCm} × ${mask.depthCm} cm`],
              ["Weight", `${mask.weightKg} kg`],
              ["Timber", mask.wood.replace(" (Strychnos nux-vomica)", "")],
              ["Pigments", mask.dyes.join(", ")],
              ["Carving time", `${mask.carvingDays} days at the bench`],
              ["Year carved", String(mask.year)],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-line py-2.5 last:border-0 odd:border-r odd:pr-4 even:pl-4">
                <dt className="text-[11px] uppercase tracking-[0.12em] text-ink4">{k}</dt>
                <dd className="mt-0.5 text-ink2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* -------------------------------- provenance panel */}
      <section className="mt-14 grid gap-8 lg:grid-cols-5" aria-label="Provenance">
        <div className="lg:col-span-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Provenance</p>
          <h2 className="mt-2 font-display text-[26px] leading-tight text-ink">A lineage you can check</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink2">
            From the felling date of its Kaduru tree to the tag on its back, this piece carries a public record. The plain-english
            version is on the timeline; the cryptography is one tap below.
          </p>
          <div className="mt-6">
            <VerifiedSeal size="md" />
          </div>
        </div>
        <div className="relative lg:col-span-3">
          <div className="edge relative rounded-lg bg-s2 p-6">
            <BorderBeam duration={7} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldIcon />
                Verified authentic
              </p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(mask.certId).catch(() => {});
                  toast("Certificate ID copied", { description: mask.certId });
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-s1 px-2.5 py-1.5 font-mono text-[12px] text-gold transition-colors hover:border-gold/40 tnum"
                aria-label={`Copy certificate ${mask.certId}`}
              >
                <Copy className="size-3" aria-hidden="true" />
                {mask.certId}
              </button>
            </div>
            <ProvenanceTimeline steps={provenance} className="mt-5" />
            <details className="group mt-5 border-t border-line pt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium text-ink2 transition-colors hover:text-ink">
                Technical details
                <ChevronDown className="size-4 transition-transform duration-180 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <dl className="mt-3 space-y-2 font-mono text-[12px] tnum">
                {[
                  ["Chain", "Polygon mainnet"],
                  ["Token standard", "ERC-721 · non-transferable metadata lock"],
                  ["Token ID", `#${mask.certId.slice(9)} · contract 0x3f2c…99c1`],
                  ["Metadata", `ipfs://bafybei${techId}…x3kq`],
                  ["Registry hash", `keccak256 · ${techId}…e7`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-ink4">{k}</dt>
                    <dd className="text-right text-ink2">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-ink3">
                Verification needs nothing here — the tag on the mask is enough. This section exists for the curious.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* -------------------------------- story + tradition */}
      <section className="mt-14 overflow-hidden rounded-lg" aria-label="Cultural context">
        <div className="flame-divider" aria-hidden="true" />
        <div className="grid gap-10 bg-s1 px-6 py-10 sm:px-10 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">The face</p>
            <p className="mt-3 font-display text-lg leading-relaxed font-light text-ink">{mask.story}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Its place in the tradition</p>
            <p className="mt-3 text-sm leading-relaxed text-ink2">{mask.context}</p>
            <Link to={`/heritage/${mask.tradition}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-strong">
              Read about {mask.tradition[0].toUpperCase() + mask.tradition.slice(1)} tradition →
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------- related */}
      {related.length > 0 && (
        <section className="mt-16" aria-label="Related masks">
          <h2 className="font-display text-[24px] text-ink">From the same tradition</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {related.map((m) => (
              <MaskCard key={m.slug} mask={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ShieldIcon() {
  return <BadgeCheck className="size-4 text-gold" aria-hidden="true" />;
}
