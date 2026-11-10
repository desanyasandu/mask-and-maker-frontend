import { ArrowLeft, BadgeCheck, ChevronDown, Copy, FileCheck2, Heart, Maximize2, Package, ShoppingBag, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import type { Artisan, Certificate, Mask } from "@/lib/types";
import { formatDate, formatMoney, hashString } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { MaskCard, TraditionTag } from "@/components/MaskCard";
import { ARLauncher, ModelViewerPanel } from "@/components/ui/ARLauncher";
import { ArchivePlate, MaskArtwork } from "@/components/ui/MaskImage";
import { AnimatedTabs, BorderBeam, VerifiedSeal } from "@/components/ui/surfaces";
import { Button, EmptyState, Lightbox, Skeleton } from "@/components/ui/kit";
import { ProvenanceTimeline, type ProvStep } from "@/components/ui/ProvenanceTimeline";
import { ImageFrame as Photograph, Pic } from "@/components/ui/MaskImage";
import { craftHands, photos } from "@/lib/photos";
import { ButtonLink } from "@/components/ui/kit";

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
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const wantsAR = searchParams.get("ar") === "1";
  const [mask, setMask] = useState<Mask | null>(null);
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [related, setRelated] = useState<Mask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("photographs");
  const [country, setCountry] = useState("Sri Lanka");
  const [zoomOpen, setZoomOpen] = useState(false);

  const currency = useApp((s) => s.currency);
  const setCurrency = useApp((s) => s.setCurrency);
  const addToCart = useApp((s) => s.addToCart);
  const setCartOpen = useApp((s) => s.setCartOpen);
  const wishlisted = useApp((s) => s.wishlist.includes(slug));
  const toggleWishlist = useApp((s) => s.toggleWishlist);
  const toast = useApp((s) => s.toast);

  /* phones: once the buy box scrolls away, keep the price and "Add to crate" in reach */
  const buyRef = useRef<HTMLDivElement>(null);
  const [buyOffscreen, setBuyOffscreen] = useState(false);
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBuyOffscreen(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [loading, mask]);

  usePageMeta(mask ? mask.name : "Mask detail");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    /* the desktop QR hand-off lands here with ?ar=1: open straight on the 3D/AR study */
    setTab(wantsAR ? "model" : "photographs");
    api.getMask(slug).then(async (m) => {
      if (!alive) return;
      setMask(m ?? null);
      if (m) {
        const [a, r, c] = await Promise.all([
          api.getArtisan(m.artisanSlug),
          api.relatedMasks(m.slug, m.tradition),
          api.certificateForMask(m.slug),
        ]);
        if (alive) {
          setArtisan(a ?? null);
          setRelated(r);
          setCert(c ?? null);
        }
      }
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [slug, wantsAR]);

  const provenance = useMemo<ProvStep[]>(() => {
    if (cert && cert.history && cert.history.length > 0) {
      const steps: ProvStep[] = cert.history.map((h) => ({
        label: h.label,
        date: formatDate(h.date),
        actor: h.actor,
        state: "done",
      }));
      if (cert.status !== "claimed") {
        steps.push({ label: "Claimed by its keeper", state: "pending" });
      }
      return steps;
    }
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
  }, [cert, mask, artisan]);

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
          photo={photos.masksBanner}
          title="That face isn't in the registry"
          body="The piece you're after has either found its keeper or never left the workshop. The shelf it came from is well worth a look."
        >
          <ButtonLink to="/masks">Back to the collection</ButtonLink>
        </EmptyState>
      </div>
    );
  }

  const quotes = shipRows(country, mask.weightKg);
  const techId = hashString(mask.slug).toString(16).slice(0, 8);

  const onAdd = () => {
    if (addToCart(mask.slug)) {
      toast("Added to your crate", { description: mask.name, kind: "success" });
    } else {
      toast("Already in your crate", { description: mask.stock === 1 ? "This piece is one of one." : "Every available piece is crated." });
    }
    setCartOpen(true);
  };

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
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-28 sm:px-6 lg:pb-4">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <Link to={{ pathname: "/masks", search: state?.collectionSearch }} state={{ collectionScrollKey: state?.collectionScrollKey }} className="inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        The collection
      </Link>

      <div className="mt-5 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        {/* -------------------------------- gallery */}
        <div className="min-w-0">
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
            {tab === "photographs" && (
              mask.image ? (
                <button
                  onClick={() => setZoomOpen(true)}
                  aria-label={`Enlarge the photograph of ${mask.name}`}
                  className="group/zoom relative block w-full cursor-zoom-in rounded-lg text-left"
                >
                  <MaskArtwork mask={mask} eager className="w-full" />
                  <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-scrim px-3 py-1.5 text-[12px] font-medium text-ink opacity-90 transition-opacity group-hover/zoom:opacity-100">
                    <Maximize2 className="size-3.5" aria-hidden="true" />
                    Enlarge
                  </span>
                </button>
              ) : (
                <MaskArtwork mask={mask} eager className="w-full" />
              )
            )}
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
            <p className="mt-3 text-[13px] text-ink3">
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
                  <Pic src={artisan.photo} alt={`Portrait of ${artisan.name}`} className="h-full w-full object-cover" sizes="56px" />
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
            <span className="text-[12.5px]  text-ink3">{mask.region} · {mask.year}</span>
          </div>
          <h1 className="mt-3 font-display text-[36px] leading-[1.05] tracking-[-0.01em] text-ink sm:text-[42px]">{mask.name}</h1>
          <p className="mt-1.5 font-sinhala text-[17px] text-ink2">{mask.sinhala}</p>

          <p className="mt-5 text-[15px] leading-relaxed text-ink2">{mask.story}</p>

          {/* price + buy */}
          <div ref={buyRef} className="edge relative mt-7 rounded-lg bg-s2 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12.5px]  text-ink3">Workshop price</p>
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
                    className={cn("h-8 rounded-md px-3 transition-colors duration-180 tnum", currency === c ? "bg-s3 text-gold" : "text-ink3 hover:text-ink2")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
              <Button
                size="lg"
                onClick={onAdd}
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
                    <span className="ml-2 font-mono text-[11px] text-ink3 tnum">{qt.eta}</span>
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
                <dt className="text-[12.5px]  text-ink3">{k}</dt>
                <dd className="mt-0.5 text-ink2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* -------------------------------- provenance panel */}
      <section className="mt-14 grid gap-8 lg:grid-cols-5" aria-label="Provenance">
        <div className="lg:col-span-2">
          <h2 className="mt-2 font-display text-[26px] leading-tight text-ink">A lineage you can check</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink2">
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
                  ["Chain", cert?.chain || "Polygon PoS"],
                  ["Token standard", "ERC-721 · non-transferable metadata lock"],
                  ["Token ID", `#${cert?.tokenId || mask.certId.slice(9)} · contract ${cert?.contractAddress ? `${cert.contractAddress.slice(0, 6)}…${cert.contractAddress.slice(-4)}` : "0x3f2c…99c1"}`],
                  ["Metadata", cert?.ipfs || `ipfs://bafybei${techId}…x3kq`],
                  ["Registry hash", cert?.hashProof || `sha256 · ${techId}…e7`],
                  ["NFC tag UID", cert?.nfcTag?.uid || mask.certId],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-ink3">{k}</dt>
                    <dd className="max-w-[65%] truncate text-right text-ink2" title={v}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs leading-relaxed text-ink3">
                  Verification needs nothing here — the tag on the mask is enough.
                </p>
                <Link
                  to={`/verify/${mask.certId}`}
                  className="text-xs font-medium text-gold transition-colors hover:text-gold-strong"
                >
                  Inspect certificate on registry →
                </Link>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* -------------------------------- story + tradition */}
      <section className="mt-14 rounded-lg bg-s1 p-6 sm:p-10" aria-label="Cultural context">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className="font-display text-[26px] leading-tight text-ink">Its place in the tradition</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink2">{mask.context}</p>
            <Link to={`/heritage/${mask.tradition}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-strong">
              Read about the {mask.tradition[0].toUpperCase() + mask.tradition.slice(1)} tradition →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {[craftHands, photos.sohonaYakka].map((p) => (
              <figure key={p.src}>
                <Photograph src={p.src} alt={p.alt} ratio="aspect-[4/3]" position={p.position} className="rounded-lg" />
                <figcaption className="mt-2 text-[13px] text-ink3">{p.caption}</figcaption>
              </figure>
            ))}
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

      {mask.image && (
        <Lightbox
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
          src={mask.image}
          alt={`${mask.name}, studio photograph`}
          caption={`${mask.name} · ${mask.region} · ${mask.year}`}
        />
      )}

      {buyOffscreen && mask.stock > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas px-4 py-3 lg:hidden" role="region" aria-label="Quick buy">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{mask.name}</p>
              <p className="font-mono text-[13px] text-gold tnum">{formatMoney(mask.priceLKR, currency)}</p>
            </div>
            <Button onClick={onAdd}>
              <ShoppingBag className="size-4" />
              Add to crate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldIcon() {
  return <BadgeCheck className="size-4 text-gold" aria-hidden="true" />;
}
