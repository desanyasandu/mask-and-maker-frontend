import { ArrowLeft, BadgeCheck, Heart, MapPin, PenTool, Quote, Star, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import type { Artisan, Mask } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { MaskCard } from "@/components/MaskCard";
import { ArtisanAvatar } from "@/pages/Artisans";
import { Button, EmptyState, Skeleton } from "@/components/ui/kit";
import { ImageFrame } from "@/components/ui/MaskImage";

const patronAmounts = [1500, 4500, 12000];

export default function ArtisanDetail() {
  const { slug = "" } = useParams();
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [catalog, setCatalog] = useState<Mask[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useApp((s) => s.toast);
  const currency = useApp((s) => s.currency);

  usePageMeta(artisan ? artisan.name : "Artisan");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.getArtisan(slug).then(async (a) => {
      if (!alive) return;
      setArtisan(a ?? null);
      if (a) {
        const c = await api.masksByArtisan(a.slug);
        if (alive) setCatalog(c);
      }
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!artisan) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
        <EmptyState icon={PenTool} title="No maker by that name" body="The registry lists eight workshops. One of them is bound to have carved what you're looking for.">
          <Link to="/artisans" className="inline-flex h-10 items-center rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
            Meet the makers
          </Link>
        </EmptyState>
      </div>
    );
  }

  const paragraphs = artisan.story.match(/[^.]+\.[^.]+\.|[^.]+$/g) ?? [artisan.story];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <Link to="/artisans" className="inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All makers
      </Link>

      {/* editorial hero */}
      <div className="mt-6 grid items-end gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
            <MapPin className="size-3.5" aria-hidden="true" />
            {artisan.village}
          </p>
          <h1 className="mt-3 font-display text-[40px] leading-[1.02] font-light tracking-[-0.02em] text-ink sm:text-[52px]">
            {artisan.name}
          </h1>
          <p className="mt-2 font-sinhala text-lg text-ink2">{artisan.sinhalaName}</p>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink2">
            {artisan.role}
            {artisan.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Heritage-verified
              </span>
            )}
          </p>
          <p className="mt-6 max-w-lg border-l-2 border-gold/50 pl-5 text-[15px] leading-relaxed text-ink2">{artisan.bio}</p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {[
              ["Carving since", String(artisan.since)],
              ["Pieces fulfilled", String(artisan.ordersFulfilled)],
              ["Rating", `${artisan.rating} / 5`],
              ["Generations", String(artisan.generations.length)],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink4">{k}</p>
                <p className="mt-1 font-mono text-xl text-ink tnum">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="relative">
            <ImageFrame
              src={artisan.photo}
              alt={`${artisan.name} in the workshop`}
              ratio="aspect-[4/4.6]"
              fallback={
                <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-s2 to-s1">
                  <ArtisanAvatar artisan={artisan} size="size-28" />
                  <p className="max-w-[220px] text-center text-xs leading-relaxed text-ink3">Studio portrait in the registry's sitting programme</p>
                </div>
              }
            />
            <span className="absolute right-3 bottom-3 rounded-md bg-scrim px-2 py-1 font-mono text-[10px] tracking-wide text-ink2 backdrop-blur-sm tnum">
              {artisan.region} · {artisan.born}
            </span>
          </div>
        </div>
      </div>

      {/* story + craft details */}
      <div className="mt-16 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">The workshop</p>
          {paragraphs.map((p, i) => (
            <p key={i} className={cn("mt-4 text-[15px] leading-[1.75]", i === 0 ? "text-ink" : "text-ink2")}>
              {p.trim()}
            </p>
          ))}
          <div className="mt-8 flex items-start gap-3 rounded-lg border border-line bg-s1 p-5">
            <Quote className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
            <p className="font-display text-[15px] leading-relaxed text-ink2 italic">
              Registry field-note — every tool above was in use within the last season. No shelf ornaments were harmed in the making of this page.
            </p>
          </div>
        </div>
        <aside className="space-y-4 lg:col-span-5">
          <div className="edge rounded-lg bg-s1 p-5">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Wrench className="size-4 text-gold" aria-hidden="true" />
              The toolset
            </p>
            <ul className="mt-3 space-y-2">
              {artisan.tools.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[13px] text-ink2">
                  <span className="size-1 rounded-full bg-gold/60" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="edge rounded-lg bg-s1 p-5">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Star className="size-4 text-gold" aria-hidden="true" />
              Style notes — how to spot their hand
            </p>
            <ul className="mt-3 space-y-2">
              {artisan.styleNotes.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[13px] text-ink2">
                  <span className="size-1 rounded-full bg-gold/60" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* lineage */}
      <section className="mt-16" aria-label="Lineage">
        <h2 className="font-display text-[24px] text-ink">The line</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {artisan.generations.map((g, i) => (
            <li key={g.name} className="relative border-l border-line pl-5">
              <span className={cn("absolute top-1 -left-[5px] size-2.5 rounded-full border", i === artisan.generations.length - 2 ? "border-gold bg-gold" : "border-gold/40 bg-s2")} aria-hidden="true" />
              <p className="font-mono text-[11px] text-ink3 tnum">{g.years}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{g.name}</p>
              <p className="mt-1 text-[13px] leading-snug text-ink3">{g.note}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* catalog */}
      {catalog.length > 0 && (
        <section className="mt-16" aria-label="Catalog">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[24px] text-ink">From this bench</h2>
            <p className="font-mono text-xs text-ink3 tnum">{catalog.length} {catalog.length === 1 ? "piece" : "pieces"} live</p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {catalog.map((m) => (
              <MaskCard key={m.slug} mask={m} />
            ))}
          </div>
        </section>
      )}

      {/* patronage */}
      <section className="mt-16" aria-label="Support this artisan">
        <div className="edge rounded-lg bg-gradient-to-b from-s2 to-s1 p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
                <Heart className="size-3.5" aria-hidden="true" />
                Patronage, done plainly
              </p>
              <h2 className="mt-2 font-display text-[26px] leading-tight text-ink">Keep this bench lit</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink2">
                A patronage pays for timber seasons, pigment grinding days and apprentice hours — the slow parts of the craft that
                sales alone can't fund. 96% of your pledge reaches the workshop; the registry keeps the books open.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <div className="flex flex-wrap gap-3">
                {patronAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    onClick={() => toast("Pledged — thank you", { description: `${formatMoney(amt, currency)} to ${artisan.name}'s workshop. The registry desk confirms by letter.`, kind: "success" })}
                  >
                    {formatMoney(amt, currency)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-ink3">One-time pledges while the workshop fund is prototyped. No subscriptions here yet.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
