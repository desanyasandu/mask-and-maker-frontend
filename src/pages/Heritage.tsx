import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Clapperboard, NotebookPen, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import { formatDate, formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { AnimatedTabs } from "@/components/ui/surfaces";
import { Button, Modal } from "@/components/ui/kit";
import { ImageFrame } from "@/components/ui/MaskImage";
import { FlameBand } from "@/components/art";
import { craftHands, photos, traditionPhoto } from "@/lib/photos";
import { Reveal } from "@/components/ui/motion";
import type { Article, CraftStage, Mask, TraditionDoc, Workshop } from "@/lib/types";

const kindTabs = [
  { id: "all", label: "Everything" },
  { id: "essay", label: "Essays" },
  { id: "film", label: "Films" },
  { id: "field-notes", label: "Field notes" },
];



export default function Heritage() {
  const [params, setParams] = useSearchParams();
  const currency = useApp((s) => s.currency);
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [traditionsList, setTraditionsList] = useState<TraditionDoc[]>([]);
  const [stagesList, setStagesList] = useState<CraftStage[]>([]);
  const [workshopsList, setWorkshopsList] = useState<Workshop[]>([]);
  const [masksList, setMasksList] = useState<Mask[]>([]);

  useEffect(() => {
    api.listArticles().then((a) => a && setArticlesList(a)).catch(() => {});
    api.listTraditions().then((t) => t && setTraditionsList(t)).catch(() => {});
    api.listStages().then((s) => s && setStagesList(s)).catch(() => {});
    api.listWorkshops().then((w) => w && setWorkshopsList(w)).catch(() => {});
    api.listMasks().then((m) => m && setMasksList(m)).catch(() => {});
  }, []);

  const articleSlug = params.get("article");
  const article = articlesList.find((a) => a.slug === articleSlug) ?? null;

  usePageMeta(article ? article.title : "The Folklore Hub", "Ritual significance, carving craft and the folklore of Sri Lanka's mask traditions.");

  if (article) {
    return <ArticleReader article={article} onBack={() => setParams({})} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="mt-2 font-display text-[38px] leading-[1.05] font-light tracking-[-0.02em] text-ink sm:text-[48px]">
          The stories packed into the same crate
          <span className="mt-1 block font-sinhala text-[0.45em] text-ink3">අප්‍රකට උරුමය මෙතන වාසය කරයි</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink2">
          A mask bought without its folklore is decoration. We publish the ritual, the craft and the village history alongside
          every piece — written with the workshops, not about them.
        </p>
      </header>

      {/* taxonomy explorer */}
      <section className="mt-14" aria-label="Mask taxonomy">
        <div className="grid gap-4 md:grid-cols-3">
          {traditionsList.map((t) => (
            <Reveal key={t.slug}>
              <Link
                to={`/heritage/${t.slug}`}
                className="group flex h-full flex-col rounded-lg border border-line bg-s2 p-6 transition-colors duration-180 hover:border-gold/30 hover:bg-s3"
              >
                <ImageFrame
                  src={traditionPhoto[t.slug]?.src}
                  alt={traditionPhoto[t.slug]?.alt ?? t.name}
                  ratio="aspect-[4/3]"
                  position={traditionPhoto[t.slug]?.position}
                  className="mb-5 rounded-md"
                />
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-[22px] text-ink group-hover:text-gold-strong">{t.name}</h2>
                  <span className="font-sinhala text-sm text-ink3">{t.sinhala}</span>
                </div>
                <p className="mt-1 text-[13px] font-medium text-gold/90">{t.tagline}</p>
                <p className="mt-3 line-clamp-3 flex-1 text-[15px] leading-relaxed text-ink2">{t.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-[13.5px] text-ink3 tnum">{masksList.filter((m) => m.tradition === t.slug).length} pieces in the registry</span>
                  <ArrowRight className="size-4 text-ink3 transition-all duration-180 group-hover:translate-x-1 group-hover:text-gold" aria-hidden="true" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <FlameBand tall className="mt-20 opacity-80" />

      {/* scroll story — from log to mask */}
      <ScrollStory stages={stagesList} />

      {/* films */}
      <section className="mt-24" aria-label="Films">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="mt-2 font-display text-[28px] leading-[1.15] text-ink">Filmed where it happens</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {articlesList
            .filter((a) => a.kind === "film")
            .map((a) => (
              <FilmCard key={a.slug} article={a} />
            ))}
          <div className="flex flex-col justify-center rounded-lg bg-s1 p-8">
            <ImageFrame src={photos.kolamDance.src} alt={photos.kolamDance.alt} ratio="aspect-[16/9]" position={photos.kolamDance.position} className="mb-5 rounded-md" />
            <p className="mt-4 font-display text-xl leading-snug text-ink">One new film a moon</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink2">
              Slow documentaries from the workshops and the tovil grounds, made with the families on camera — never about them.
              Registry letter subscribers see each first.
            </p>
          </div>
        </div>
      </section>

      {/* articles index */}
      <section className="mt-24" aria-label="Essays and notes">
        <ArticleIndex articlesList={articlesList} />
      </section>

      {/* workshops */}
      <section className="mt-24 pb-4" aria-label="Workshops">
        <h2 className="mt-2 font-display text-[28px] leading-[1.15] text-ink">Workshops &amp; ritual nights</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {workshopsList.map((w) => (
            <div key={w.title} className="edge flex flex-col rounded-lg bg-s2 p-6">
              <p className="flex items-center gap-2 font-mono text-[12px] text-gold tnum">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatDate(w.date)}
              </p>
              <h3 className="mt-3 font-display text-lg leading-snug text-ink">{w.title}</h3>
              <p className="mt-1.5 text-[13px] text-ink3">{w.place}</p>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <span className="font-mono text-[15px] text-ink tnum">{formatMoney(w.priceLKR, currency)}</span>
                <ReserveButton id={w._id || w.id} title={w.title} spots={w.spotsLeft} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReserveButton({ id, title, spots: initialSpots }: { id?: string; title: string; spots: number }) {
  const toast = useApp((s) => s.toast);
  const [spots, setSpots] = useState(initialSpots);
  const [booked, setBooked] = useState(false);

  const reserve = async () => {
    if (booked || spots <= 0) return;
    if (id) {
      const updated = await api.bookWorkshop(id);
      if (updated && typeof updated.spotsLeft === "number") {
        setSpots(updated.spotsLeft);
      } else {
        setSpots((s) => Math.max(0, s - 1));
      }
    } else {
      setSpots((s) => Math.max(0, s - 1));
    }
    setBooked(true);
    toast("Seat held for 48 hours", { description: `${title} — your seat is reserved in the live registry.`, kind: "success" });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={booked || spots <= 0}
      onClick={reserve}
    >
      {booked ? "Seat held" : "Hold a seat"}
      <span className="font-mono text-[10px] text-ink3 tnum">{spots} left</span>
    </Button>
  );
}

/* ---------------- scroll story ---------------- */

function ScrollStory({ stages }: { stages: CraftStage[] }) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll("[data-stage]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.stage));
        }
      },
      { rootMargin: "-42% 0px -42% 0px" }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [stages.length]);

  const total = Math.max(1, stages.length);

  return (
    <section className="mt-20" aria-label="From log to mask">
      <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="mt-2 font-display text-[28px] leading-[1.15] text-ink">Ninety days of patience, then nine gouges</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink2">
            Every registry mask passes these eight stations in order. The timeline on its certificate begins at stage one — the tree.
          </p>
          <p className="mt-6 text-[13px] text-ink3 tnum" aria-live="polite">
            Stage {stages.length ? active + 1 : 0} / {stages.length}
          </p>
          <figure className="mt-8 hidden lg:block">
            <ImageFrame src={craftHands.src} alt={craftHands.alt} ratio="aspect-[4/3]" position={craftHands.position} className="rounded-lg" />
            <figcaption className="mt-2 text-[13px] text-ink3">{craftHands.caption}</figcaption>
          </figure>
          <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-s3" aria-hidden="true">
            <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${((active + 1) / total) * 100}%` }} />
          </div>
        </div>
        <ol ref={listRef} className="space-y-4">
          {stages.map((s, i) => (
            <li
              key={s.n}
              data-stage={i}
              className={cn(
                "rounded-lg p-5 transition-colors duration-300 sm:p-7",
                i === active ? "bg-s3" : "bg-s2"
              )}
            >
              <div>
                <p className={cn("text-[13px] font-medium", i === active ? "text-gold" : "text-ink3")}>Station {s.n}</p>
                <h3 className="mt-1 font-display text-[22px] leading-snug text-ink">
                  {s.title} <span className="ml-1 font-sinhala text-sm text-ink3">{s.sinhala}</span>
                </h3>
                <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-ink2">{s.body}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink3">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- films ---------------- */

function FilmCard({ article }: { article: Article }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="group relative block w-full overflow-hidden rounded-lg text-left" aria-haspopup="dialog" aria-label={`Play film: ${article.title}`}>
        <ImageFrame src={article.image} alt={article.title} ratio="aspect-[16/9]" className="rounded-lg" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas/80 via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <span>
            <span className="block font-display text-lg text-ink">{article.title}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-ink3 tnum">{article.readMinutes} min · {formatDate(article.date)}</span>
          </span>
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/60 bg-scrim text-gold transition-transform duration-180 group-hover:scale-105">
            <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />
          </span>
        </span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={article.title} maxWidth="max-w-xl">
        <p className="text-[15px] leading-relaxed text-ink2">{article.body[0]}</p>
        <p className="mt-4 rounded-lg bg-s2 px-4 py-3 text-[13.5px] leading-relaxed text-ink2">
          The film travels with the piece it documents. It unlocks on certificate scan — scan a tag, or read the transcript in the registry letter.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(false)}>
          Close
        </Button>
      </Modal>
    </>
  );
}

/* ---------------- article index + reader ---------------- */

function ArticleIndex({ articlesList }: { articlesList: Article[] }) {
  const [kind, setKind] = useState("all");
  const [, setParams] = useSearchParams();

  const list = useMemo(
    () => (kind === "all" ? articlesList.filter((a) => a.kind !== "film") : articlesList.filter((a) => a.kind === kind)),
    [kind, articlesList]
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="mt-2 font-display text-[28px] leading-[1.15] text-ink">Read the registry</h2>
        </div>
        <AnimatedTabs id="kind" tabs={kindTabs} value={kind} onChange={setKind} />
      </div>
      <ol className="mt-8 divide-y divide-line border-y border-line">
        {list.map((a) => (
          <li key={a.slug}>
            <button onClick={() => setParams({ article: a.slug })} className="group flex w-full items-center gap-5 py-5 text-left">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-gold">
                {a.kind === "film" ? <Clapperboard className="size-4" /> : a.kind === "field-notes" ? <NotebookPen className="size-4" /> : <BookOpen className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-ink transition-colors group-hover:text-gold-strong">{a.title}</span>
                <span className="mt-1 block truncate text-[13px] text-ink3">{a.excerpt}</span>
              </span>
              <span className="hidden shrink-0 text-[13px] text-ink3 sm:block tnum">
                {a.readMinutes} min · {formatDate(a.date)}
              </span>
              <ArrowRight className="size-4 shrink-0 text-ink3 transition-all duration-180 group-hover:translate-x-0.5 group-hover:text-gold" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

function ArticleReader({ article, onBack }: { article: Article; onBack: () => void }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [article.slug]);

  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        The Folklore Hub
      </button>
      <p className="mt-8 text-[12.5px] font-medium  text-gold">
        {article.kind === "film" ? "Film notes" : article.kind === "field-notes" ? "Field notes" : "Essay"}
        {article.tradition && <span className="text-ink3"> · {article.tradition}</span>}
      </p>
      <h1 className="mt-3 font-display text-[34px] leading-[1.08] font-light tracking-[-0.01em] text-ink sm:text-[44px]">{article.title}</h1>
      <p className="mt-4 text-[13px] text-ink3">
        Registry desk · {formatDate(article.date)} · {article.readMinutes} min
      </p>
      {article.image ? (
        <ImageFrame src={article.image} alt={`Illustration for ${article.title}`} ratio="aspect-[16/9]" className="mt-8" eager />
      ) : (
        <div className="flame-divider mx-auto mt-8 w-40" aria-hidden="true" />
      )}
      <div className="mt-10 space-y-6">
        {article.body.map((p, i) => (
          <p
            key={i}
            className={cn(
              "text-[15.5px] leading-[1.85] text-ink2",
              i === 0 && "font-display text-lg leading-[1.7] font-light text-ink first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[52px] first-letter:leading-[0.9] first-letter:text-gold"
            )}
          >
            {p}
          </p>
        ))}
      </div>
      <div className="flame-divider mx-auto mt-12 w-40" aria-hidden="true" />
      <div className="mt-8 mb-4 flex justify-between gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          More from the hub
        </Button>
        {article.tradition && (
          <Link
            to={`/masks?tradition=${article.tradition}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-gold transition-colors hover:text-gold-strong"
          >
            Browse {article.tradition} masks
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
