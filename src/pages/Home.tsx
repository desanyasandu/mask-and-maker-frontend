import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight, Eye, Globe2, Handshake, Palette, ScanLine, ShieldCheck, Sparkle } from "lucide-react";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { artisans, masks, articles } from "@/lib/mock/data";
import { usePageMeta } from "@/lib/meta";
import { formatDate, formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { NumberTicker, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { MaskArtwork } from "@/components/ui/MaskImage";
import { SpotlightCard } from "@/components/ui/surfaces";
import { ImageFrame } from "@/components/ui/MaskImage";

/* ------------------------------------------------ magnetic CTA --- */

function Magnetic({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 14, mass: 0.4 });

  const onMove = (e: MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.16);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.22);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ x: sx, y: sy }} className="inline-block">
      {children}
    </motion.span>
  );
}

/* ------------------------------------------------ sections ------- */

function SectionHead({ overline, title, href, hrefLabel }: { overline: string; title: string; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">{overline}</p>
        <h2 className="mt-2 font-display text-[28px] leading-[1.15] tracking-[-0.01em] text-ink sm:text-[34px]">{title}</h2>
      </div>
      {href && (
        <Link to={href} className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-ink2 transition-colors hover:text-gold-strong sm:inline-flex">
          {hrefLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

const trust = [
  { icon: ShieldCheck, title: "Authentic", body: "Every piece leaves the workshop with a minted certificate." },
  { icon: Handshake, title: "Artisan-direct", body: "61% of the price reaches the hands that carved it." },
  { icon: ScanLine, title: "Provenance-verified", body: "Registry records scannable from the card on its back." },
  { icon: Globe2, title: "Ships worldwide", body: "Export papers handled; insured, tracked, signed-for." },
];

const steps = [
  {
    n: "01",
    icon: Eye,
    title: "Discover",
    body: "Browse a living registry — Raksha guardians, the eighteen Sanni, Kolam's comic parliament. Every piece names its maker and its tree.",
  },
  {
    n: "02",
    icon: ScanLine,
    title: "Preview on your wall",
    body: "Life-size AR straight from your phone. See how a 58 cm Naga Raksha sits above the sideboard before you commit.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Verify authenticity",
    body: "Scan the tag on the back any time — before you pay, and for decades after. The certificate travels with the mask.",
  },
];

const impactStats = [
  { value: 52, suffix: "%", label: "More income to artisans than dealer sales" },
  { value: 191, suffix: "", label: "Verified masks on the registry" },
  { value: 8, suffix: "", label: "Carving lineages represented" },
  { value: 14, suffix: "", label: "Countries reached, zero pieces copied" },
];

export default function Home() {
  const currency = useApp((s) => s.currency);
  usePageMeta("Digital heritage, made by hand", "Hand-carved Kaduru wood masks from Ambalangoda's master artisans. Verified provenance, artisan-direct pricing, AR previews.");

  const heroMask = masks.find((m) => m.slug === "naga-raja-kolam")!;
  const featured = masks.filter((m) => m.featured);
  const sirisena = artisans[0];
  const teaserArticles = articles.slice(0, 3);

  return (
    <>
      {/* ---------------------------------------------- HERO */}
      <section className="grain relative overflow-hidden" aria-label="Introduction">
        <div
          className="pointer-events-none absolute -top-40 right-[8%] h-[560px] w-[560px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--gold) 16%, transparent), transparent 62%)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-8 lg:pt-20 lg:pb-24">
          <Stagger className="lg:col-span-7">
            <StaggerItem>
              <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-gold">
                <Sparkle className="size-3.5" aria-hidden="true" />
                A curated registry · southern Sri Lanka
              </p>
            </StaggerItem>
            <StaggerItem>
              <h1 className="mt-5 font-display text-[44px] leading-[1.04] font-light tracking-[-0.02em] text-ink sm:text-[60px] lg:text-[68px]">
                The carved face of a
                <br />
                <em className="text-gold-strong">living tradition.</em>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-6 max-w-md text-base leading-relaxed text-ink2">
                Raksha guardians, healing Sanni demons, the laughing faces of the Kolam — hand-carved in Kaduru wood by
                Ambalangoda's masters, with provenance kept in code and prices kept honest.
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <Link
                    to="/masks"
                    className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-6 text-[15px] font-medium text-[#16120A] shadow-[0_1px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-100 hover:bg-gold-strong active:scale-[0.98]"
                  >
                    Explore the collection
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Magnetic>
                <Link
                  to="/artisans"
                  className="inline-flex h-12 items-center rounded-lg px-5 text-[15px] font-medium text-ink2 transition-colors duration-180 hover:text-gold-strong"
                >
                  Meet the makers
                </Link>
              </div>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-9 font-mono text-[11px] tracking-wide text-ink4 tnum">
                18 masks &nbsp;·&nbsp; 8 lineages &nbsp;·&nbsp; 0 middlemen
              </p>
            </StaggerItem>
          </Stagger>

          <Reveal className="lg:col-span-5" delay={0.15}>
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              {/* the one gold frame of this screen */}
              <div className="gold-frame relative overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ rotate: [0, 0.6, 0, -0.6, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ImageFrame
                    src={heroMask.image}
                    alt={`${heroMask.name} — hero piece, carved by Sirisena Apuhamy`}
                    ratio="aspect-[4/5]"
                    className="rounded-none"
                    eager
                  />
                </motion.div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas/85 via-transparent to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <div>
                    <p className="font-display text-lg leading-tight text-ink">{heroMask.name}</p>
                    <p className="mt-0.5 text-xs text-ink2">
                      Sirisena Apuhamy · <span className="font-sinhala">{heroMask.sinhala}</span>
                    </p>
                  </div>
                  <span className="font-mono text-[13px] text-gold tnum">{formatMoney(heroMask.priceLKR, currency)}</span>
                </div>
              </div>
              <Link
                to={`/masks/${heroMask.slug}`}
                className="absolute -right-2 -bottom-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-s1/95 px-3 py-2 text-xs font-medium text-ink2 shadow-lg backdrop-blur transition-colors hover:text-gold-strong sm:-right-4"
              >
                This month's signature piece
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------- TRUST STRIP */}
      <section className="border-y border-line bg-s1/60" aria-label="Assurances">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {trust.map((t) => (
            <div key={t.title} className="flex items-start gap-3.5 px-6 py-6 lg:py-7">
              <t.icon className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-ink3">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------- FEATURED BENTO */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-label="Featured pieces">
        <SectionHead overline="This month's registry" title="Pieces the workshops are proudest of" href="/masks" hrefLabel="See all 18" />
        <Stagger className="grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((m, i) => (
            <StaggerItem key={m.slug} className={i === 0 ? "col-span-2 row-span-2" : ""}>
              <SpotlightCard className="h-full">
                <Link to={`/masks/${m.slug}`} className="group block h-full" aria-label={`View ${m.name}`}>
                  <div className={cn(i === 0 ? "aspect-square sm:aspect-[1/1.08]" : "aspect-[4/3.1]", "relative h-full w-full overflow-hidden rounded-lg")}>
                    <div className="absolute inset-0 transition-transform duration-600 ease-out group-hover:scale-[1.03]">
                      <MaskArtwork mask={m} ratio="" className="h-full rounded-lg" eager={i < 2} />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas/85 via-canvas/10 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className={cn("truncate font-display text-ink", i === 0 ? "text-xl" : "text-base")}>{m.name}</p>
                        <p className="mt-0.5 truncate text-xs text-ink2">{m.region} · {m.year}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[13px] text-gold tnum">{formatMoney(m.priceLKR, currency)}</span>
                    </div>
                  </div>
                </Link>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ---------------------------------------------- HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-label="How it works">
        <SectionHead overline="How it works" title="From the workshop floor to your wall" />
        <Stagger className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <StaggerItem key={s.n}>
              <div className="edge h-full rounded-lg bg-s2 p-6">
                <div className="flex items-center justify-between">
                  <s.icon className="size-5 text-gold" aria-hidden="true" />
                  <span className="font-mono text-xs text-ink4 tnum">{s.n}</span>
                </div>
                <h3 className="mt-5 font-display text-lg text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink2">{s.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ---------------------------------------------- ARTISAN SPOTLIGHT */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-label="Maker spotlight">
        <div className="edge overflow-hidden rounded-lg bg-s1">
          <div className="grid lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <ImageFrame
                src={sirisena.photo}
                alt={`${sirisena.name}, master carver, in his Wathugedara workshop`}
                ratio=""
                className="h-72 w-full rounded-none lg:h-full"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-s1 via-transparent to-transparent lg:bg-gradient-to-r" aria-hidden="true" />
            </div>
            <div className="p-8 sm:p-10 lg:col-span-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Maker spotlight</p>
              <h2 className="mt-2 font-display text-[28px] leading-tight text-ink sm:text-[34px]">
                {sirisena.name} <span className="font-sinhala text-[0.62em] text-ink2">· {sirisena.sinhalaName}</span>
              </h2>
              <p className="mt-1 text-sm text-ink3">{sirisena.role} · {sirisena.village}</p>
              <blockquote className="mt-6 border-l-2 border-gold/40 pl-5 font-display text-lg leading-relaxed font-light text-ink2 italic sm:text-xl">
                “My father said the wood will tell you what it wants to be. First you must earn the right to listen.”
              </blockquote>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink2">
                Fourth-generation master of the Sanni faces. Ninety-day-rested timber, nine-wash pigment grounds, and a
                workshop his great-grandfather opened before the railway reached Ambalangoda.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
                {[
                  ["Carving since", String(sirisena.since)],
                  ["Pieces fulfilled", String(sirisena.ordersFulfilled)],
                  ["Collector rating", `${sirisena.rating} / 5`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-ink4">{k}</p>
                    <p className="mt-0.5 font-mono text-[15px] text-ink tnum">{v}</p>
                  </div>
                ))}
              </div>
              <Link
                to={`/artisans/${sirisena.slug}`}
                className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold-strong"
              >
                Visit the workshop
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- FOLKLORE TEASER */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-label="Folklore hub preview">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-vermilion">
              <Palette className="size-3.5" aria-hidden="true" />
              The Folklore Hub
            </p>
            <h2 className="mt-2 font-display text-[28px] leading-[1.15] tracking-[-0.01em] text-ink sm:text-[34px]">
              Every mask arrived with a story attached. We keep those, too.
            </h2>
            <ul className="mt-7 divide-y divide-line border-y border-line">
              {teaserArticles.map((a) => (
                <li key={a.slug}>
                  <Link to={`/heritage?article=${a.slug}`} className="group flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-ink transition-colors group-hover:text-gold-strong">{a.title}</p>
                      <p className="mt-0.5 text-xs text-ink3">
                        {a.kind === "film" ? "Film" : "Essay"} · {a.readMinutes} min · {formatDate(a.date)}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-ink4 transition-all duration-180 group-hover:translate-x-0.5 group-hover:text-gold" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/heritage" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold-strong">
              Enter the hub
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative">
            <ImageFrame src="/images/heritage/ritual.jpg" alt="Torch-lit tovil ceremony at night, masked dancer mid-turn" ratio="aspect-[16/11]" />
            <p className="mt-3 text-right font-mono text-[11px] tracking-wide text-ink4 tnum">Tovil grounds · Wathugedara · 03:14 a.m.</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- IMPACT */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-label="Impact">
        <div className="edge rounded-lg bg-s2 px-6 py-10 sm:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {impactStats.map((s) => (
              <div key={s.label} className="border-l border-line pl-5">
                <p className="font-mono text-[34px] leading-none text-ink tnum">
                  <NumberTicker value={s.value} />
                  <span className="text-gold">{s.suffix}</span>
                </p>
                <p className="mt-2.5 max-w-[190px] text-[13px] leading-snug text-ink3">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-9 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
            <p className="text-sm text-ink2">
              Sixty-one percent of every sale is settled with the workshop within 14 days — before shipping, before anything else.
            </p>
            <Link to="/about" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold-strong">
              Read the mission
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
