import { Component, type ErrorInfo, type ReactNode } from "react";
import { ArrowLeft, Drama, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { ArchivePlate } from "@/components/ui/MaskImage";
import { usePageMeta } from "@/lib/meta";

/* ---------------- 404 ---------------- */

export function NotFound() {
  usePageMeta("Not found");
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-24 pb-10 text-center sm:px-6">
      <div className="w-40">
        <ArchivePlate seed={404} variant={1} tradition="kolam" className="aspect-[4/5] rounded-lg" />
      </div>
      <p className="mt-8 font-display text-[64px] leading-none font-light text-ink4">404</p>
      <h1 className="mt-3 font-display text-2xl text-ink">This wall bears no face</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink2">
        The page has moved, sold, or never left the workshop. Search the registry — <kbd className="kbd">⌘K</kbd> — or walk back
        to a well-lit room.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Home
        </Link>
        <Link to="/masks" className="inline-flex h-10 items-center rounded-lg border border-line bg-s2 px-4 text-sm font-medium text-ink transition-colors hover:bg-s3">
          The collection
        </Link>
      </div>
    </div>
  );
}

/* ---------------- route loading ---------------- */

export function RouteLoading() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-label="Loading page">
      <div className="flex flex-col items-center gap-3">
        <span className="size-9 animate-spin rounded-full border-2 border-line border-t-gold" aria-hidden="true" />
        <span className="text-xs text-ink3">Unwrapping the crate…</span>
      </div>
    </div>
  );
}

/* ---------------- error boundary ---------------- */

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Mask & Maker boundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 pt-28 pb-16 text-center">
          <span className="grid size-14 place-items-center rounded-full border border-danger/40 bg-danger/10">
            <Drama className="size-6 text-danger" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-display text-2xl text-ink">The shelf gave way</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink2">
            Something in this page broke; the registry itself is untouched. Reload — and if it breaks twice, it is our fault, not yours.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-7 inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reload the page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------------- legal stubs ---------------- */

const legal: Record<string, { title: string; updated: string; sections: [string, string[]][] }> = {
  privacy: {
    title: "Privacy, in plain terms",
    updated: "January 2026",
    sections: [
      ["What we keep", ["Your crate, wishlist and currency live on your device. Orders and claimed certificates live in the registry, under your name.", "Nothing follows you elsewhere: no advertising identifiers, no cross-site trackers."]],
      ["What we never do", ["Sell or lend your address, your purchases, or your photographs of masks to anyone.", "The verification page is deliberately anonymous — checking a certificate should never identify you."]],
      ["Pilot note", ["This storefront is a demonstration build. Full legal text ships with the pilot's first cohort."]],
    ],
  },
  terms: {
    title: "Terms of trade",
    updated: "January 2026",
    sections: [
      ["Honest objects", ["Every piece is hand-carved from Kaduru by the named maker. Grain, tool-marks and pigment variation are the point, not defects."]],
      ["Settlement & returns", ["61% of each sale settles with the workshop within 14 days. If a piece arrives damaged, we collect, repair or replace — the maths is ours to carry, not the carver's.", "Because each piece is one of one, change-of-mind returns run 14 days, registry tag unbroken."]],
      ["Certificates", ["Certificates are authenticity records, not investment instruments, and confer no rights beyond the registry's own records."]],
    ],
  },
  shipping: {
    title: "Shipping & care",
    updated: "January 2026",
    sections: [
      ["Dispatch", ["Crated at the workshop within three days of order; DHL Express or FedEx worldwide, signed for, insured. Export papers are handled by us."]],
      ["Care", ["Dust with a dry brush. Never oil, never varnish, never leave in direct sun — natural pigments shift.", "If a hood-tip cracks in ten years, scan the tag: the registry knows the maker, and repair routes back to the workshop."]],
    ],
  },
};

export function LegalPage({ doc }: { doc: keyof typeof legal }) {
  const l = legal[doc];
  usePageMeta(l.title);
  return (
    <div className="mx-auto max-w-2xl px-4 pt-14 pb-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">House rules</p>
      <h1 className="mt-2 font-display text-[34px] text-ink">{l.title}</h1>
      <p className="mt-2 font-mono text-xs text-ink4 tnum">Last revised {l.updated}</p>
      <div className="mt-9 space-y-9">
        {l.sections.map(([h, paras]) => (
          <section key={h}>
            <h2 className="font-display text-lg text-ink">{h}</h2>
            {paras.map((p) => (
              <p key={p} className="mt-2.5 text-sm leading-relaxed text-ink2">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
