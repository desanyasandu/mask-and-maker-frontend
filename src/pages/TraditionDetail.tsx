import { ArrowLeft, ArrowRight, Drama } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { traditions } from "@/lib/mock/data";
import { usePageMeta } from "@/lib/meta";
import type { Mask } from "@/lib/types";
import { cn } from "@/utils/cn";
import { MaskCard, TraditionTag } from "@/components/MaskCard";
import { EmptyState, Skeleton } from "@/components/ui/kit";

const washColor: Record<string, string> = {
  vermilion: "var(--vermilion)",
  forest: "var(--forest)",
  gold: "var(--gold)",
};

export default function TraditionDetail() {
  const { tradition = "" } = useParams();
  const doc = traditions.find((t) => t.slug === tradition);
  const [list, setList] = useState<Mask[] | null>(null);

  usePageMeta(doc ? `${doc.name} tradition` : "Tradition");

  useEffect(() => {
    setList(null);
    if (!doc) return;
    api.listMasks({ tradition: doc.slug }).then(setList);
  }, [doc]);

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
        <EmptyState icon={Drama} title="No such tradition" body="The island keeps three. They are Raksha, Sanni and Kolam — and they are a scroll away.">
          <Link to="/heritage" className="inline-flex h-10 items-center rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
            Back to the hub
          </Link>
        </EmptyState>
      </div>
    );
  }

  const wash = washColor[doc.marker];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <Link to="/heritage" className="inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        The Folklore Hub
      </Link>

      {/* editorial header with the tradition's one ornamented band */}
      <header className="relative mt-8 overflow-hidden rounded-lg">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(90% 130% at 12% 0%, color-mix(in oklab, ${wash} 14%, transparent), transparent 55%)` }}
          aria-hidden="true"
        />
        <div className="relative p-8 sm:p-12">
          <TraditionTag tradition={doc.slug} />
          <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-4">
            <h1 className="font-display text-[44px] leading-none font-light tracking-[-0.02em] text-ink sm:text-[60px]">{doc.name}</h1>
            <span className="font-sinhala pb-2 text-2xl text-ink3">{doc.sinhala}</span>
          </div>
          <p className="mt-3 max-w-xl font-display text-lg text-gold/90 italic">{doc.tagline}</p>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink2">{doc.description}</p>
          <div className="mt-6 flex gap-2" aria-label="Traditional palette">
            {doc.palette.map((c) => (
              <span key={c} className="size-6 rounded-md border border-line" style={{ background: c }} />
            ))}
            <span className="ml-2 self-center font-mono text-[11px] text-ink4 tnum">the working palette</span>
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-label="Ritual significance" className="edge rounded-lg bg-s1 p-7">
          <h2 className="font-display text-[20px] text-ink">Where it lives in the ritual</h2>
          <ol className="mt-5 space-y-4">
            {doc.ritual.map((r, i) => (
              <li key={r} className="flex gap-4">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-gold/40 font-mono text-[10px] text-gold tnum">{i + 1}</span>
                <p className="text-sm leading-relaxed text-ink2">{r}</p>
              </li>
            ))}
          </ol>
        </section>
        <section aria-label="The faces" className="edge rounded-lg bg-s1 p-7">
          <h2 className="font-display text-[20px] text-ink">The faces you'll meet</h2>
          <ul className="mt-5 space-y-3">
            {doc.examples.map((e) => (
              <li key={e} className="flex items-baseline gap-3 text-sm text-ink2">
                <span className="size-1 shrink-0 rounded-full" style={{ background: wash }} aria-hidden="true" />
                {e}
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-ink3">
            Names vary by village; a carver in Mirissa and a carver in Elpitiya will argue the taxonomy over tea and both be right.
          </p>
        </section>
      </div>

      <section className="mt-14" aria-label="Registry pieces in this tradition">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-[26px] text-ink">In the registry now</h2>
          <Link to={`/masks?tradition=${doc.slug}`} className={cn("inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-strong")}>
            Open in the marketplace
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {!list ? (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5.4]" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {list.map((m) => (
              <MaskCard key={m.slug} mask={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
