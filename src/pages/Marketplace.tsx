import { ArrowUpDown, Check, LayoutGrid, List, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigationType, useSearchParams } from "react-router-dom";
import { api, sizeOf, type MaskQuery } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import type { Artisan, Mask, Tradition } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { MaskCard, TraditionTag } from "@/components/MaskCard";
import { AnimatedTabs, SpotlightCard } from "@/components/ui/surfaces";
import { Button, Drawer, EmptyState, Skeleton } from "@/components/ui/kit";
import { MaskArtwork } from "@/components/ui/MaskImage";
import { photos } from "@/lib/photos";

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
const collectionScroll = new Map<string, number>();
const filterKeys = ["tradition", "artisan", "ar", "verified", "maxPrice", "size", "q"];

export default function Marketplace() {
  usePageMeta("The collection", "Eighteen hand-carved Kaduru masks across the Raksha, Sanni and Kolam traditions — each with named maker and minted provenance.");

  const [params, setParams] = useSearchParams();
  const { key, search, state } = useLocation();
  const navigationType = useNavigationType();
  const scrollKey = state?.scrollKey ?? key;
  const restoreKey = navigationType === "POP" ? scrollKey : state?.collectionScrollKey;
  const pendingScroll = useRef(restoreKey ? collectionScroll.get(restoreKey) : undefined);

  function updateParam(name: string, value: string | string[] = "") {
    const next = new URLSearchParams(window.location.search);
    next.delete(name);
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry) next.append(name, entry);
    }
    setParams(next, { replace: true, state: { scrollKey } });
  }

  const [makerList, setMakerList] = useState<Artisan[]>([]);
  const tradeParam = params.get("tradition");
  const tradition = traditionTabs.some((t) => t.id === tradeParam) ? (tradeParam as string) : "all";
  const setTradition = (t: string) => updateParam("tradition", t === "all" ? "" : t);
  const makerParam = params.get("artisan");
  const artisan = makerParam ? makerParam : "all";
  const arOnly = params.get("ar") === "1";
  const verifiedOnly = params.get("verified") === "1";
  const priceParam = Number(params.get("maxPrice"));
  const maxPrice = priceParam >= 30000 && priceParam <= 215000 && priceParam % 5000 === 0 ? priceParam : 215000;
  const sizeParams = params.getAll("size").join(",");
  const sizes = useMemo(() => sizeOptions.map(({ id }) => id).filter((id) => sizeParams.split(",").includes(id)), [sizeParams]);
  const q = params.get("q") ?? "";
  const sortParam = params.get("sort");
  const sort: SortId = sortParam === "price-asc" || sortParam === "price-desc" || sortParam === "newest" ? sortParam : "featured";
  const view = params.get("view") === "list" ? "list" : "grid";
  const [maxPriceSettled, setMaxPriceSettled] = useState(maxPrice);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [results, setResults] = useState<Mask[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const currency = useApp((s) => s.currency);
  const detailLinkState = { collectionSearch: search, collectionScrollKey: scrollKey };

  useLayoutEffect(() => {
    if (loading) return;
    if (pendingScroll.current !== undefined) {
      window.scrollTo({ top: pendingScroll.current, behavior: "instant" });
      pendingScroll.current = undefined;
    }
    const saveScroll = () => {
      if (window.location.pathname === "/masks" && window.location.search === search) {
        collectionScroll.set(scrollKey, window.scrollY);
      }
    };
    saveScroll();
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => window.removeEventListener("scroll", saveScroll);
  }, [loading, scrollKey, search]);

  /* dragging the price slider shouldn't fire a query per tick */
  useEffect(() => {
    const t = window.setTimeout(() => setMaxPriceSettled(maxPrice), 180);
    return () => window.clearTimeout(t);
  }, [maxPrice]);

  /* Only the first load shows skeletons; later filter changes keep the current
     pieces on screen (dimmed) so the grid never collapses and jumps. */
  useEffect(() => {
    let alive = true;
    setFetching(true);
    const t = window.setTimeout(() => {
      api
        .listMasks({
          tradition: tradition as Tradition | "all",
          artisan,
          q: q || undefined,
          arOnly,
          verifiedOnly,
          maxPriceLKR: maxPriceSettled,
          sizes,
          sort,
        })
        .then((r) => {
          if (alive) {
            setResults(r);
            setLoading(false);
            setFetching(false);
          }
        })
        .catch(() => {
          if (alive) {
            setLoading(false);
            setFetching(false);
          }
        });
    }, q ? 200 : 0);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [tradition, artisan, arOnly, verifiedOnly, maxPriceSettled, sizes, q, sort]);

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (tradition !== "all") activeChips.push({ key: "t", label: `Tradition: ${tradition}`, clear: () => setTradition("all") });
  if (artisan !== "all") {
    const a = makerList.find((x) => x.slug === artisan);
    activeChips.push({ key: "a", label: `Maker: ${a?.name ?? artisan}`, clear: () => updateParam("artisan") });
  }
  if (maxPrice < 215000) activeChips.push({ key: "p", label: `Under ${formatMoney(maxPrice, currency)}`, clear: () => updateParam("maxPrice") });
  sizes.forEach((s) => activeChips.push({ key: `s-${s}`, label: `Size: ${s}`, clear: () => updateParam("size", sizes.filter((x) => x !== s)) }));
  if (arOnly) activeChips.push({ key: "ar", label: "AR available", clear: () => updateParam("ar") });
  if (verifiedOnly) activeChips.push({ key: "v", label: "Verified", clear: () => updateParam("verified") });
  if (q) activeChips.push({ key: "q", label: `“${q}”`, clear: () => updateParam("q") });

  useEffect(() => {
    api.listArtisans().then((data) => {
      if (data && data.length) setMakerList(data);
    });
  }, []);

  const resetAll = () => {
    const next = new URLSearchParams(params);
    filterKeys.forEach((name) => next.delete(name));
    setParams(next, { replace: true, state: { scrollKey } });
  };

  const filterBody = (
    <div className="space-y-7">
      <div>
        <p className="mb-2.5 text-[12.5px] font-medium  text-ink3">Maker</p>
        <select
          value={artisan}
          onChange={(e) => updateParam("artisan", e.target.value === "all" ? "" : e.target.value)}
          className="h-10 w-full rounded-lg border border-line bg-s2 px-3 text-sm text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
          aria-label="Filter by maker"
        >
          <option value="all">All eight artisans</option>
          {makerList.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name} · {a.region}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <p className="text-[12.5px] font-medium  text-ink3">Price ceiling</p>
          <span className="font-mono text-xs text-gold tnum">{formatMoney(maxPrice, currency)}</span>
        </div>
        <input
          type="range"
          min={30000}
          max={215000}
          step={5000}
          value={maxPrice}
          onChange={(e) => updateParam("maxPrice", e.target.value === "215000" ? "" : e.target.value)}
          className="w-full accent-[#C9A45C]"
          aria-label="Maximum price"
        />
      </div>

      <fieldset>
        <legend className="mb-2.5 text-[12.5px] font-medium  text-ink3">Scale</legend>
        <div className="space-y-2">
          {sizeOptions.map((s) => {
            const on = sizes.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => updateParam("size", on ? sizes.filter((x) => x !== s.id) : [...sizes, s.id])}
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
        <legend className="mb-2.5 text-[12.5px] font-medium  text-ink3">Attributes</legend>
        <div className="space-y-2">
          {([
            ["AR preview ready", arOnly, () => updateParam("ar", arOnly ? "" : "1")],
            ["Registry-verified", verifiedOnly, () => updateParam("verified", verifiedOnly ? "" : "1")],
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
          <h1 className="mt-2 font-display text-[34px] leading-tight tracking-[-0.01em] text-ink sm:text-[40px]">Eighteen faces, three traditions</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink2">
            Raksha guardians, the eighteen Sanni, and Kolam's comic parliament. Each is one of one — carved, rested and
            painted by the maker whose name is on the back.
          </p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              value={q}
              onChange={(e) => updateParam("q", e.target.value)}
              placeholder="Search pieces or regions…"
              className="h-10 w-full rounded-lg border border-line bg-s2 pr-10 pl-3.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              aria-label="Search the collection"
            />
            <kbd className="kbd pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* tradition tabs + controls */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <AnimatedTabs id="tradition" tabs={traditionTabs} value={tradition} onChange={setTradition} />
        <div className="ml-auto flex w-full min-w-0 items-center gap-2 sm:w-auto">
          <label className="hidden items-center gap-2 text-xs text-ink3 sm:flex" htmlFor="sort">
            <ArrowUpDown className="size-3.5" aria-hidden="true" />
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value === "featured" ? "" : e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-s2 px-2.5 text-[13px] text-ink outline-none focus:border-gold/50 sm:flex-none"
            aria-label="Sort results"
          >
            <option value="featured">Featured first</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="newest">Newest carving</option>
          </select>
          <div className="flex rounded-lg border border-line bg-s1 p-0.5" role="group" aria-label="View">
            <button onClick={() => updateParam("view")} aria-pressed={view === "grid"} aria-label="Grid view" className={cn("grid size-8 place-items-center rounded-md transition-colors", view === "grid" ? "bg-s3 text-ink" : "text-ink3 hover:text-ink2")}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button onClick={() => updateParam("view", "list")} aria-pressed={view === "list"} aria-label="List view" className={cn("grid size-8 place-items-center rounded-md transition-colors", view === "list" ? "bg-s3 text-ink" : "text-ink3 hover:text-ink2")}>
              <List className="size-3.5" />
            </button>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 lg:hidden" onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal className="size-3.5" />
            Filters
            {activeChips.length > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-gold px-1.5 font-mono text-[11px] leading-5 text-on-gold tnum">
                {activeChips.length}
                <span className="sr-only"> active</span>
              </span>
            )}
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
        <div aria-live="polite" aria-busy={fetching} className={cn("transition-opacity duration-180", fetching && !loading && "opacity-60")}>
          <p className="mb-4 text-[13px] text-ink3 tnum">
            {fetching ? "Consulting the registry…" : `${results.length} ${results.length === 1 ? "piece" : "pieces"}`}
          </p>

          {loading ? (
            <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={view === "grid" ? "aspect-[4/5.4]" : "h-28"} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              photo={photos.masksWall}
              title="The shelf is bare under these filters"
              body="No masks match these filters. Try changing one or clearing them all. Custom commissions are unavailable in this demo."
            >
              <Button variant="outline" size="sm" onClick={resetAll}>
                <RotateCcw className="size-3.5" />
                Reset filters
              </Button>
            </EmptyState>
          ) : view === "grid" ? (
            <div key="grid" className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {results.map((m) => (
                <MaskCard key={m.slug} mask={m} linkState={detailLinkState} />
              ))}
            </div>
          ) : (
            <ListView results={results} linkState={detailLinkState} />
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

function ListView({ results, linkState }: { results: Mask[]; linkState: { collectionSearch: string; collectionScrollKey: string } }) {
  const currency = useApp((s) => s.currency);
  return (
    <div className="space-y-3">
      {results.map((m) => (
        <SpotlightCard key={m.slug}>
          <Link
            to={`/masks/${m.slug}`}
            state={linkState}
            aria-labelledby={`mask-name-${m.slug}`}
            aria-describedby={`mask-price-${m.slug}`}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-4"
          >
            <MaskArtwork mask={m} ratio="" className="row-span-2 size-20 rounded-lg sm:row-span-1 sm:size-24" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 id={`mask-name-${m.slug}`} className="font-display text-[17px] leading-tight text-ink">{m.name}</h3>
                <TraditionTag tradition={m.tradition} />
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink3">{m.story}</p>
              <p className="mt-1.5 text-xs text-ink3">
                {m.heightCm} cm · {sizeOf(m)} · {m.region} · {m.year}
              </p>
            </div>
            <span id={`mask-price-${m.slug}`} className="col-start-2 font-mono text-sm text-ink tnum sm:col-start-auto sm:text-[15px]">{formatMoney(m.priceLKR, currency)}</span>
          </Link>
        </SpotlightCard>
      ))}
    </div>
  );
}
