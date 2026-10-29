import { ArrowUpDown, Check, Inbox, LayoutGrid, List, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, sizeOf, type MaskQuery } from "@/lib/mock/api";
import { artisans } from "@/lib/mock/data";
import { usePageMeta } from "@/lib/meta";
import type { Mask, Tradition } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { MaskCard, TraditionTag } from "@/components/MaskCard";
import { AnimatedTabs, SpotlightCard } from "@/components/ui/surfaces";
import { Button, Drawer, EmptyState, Skeleton } from "@/components/ui/kit";
import { MaskArtwork } from "@/components/ui/MaskImage";

const traditionTabs = [
  { id: "all", label: "All traditions" },
  { id: "raksha", label: "Raksha" },
  { id: "sanni", label: "Sanni" },
  { id: "kolam", label: "Kolam" },
];

const sizeOptions = [
  { id: "compact", label: "Compact · under 30 cm" },
  { id: "display", label: "Display · 30–48 cm" },
  { id: "monumental", label: "Monumental · 48 cm+" },
];

type SortId = NonNullable<MaskQuery["sort"]>;

export default function Marketplace() {
  usePageMeta("The collection", "Eighteen hand-carved Kaduru masks across the Raksha, Sanni and Kolam traditions — each with named maker and minted provenance.");

  const [params] = useSearchParams();
  const [tradition, setTradition] = useState<string>(params.get("tradition") ?? "all");
  const [artisan, setArtisan] = useState("all");
  const [arOnly, setArOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(215000);
  const [sizes, setSizes] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortId>("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Mask[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const currency = useApp((s) => s.currency);

  /* keep the tradition tab in sync with deep links like /masks?tradition=kolam */
  useEffect(() => {
    const t = params.get("tradition");
    if (t && traditionTabs.some((x) => x.id === t)) setTradition(t);
  }, [params]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = window.setTimeout(() => {
      api
        .listMasks({
          tradition: tradition as Tradition | "all",
          artisan,
          q: q || undefined,
          arOnly,
          verifiedOnly,
          maxPriceLKR: maxPrice,
          sizes,
          sort,
        })
        .then((r) => {
          if (alive) {
            setResults(r);
            setLoading(false);
          }
        });
    }, q ? 200 : 0);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [tradition, artisan, arOnly, verifiedOnly, maxPrice, sizes, q, sort]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (tradition !== "all") chips.push({ key: "t", label: `Tradition: ${tradition}`, clear: () => setTradition("all") });
    if (artisan !== "all") {
      const a = artisans.find((x) => x.slug === artisan);
      chips.push({ key: "a", label: `Maker: ${a?.name ?? artisan}`, clear: () => setArtisan("all") });
    }
    if (maxPrice < 215000) chips.push({ key: "p", label: `Under ${formatMoney(maxPrice, currency)}`, clear: () => setMaxPrice(215000) });
    sizes.forEach((s) => chips.push({ key: `s-${s}`, label: `Size: ${s}`, clear: () => setSizes((prev) => prev.filter((x) => x !== s)) }));
    if (arOnly) chips.push({ key: "ar", label: "AR available", clear: () => setArOnly(false) });
    if (verifiedOnly) chips.push({ key: "v", label: "Verified", clear: () => setVerifiedOnly(false) });
    if (q) chips.push({ key: "q", label: `“${q}”`, clear: () => setQ("") });
    return chips;
  }, [tradition, artisan, maxPrice, sizes, arOnly, verifiedOnly, q, currency]);

  const resetAll = () => {
    setTradition("all");
    setArtisan("all");
    setArOnly(false);
    setVerifiedOnly(false);
    setMaxPrice(215000);
    setSizes([]);
    setQ("");
  };

  const filterBody = (
    <div className="space-y-7">
      <div>
        <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink3">Maker</p>
        <select
          value={artisan}
          onChange={(e) => setArtisan(e.target.value)}
          className="h-10 w-full rounded-lg border border-line bg-s2 px-3 text-sm text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
          aria-label="Filter by maker"
        >
          <option value="all">All eight artisans</option>
          {artisans.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name} · {a.region}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink3">Price ceiling</p>
          <span className="font-mono text-xs text-gold tnum">{formatMoney(maxPrice, currency)}</span>
        </div>
        <input
          type="range"
          min={30000}
          max={215000}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#C9A45C]"
          aria-label="Maximum price"
        />
      </div>

      <fieldset>
        <legend className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink3">Scale</legend>
        <div className="space-y-2">
          {sizeOptions.map((s) => {
            const on = sizes.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setSizes((prev) => (on ? prev.filter((x) => x !== s.id) : [...prev, s.id]))}
                aria-pressed={on}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors duration-180",
                  on ? "border-gold/50 bg-gold/10 text-ink" : "border-line bg-s2 text-ink3 hover:text-ink2"
                )}
              >
                {s.label}
                {on && <Check className="size-3.5 text-gold" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink3">Attributes</legend>
        <div className="space-y-2">
          {([
            ["AR preview ready", arOnly, () => setArOnly(!arOnly)],
            ["Registry-verified", verifiedOnly, () => setVerifiedOnly(!verifiedOnly)],
          ] as const).map(([label, on, toggle]) => (
            <button
              key={label}
              onClick={toggle}
              aria-pressed={on}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors duration-180",
                on ? "border-gold/50 bg-gold/10 text-ink" : "border-line bg-s2 text-ink3 hover:text-ink2"
              )}
            >
              {label}
              <span className={cn("relative h-4.5 w-8 rounded-full transition-colors duration-180", on ? "bg-gold" : "bg-s3")} aria-hidden="true">
                <span className={cn("absolute top-0.5 size-3.5 rounded-full bg-canvas transition-transform duration-180", on ? "translate-x-4" : "translate-x-0.5")} />
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <Button variant="ghost" size="sm" onClick={resetAll} className="w-full">
        <RotateCcw className="size-3.5" />
        Clear every filter
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      {/* heading row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">The collection</p>
          <h1 className="mt-2 font-display text-[34px] leading-tight tracking-[-0.01em] text-ink sm:text-[40px]">Eighteen faces, three traditions</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink2">
            Raksha guardians, the eighteeen Sanni, and Kolam's comic parliament. Each is one of one — carved, rested and
            painted by the maker whose name is on the back.
          </p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pieces or regions…"
              className="h-10 w-full rounded-lg border border-line bg-s2 pr-10 pl-3.5 text-sm text-ink outline-none transition placeholder:text-ink4 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              aria-label="Search the collection"
            />
            <kbd className="kbd pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* tradition tabs + controls */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <AnimatedTabs id="tradition" tabs={traditionTabs} value={tradition} onChange={setTradition} />
        <div className="ml-auto flex items-center gap-2">
          <label className="hidden items-center gap-2 text-xs text-ink3 sm:flex" htmlFor="sort">
            <ArrowUpDown className="size-3.5" aria-hidden="true" />
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="h-9 rounded-lg border border-line bg-s2 px-2.5 text-[13px] text-ink outline-none focus:border-gold/50"
            aria-label="Sort results"
          >
            <option value="featured">Featured first</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="newest">Newest carving</option>
          </select>
          <div className="flex rounded-lg border border-line bg-s1 p-0.5" role="group" aria-label="View">
            <button onClick={() => setView("grid")} aria-pressed={view === "grid"} aria-label="Grid view" className={cn("grid size-8 place-items-center rounded-md transition-colors", view === "grid" ? "bg-s3 text-ink" : "text-ink4 hover:text-ink2")}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button onClick={() => setView("list")} aria-pressed={view === "list"} aria-label="List view" className={cn("grid size-8 place-items-center rounded-md transition-colors", view === "list" ? "bg-s3 text-ink" : "text-ink4 hover:text-ink2")}>
              <List className="size-3.5" />
            </button>
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal className="size-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* active chips */}
      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeChips.map((c) => (
            <button
              key={c.key}
              onClick={c.clear}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-ink transition-colors hover:border-gold/60"
            >
              {c.label}
              <span aria-hidden="true" className="text-gold">×</span>
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button onClick={resetAll} className="text-xs text-ink3 underline-offset-2 transition-colors hover:text-ink hover:underline">
            Reset
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* filter rail */}
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24">{filterBody}</div>
        </aside>

        {/* results */}
        <div aria-live="polite" aria-busy={loading}>
          <p className="mb-4 font-mono text-xs text-ink3 tnum">
            {loading ? "Consulting the registry…" : `${results.length} ${results.length === 1 ? "piece" : "pieces"}`}
          </p>

          {loading ? (
            <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={view === "grid" ? "aspect-[4/5.4]" : "h-28"} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="The shelf is bare under these filters"
              body="No piece matches every box you've ticked. Loosen one filter — or let us commission the face you're imagining."
            >
              <Button variant="outline" size="sm" onClick={resetAll}>
                <RotateCcw className="size-3.5" />
                Reset filters
              </Button>
              <Button variant="ghost" size="sm" onClick={() => useApp.getState().toast("Commission noted", { description: "The registry desk writes back within two days.", kind: "success" })}>
                Commission a carving
              </Button>
            </EmptyState>
          ) : view === "grid" ? (
            <div key="grid" className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {results.map((m) => (
                <MaskCard key={m.slug} mask={m} />
              ))}
            </div>
          ) : (
            <ListView results={results} />
          )}
        </div>
      </div>

      {/* mobile filter sheet */}
      <Drawer open={sheetOpen} onClose={() => setSheetOpen(false)} title="Refine the collection" width="max-w-sm">
        <div className="flex-1 overflow-y-auto px-5 py-6">{filterBody}</div>
        <div className="border-t border-line p-4">
          <Button className="w-full" onClick={() => setSheetOpen(false)}>
            Show {results.length} {results.length === 1 ? "piece" : "pieces"}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}

function ListView({ results }: { results: Mask[] }) {
  const currency = useApp((s) => s.currency);
  return (
    <div className="space-y-3">
      {results.map((m) => (
        <SpotlightCard key={m.slug}>
          <Link to={`/masks/${m.slug}`} className="flex items-center gap-4 p-3" aria-label={`View ${m.name}`}>
            <MaskArtwork mask={m} ratio="" className="size-20 shrink-0 rounded-lg sm:size-24" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="truncate font-display text-[17px] text-ink">{m.name}</h3>
                <TraditionTag tradition={m.tradition} />
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink3">{m.story}</p>
              <p className="mt-1.5 text-xs text-ink4">
                {m.heightCm} cm · {sizeOf(m)} · {m.region} · {m.year}
              </p>
            </div>
            <span className="hidden shrink-0 font-mono text-[15px] text-ink sm:block tnum">{formatMoney(m.priceLKR, currency)}</span>
          </Link>
        </SpotlightCard>
      ))}
    </div>
  );
}
