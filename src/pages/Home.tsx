import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import type { Article, Artisan, Mask } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { NumberTicker, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { MaskArtwork } from "@/components/ui/MaskImage";
import { SpotlightCard } from "@/components/ui/surfaces";
import { ImageFrame } from "@/components/ui/MaskImage";
import { FlameBand } from "@/components/art";
import { Marquee } from "@/components/ui/Marquee";
import { craftHands, photos } from "@/lib/photos";
import { ButtonLink } from "@/components/ui/kit";

/* ------------------------------------------------ sections ------- */

function SectionHead({ title, href, hrefLabel }: { title: string; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <div>
        <h2 className="font-display text-[32px] leading-[1.1] tracking-[-0.015em] text-ink sm:text-[46px]">{title}</h2>
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
  { title: "Authentic", body: "Every piece leaves the workshop with a minted certificate." },
  { title: "Artisan-direct", body: "61% of the price reaches the hands that carved it." },
  { title: "Provenance-verified", body: "Registry records scannable from the card on its back." },
  { title: "Ships worldwide", body: "Export papers handled; insured, tracked, signed-for." },
];

const steps = [
  {
    photo: photos.masksWall,
    title: "Find the face you keep thinking about",
    body: "Browse a living registry — Raksha guardians, the eighteen Sanni, Kolam’s comic parliament. Every piece names its maker and its tree.",
    to: "/masks",
    cta: "Open the collection",
  },
  {
    photo: photos.masksWall2,
    title: "Hold it against your own wall",
    body: "Life-size AR straight from your phone. See how a 58 cm Naga Raksha sits above the sideboard before you commit.",
    to: "/masks/naga-raksha",
    cta: "Try it on a mask",
  },
  {
    photo: craftHands,
    title: "Scan the back, read its whole life",
    body: "Scan the tag any time — before you pay, and for decades after. The certificate travels with the mask.",
    to: "/verify",
    cta: "See a live certificate",
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

  const [heroMask, setHeroMask] = useState<Mask | null>(null);
  const [featured, setFeatured] = useState<Mask[]>([]);
  const [sirisena, setSirisena] = useState<Artisan | null>(null);
  const [teaserArticles, setTeaserArticles] = useState<Article[]>([]);

  useEffect(() => {
    api.getMask("naga-raja-kolam").then((m) => m && setHeroMask(m)).catch(() => {});
    api.featuredMasks().then((f) => f && f.length && setFeatured(f)).catch(() => {});
    api.listArtisans().then((a) => a && a.length && setSirisena(a[0])).catch(() => {});
    api.listArticles().then((art) => art && art.length && setTeaserArticles(art.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <>
      {/* ---------------------------------------------- HERO
          The Naga Raja's story is the idea: its twin hoods are carved from one plank,
          so the object is shown larger than the screen and the headline says why. */}
      <section aria-label="Introduction" className="relative">
        <div className="grid lg:min-h-[calc(100svh-5.5rem)] lg:grid-cols-[7fr_5fr]">
          <div className="flex flex-col px-4 pt-8 pb-10 sm:px-6 lg:pt-16 lg:pr-14 lg:pb-14 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]">
            <Stagger className="my-auto">
              <StaggerItem>
                <h1 className="font-display text-[42px] leading-[1] font-light tracking-[-0.03em] text-balance text-ink sm:text-[64px] lg:text-[clamp(56px,6vw,100px)]">
                  Carved from one plank of Kaduru.
                </h1>
              </StaggerItem>
              <StaggerItem>
                <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-ink sm:mt-7 sm:text-lg">
                  Hand-carved masks from Ambalangoda, each one with its maker, its wood and its certificate on record.
                </p>
              </StaggerItem>
              <StaggerItem>
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-9">
                  <ButtonLink to="/masks" arrow size="lg">Browse the collection</ButtonLink>
                  <Link to="/artisans" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-ink underline decoration-gold/50 underline-offset-[6px] transition-colors hover:text-gold-strong hover:decoration-gold">
                    Meet the makers
                  </Link>
                </div>
              </StaggerItem>
            </Stagger>

            <Reveal className="mt-10 lg:mt-12" delay={0.2}>
              <p className="text-[15px] text-ink2">Eighteen masks, eight lineages, no middlemen.</p>
              <Link to="/heritage" className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-gold transition-colors hover:text-gold-strong">
                How a mask is made and danced
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <Reveal className="relative min-h-[520px] sm:min-h-[640px] lg:min-h-0" delay={0.1}>
            <div className="absolute inset-0 overflow-hidden bg-s1">
              {heroMask && (
                <div className="absolute inset-0 animate-ken">
                  <ImageFrame
                    src={heroMask.image}
                    alt={`${heroMask.name}, a cobra-king Kolam mask carved by Sirisena Apuhamy, its six hoods rising from a painted crown`}
                    ratio=""
                    className="absolute inset-0 rounded-none ring-0"
                    position="50% 30%"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    eager
                  />
                </div>
              )}
            </div>
            {heroMask && (
              <Link
                to={`/masks/${heroMask.slug}`}
                className="group absolute bottom-0 left-0 flex max-w-[calc(100%-1rem)] items-end gap-6 bg-canvas py-5 pr-6 pl-4 transition-colors hover:bg-s1 sm:pr-8 sm:pl-6 lg:py-6 lg:pr-10"
                aria-label={`View ${heroMask.name}, this month's signature piece`}
              >
                <span>
                  <span className="block font-display text-2xl leading-tight text-ink sm:text-[28px]">{heroMask.name} <span className="font-sinhala text-base text-ink2">{heroMask.sinhala}</span></span>
                  <span className="mt-1 block text-sm text-ink2">
                    Carved by Sirisena Apuhamy in {heroMask.carvingDays} days
                  </span>
                </span>
                <span className="shrink-0 pb-0.5 text-right">
                  <span className="block text-base font-medium text-ink tnum">{formatMoney(heroMask.priceLKR, currency)}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-gold transition-colors group-hover:text-gold-strong">
                    View <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            )}
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------- TICKER */}
      <Marquee
        label="Raksha guardians, Sanni healers, Kolam theatre, Kaduru wood, natural pigments, verified provenance"
        items={["Raksha guardians", "Sanni healers", "Kolam theatre", "Carved in Kaduru", "Natural pigments", "Verified provenance", "Made in Ambalangoda"]}
        className="border-t border-line py-7"
      />

      {/* ---------------------------------------------- TRUST STRIP */}
      <section aria-label="Assurances">
        <FlameBand tall />
        <div className="mx-auto grid max-w-7xl gap-x-10 gap-y-6 px-4 py-9 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {trust.map((t) => (
            <div key={t.title}>
              <p className="font-display text-lg text-ink">{t.title}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink2">{t.body}</p>
            </div>
          ))}
        </div>
        <FlameBand tall />
      </section>

      <div data-band="alt" className="mt-24">
      {/* ---------------------------------------------- FEATURED BENTO */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6" aria-label="Featured pieces">
        <SectionHead title="Pieces the workshops are proudest of" href="/masks" hrefLabel="See all 18" />
        <Stagger className="grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((m, i) => (
            <StaggerItem key={m.slug} className={i === 0 ? "col-span-2 row-span-2" : ""}>
              <SpotlightCard className="h-full">
                <Link to={`/masks/${m.slug}`} className="group block h-full" aria-label={`View ${m.name}`}>
                  <div className={cn(i === 0 ? "aspect-square sm:aspect-[1/1.08]" : "min-h-[220px]", "relative h-full w-full overflow-hidden rounded-lg")}>
                    <div className="absolute inset-0 transition-transform duration-600 ease-out group-hover:scale-[1.03]">
                      <MaskArtwork mask={m} ratio="" className="h-full rounded-lg" eager={i < 2} />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className={cn("truncate font-display text-white", i === 0 ? "text-xl" : "text-base")}>{m.name}</p>
                        <p className="mt-0.5 truncate text-xs text-white/80">{m.region} · {m.year}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[13px] text-[#ddb983] tnum">{formatMoney(m.priceLKR, currency)}</span>
                    </div>
                  </div>
                </Link>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      </div>

      {/* ---------------------------------------------- HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-label="How it works">
        <SectionHead title="From the workshop floor to your wall" />
        <div className="space-y-6 lg:space-y-10">
          {steps.map((st, i) => (
            <Reveal key={st.title}>
              <div className="grid items-center gap-6 rounded-lg bg-s2 p-4 sm:p-6 lg:grid-cols-12 lg:gap-12 lg:p-8">
                <figure className={cn("lg:col-span-6", i % 2 === 1 && "lg:order-2")}>
                  <ImageFrame src={st.photo.src} alt={st.photo.alt} ratio="aspect-[3/2]" position={st.photo.position} className="rounded-lg" />
                  <figcaption className="mt-2 text-[13px] text-ink3">{st.photo.caption}</figcaption>
                </figure>
                <div className={cn("lg:col-span-6", i % 2 === 1 ? "lg:order-1 lg:pl-6" : "lg:pr-6")}>
                  <h3 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">{st.title}</h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink2">{st.body}</p>
                  <Link to={st.to} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold-strong">
                    {st.cta}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div data-band="alt" className="mt-24 pb-24">
      {/* ---------------------------------------------- ARTISAN SPOTLIGHT */}
      {sirisena && (
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
              <h2 className="mt-2 font-display text-[32px] leading-tight text-ink sm:text-[44px]">
                {sirisena.name} <span className="font-sinhala text-[0.62em] text-ink2">· {sirisena.sinhalaName}</span>
              </h2>
              <p className="mt-1 text-sm text-ink3">{sirisena.role} · {sirisena.village}</p>
              <blockquote className="mt-6 font-display text-lg leading-relaxed font-light text-ink2 italic sm:text-xl">
                “My father said the wood will tell you what it wants to be. First you must earn the right to listen.”
              </blockquote>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink2">
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
                    <p className="text-[12.5px]  text-ink3">{k}</p>
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
      )}

      {/* ---------------------------------------------- FOLKLORE TEASER */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-label="Folklore hub preview">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[32px] leading-[1.1] tracking-[-0.015em] text-ink sm:text-[46px]">
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
                    <ArrowRight className="size-4 shrink-0 text-ink3 transition-all duration-180 group-hover:translate-x-0.5 group-hover:text-gold" aria-hidden="true" />
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
            <p className="mt-3 text-right text-[13px] text-ink3">Tovil grounds · Wathugedara · 03:14 a.m.</p>
          </div>
        </div>
      </section>

      </div>

      {/* ---------------------------------------------- IMPACT */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-label="Impact">
        <div className="grid items-center gap-10 rounded-lg bg-s2 p-6 sm:p-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <h2 className="max-w-lg font-display text-[32px] leading-[1.1] tracking-[-0.015em] text-ink sm:text-[46px]">
              Eight lineages along one stretch of coast
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink2">
              Sixty-one percent of every sale is settled with the workshop within 14 days — before shipping, before anything else.
            </p>
            <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {impactStats.map((s) => (
                <div key={s.label} className="flex items-baseline gap-3">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="shrink-0 font-display text-[40px] leading-none font-light text-ink tnum">
                    <NumberTicker value={s.value} className="font-display" />
                    <span className="text-gold">{s.suffix}</span>
                  </dd>
                  <dd className="text-[13.5px] leading-snug text-ink3" aria-hidden="true">{s.label}</dd>
                </div>
              ))}
            </dl>
            <Link to="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold-strong">
              Read the mission
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <figure className="mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
            <ImageFrame src={photos.ceylonMap.src} alt={photos.ceylonMap.alt} ratio="aspect-[4/3]" className="rounded-lg" />
            <figcaption className="mt-2 text-center text-[13px] text-ink3">{photos.ceylonMap.caption}. Ambalangoda sits on the south-west coast.</figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
