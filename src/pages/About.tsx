import { ArrowRight, Coins, Fingerprint, Landmark, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/meta";
import { NumberTicker, Stagger, StaggerItem } from "@/components/ui/motion";
import { ProvenanceTimeline } from "@/components/ui/ProvenanceTimeline";
import { ImageFrame } from "@/components/ui/MaskImage";

const problems = [
  {
    stat: "60–70%",
    label: "Taken before the workshop",
    body: "The old chain — workshop, collector-runner, town shop, exporter, gallery — means the hands that carved the mask see the smallest share of its price.",
  },
  {
    stat: "9 in 10",
    label: "Tourist-shop masks never saw a tovil",
    body: "Router-cut boards dressed as heritage. Buyers can't tell; real makers are undercut; and the island's name for this craft slowly becomes a souvenir joke.",
  },
  {
    stat: "54 yrs",
    label: "Average carver age",
    body: "The masters are online only in theory. Marketplace sign-ups, chargebacks and crypto wallets were built for someone else entirely — so built again here, with them.",
  },
  {
    stat: "18 faces",
    label: "Of the Sanni cycle, ~9 fully remembered",
    body: "Knowledge below the watermark of the market simply evaporates. A registry that pays sculptors is also, quietly, an archive that keeps the faces.",
  },
];

const principles = [
  { icon: Fingerprint, title: "Name the maker", body: "Every listing, certificate and crate card carries the carver and the painter — both names, both stamps." },
  { icon: ShieldCheck, title: "Prove the piece", body: "Registry entry, minted certificate, scannable tag. One chain of custody from tree to wall." },
  { icon: Coins, title: "Pay first, fairly", body: "61% settles with the workshop within 14 days of order — before shipping costs are even tallied." },
];

const metrics = [
  { value: 52, suffix: "%", label: "Average income uplift vs. dealer prices" },
  { value: 191, suffix: "", label: "Verified, traceable masks in homes" },
  { value: 8, suffix: "", label: "Lineages earning through the registry" },
  { value: 96, suffix: "%", label: "Of patronage pledges reaching workshops" },
];

export default function About() {
  usePageMeta("Impact & mission", "Mask & Maker exists to end the middleman economy around Sri Lanka's mask-making — with a registry, a scan and a fair price.");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <header className="max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Impact &amp; mission</p>
        <h1 className="mt-3 font-display text-[40px] leading-[1.04] font-light tracking-[-0.02em] text-ink sm:text-[56px]">
          Sixty cents in the rupee
          <br />
          were never the carver's.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink2">
          For a century, Ambalangoda's masks travelled far and its makers profited little. Mask &amp; Maker is a registry and a
          marketplace built to change the arithmetic — and to keep the eighteen Sanni faces, the Kolam parliament and the Raksha
          guardians documented before the last rememberers are gone.
        </p>
      </header>

      <div className="flame-divider mx-auto mt-16 w-56" aria-hidden="true" />

      {/* the problem */}
      <section className="mt-16" aria-label="The problem">
        <h2 className="font-display text-[28px] text-ink">Four faults in the old trade</h2>
        <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p, i) => (
            <StaggerItem key={p.label}>
              <div className="edge h-full rounded-lg bg-s2 p-6">
                <p className="font-mono text-[11px] text-ink4 tnum">0{i + 1}</p>
                <p className="mt-4 font-mono text-[26px] leading-none text-gold tnum">{p.stat}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{p.label}</p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink2">{p.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* mission */}
      <section className="mt-24 grid items-center gap-12 lg:grid-cols-2" aria-label="The mission">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">The mission</p>
          <p className="mt-3 border-l-2 border-gold/50 pl-6 font-display text-[26px] leading-[1.35] font-light text-ink sm:text-[30px]">
            Make the honest face the easier one to buy. Then make the honest carver the obvious one to pay.
          </p>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink2">
            The toolset is unglamorous on purpose: a public registry, a tag on the reverse, photos and 3D studies buyers can
            interrogate, and settlement rules that favour the workshops. Technology stays in the plumbing; the craft stays at the front.
          </p>
          <ul className="mt-8 space-y-5">
            {principles.map((pr) => (
              <li key={pr.title} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-s1 text-gold">
                  <pr.icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{pr.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink2">{pr.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <ImageFrame src="/images/craft/carving.jpg" alt="Hands carving pale kaduru wood — first cuts of a Kolam face" ratio="aspect-[4/3.4]" />
          <p className="mt-3 font-mono text-[11px] tracking-wide text-ink4 tnum">Keteraya &amp; kaduru · Wathugedara bench</p>
        </div>
      </section>

      {/* metrics */}
      <section className="mt-24" aria-label="Impact to date">
        <div className="edge rounded-lg bg-s2 px-6 py-10 sm:px-10">
          <div className="mb-8 flex items-center gap-3">
            <Landmark className="size-4 text-gold" aria-hidden="true" />
            <h2 className="font-display text-xl text-ink">What the ledger says so far</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((s) => (
              <div key={s.label} className="border-l border-line pl-5">
                <p className="font-mono text-[34px] leading-none text-ink tnum">
                  <NumberTicker value={s.value} />
                  <span className="text-gold">{s.suffix}</span>
                </p>
                <p className="mt-2.5 text-[13px] leading-snug text-ink3">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* roadmap */}
      <section className="mt-24 grid gap-10 lg:grid-cols-5" aria-label="Roadmap">
        <div className="lg:col-span-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">The road</p>
          <h2 className="mt-2 font-display text-[26px] leading-tight text-ink">Done, doing, promised</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink2">
            We publish the roadmap in the same registry style as our certificates — each station dated, each promise checkable.
          </p>
        </div>
        <ProvenanceTimeline
          className="lg:col-span-3"
          steps={[
            { label: "Tea-shop agreement, Wathugedara", date: "Mar 2023", actor: "Three masters, one notebook", state: "done" },
            { label: "Registry & first 40 certificates", date: "Nov 2023", state: "done" },
            { label: "AR previews & 3D study programme", date: "Jun 2024", state: "done" },
            { label: "Island-wide settlement rails", date: "Now", actor: "PayHere & bank transfer, 14-day settlement", state: "current" },
            { label: "Collector wallet & transferable twins", state: "pending" },
            { label: "Museum digitisation loans", actor: "Masks scanned for national archives", state: "pending" },
          ]}
        />
      </section>

      {/* cta */}
      <section className="mt-24" aria-label="Closing">
        <div className="edge flex flex-col items-start justify-between gap-6 rounded-lg bg-gradient-to-b from-s2 to-s1 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-[24px] text-ink">Buy once. Verify forever. Credit the hands.</h2>
            <p className="mt-2 max-w-md text-sm text-ink2">
              Eighteen faces are waiting on the shelf — and if you carve, the portal was built at your bench height.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/masks" className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-5 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
              Explore the collection
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link to="/portal" className="inline-flex h-11 items-center rounded-lg border border-line bg-s2 px-5 text-sm font-medium text-ink transition-colors hover:bg-s3">
              I carve
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
