import { BadgeCheck, Boxes, Camera, Check, Drama, HandCoins, Languages, Loader2, MapPin, ScanLine, TrendingUp, Upload, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { artisans, masks } from "@/lib/mock/data";
import { usePageMeta } from "@/lib/meta";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { EmptyState } from "@/components/ui/kit";
import { NumberTicker } from "@/components/ui/motion";
import { AnimatedTabs, BorderBeam, VerifiedSeal } from "@/components/ui/surfaces";
import { ProvenanceTimeline } from "@/components/ui/ProvenanceTimeline";

type Role = "buyer" | "artisan" | "verifier" | "admin";
const roles: { id: Role; label: string }[] = [
  { id: "buyer", label: "Buyer" },
  { id: "artisan", label: "Artisan" },
  { id: "verifier", label: "Heritage verifier" },
  { id: "admin", label: "Admin" },
];

const artisan = artisans.find((a) => a.slug === "chandana-bandara")!;

export default function Portal() {
  usePageMeta("Artisan portal");
  const [role, setRole] = useState<Role>("artisan");
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      {/* dev role banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/30 bg-gold/[0.06] px-4 py-3">
        <p className="font-mono text-[11px] tracking-wide text-gold tnum">PREVIEW BUILD · the portal is mocked end-to-end</p>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-s1 p-0.5" role="group" aria-label="Preview as role">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              aria-pressed={role === r.id}
              className={cn("h-7 rounded-md px-2.5 text-[12px] font-medium transition-colors duration-180", role === r.id ? "bg-s3 text-gold" : "text-ink3 hover:text-ink2")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {role !== "artisan" ? (
        <div className="mt-8">
          <EmptyState
            icon={HandCoins}
            title={`The ${roles.find((r) => r.id === role)?.label} desk opens with the pilot`}
            body="This portal is designed with and for the carving workshops first — switch back to the artisan persona to walk the whole flow. Registry staff tooling ships after the second village cohort."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Artisan portal</p>
              <h1 className="mt-2 font-display text-[30px] leading-tight text-ink">
                Ayubowan, {artisan.name.split(" ")[0]}
                <span className="ml-3 font-sinhala text-[0.6em] text-ink3">ආයුබෝවන්</span>
              </h1>
            </div>
            <AnimatedTabs
              id="portal"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "dashboard", label: "Workshop desk" },
                { id: "listing", label: "New listing" },
                { id: "onboarding", label: "Onboarding" },
              ]}
            />
          </div>

          {tab === "onboarding" && <Onboarding />}
          {tab === "dashboard" && <Dashboard goListing={() => setTab("listing")} />}
          {tab === "listing" && <ListingFlow />}
        </>
      )}
    </div>
  );
}

/* ---------------- onboarding wizard (low-literacy first) ------------- */

const langCopy = {
  en: { welcome: "Welcome to the registry", next: "Continue", back: "Back", finish: "Join the registry" },
  si: { welcome: "උපසිරැසියට සාදරයෙන්", next: "ඊළඟට", back: "ආපසු", finish: "ලැඛිස්තුවට එකතු වන්න" },
  ta: { welcome: "பதிவேற்றுக்கு வரவேற்கிறோம்", next: "தொடரவும்", back: "பின்", finish: "சேரவும்" },
} as const;
type Lang = keyof typeof langCopy;

const onboardingSteps = [
  { icon: Languages, title: "Your language", note: "The portal speaks English, සිංහල and தமிழ் — pick whichever reads like home." },
  { icon: MapPin, title: "Your village", note: "Provenance starts with a pin. Wathugedara is not Ambalangoda, and the certificate knows it." },
  { icon: Drama, title: "Your tradition", note: "Raksha, Sanni or Kolam — the heritage desk inscribes the correct ritual notes for each." },
  { icon: Camera, title: "First photograph", note: "One clear photo against a plain wall. The studio re-shoots it properly at the first scan visit." },
  { icon: BadgeCheck, title: "Signed & sealed", note: "Your maker's stamp is created. Every certificate from your bench carries it from now on." },
];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Lang>("en");
  const toast = useApp((s) => s.toast);
  const copy = langCopy[lang];

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
      <ol className="space-y-1.5">
        {onboardingSteps.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "pending";
          return (
            <li key={s.title}>
              <button
                onClick={() => setStep(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors duration-180",
                  state === "current" ? "border-gold/50 bg-gold/10" : state === "done" ? "border-line bg-s2" : "border-line bg-s1 opacity-60"
                )}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg", state === "current" ? "bg-gold text-[#16120A]" : "bg-s2 text-ink3")}>
                  {state === "done" ? <Check className="size-5" /> : <s.icon className="size-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{s.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink3">{onboardingSteps[i].note}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="edge flex min-h-80 flex-col rounded-lg bg-s1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-xs text-ink4 tnum">Step {step + 1} / {onboardingSteps.length}</span>
          <div className="flex gap-1" role="group" aria-label="Interface language">
            {(["en", "si", "ta"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={cn("rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors", lang === l ? "border-gold/50 text-gold" : "border-line text-ink3 hover:text-ink2")}
              >
                {l === "en" ? "EN" : l === "si" ? "සිං" : "த"}
              </button>
            ))}
          </div>
        </div>

        <h2 className={cn("font-display text-[26px] text-ink", lang !== "en" && "font-sinhala")}>{step === 0 ? copy.welcome : onboardingSteps[step].title}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink2">{onboardingSteps[step].note}</p>

        {step === 1 && (
          <div className="mt-6 grid max-w-md grid-cols-2 gap-2.5">
            {["Ambalangoda", "Wathugedara", "Balapitiya", "Meetiyagoda"].map((v) => (
              <button
                key={v}
                onClick={() => toast(`${v} it is`, { description: "Saved to your maker profile.", kind: "success" })}
                className="rounded-lg border border-line bg-s2 px-4 py-5 text-left text-sm font-medium text-ink transition-colors hover:border-gold/40 hover:bg-s3"
              >
                <MapPin className="mb-2 size-4 text-gold" aria-hidden="true" />
                {v}
              </button>
            ))}
          </div>
        )}
        {step === 3 && (
          <button
            onClick={() => toast("Camera opens here on a phone", { description: "In this preview, any tap stands in for the shutter." })}
            className="mt-6 grid h-32 max-w-md place-items-center rounded-lg border border-dashed border-gold/40 bg-gold/[0.05] text-ink transition-colors hover:bg-gold/10"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Camera className="size-5" aria-hidden="true" />
              Take the first photo
            </span>
          </button>
        )}
        {step === 4 && <div className="mt-8"><VerifiedSeal size="lg" label="Maker stamp created" /></div>}

        <div className="mt-auto flex items-center justify-between pt-8">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className={cn("h-11 rounded-lg px-5 text-sm font-medium transition-colors", lang !== "en" && "font-sinhala", step === 0 ? "text-ink4" : "text-ink2 hover:bg-s2 hover:text-ink")}
          >
            {copy.back}
          </button>
          <button
            onClick={() => {
              if (step === onboardingSteps.length - 1) {
                toast("Welcome to the registry", { description: "Your maker stamp has been created (in this preview).", kind: "success" });
                setStep(0);
              } else {
                setStep((s) => s + 1);
              }
            }}
            className={cn("h-11 rounded-lg bg-gold px-6 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]", lang !== "en" && "font-sinhala")}
          >
            {step === onboardingSteps.length - 1 ? copy.finish : copy.next}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- dashboard ---------------- */

function Dashboard({ goListing }: { goListing: () => void }) {
  const currency = useApp((s) => s.currency);
  const toast = useApp((s) => s.toast);
  const myMasks = useMemo(() => masks.filter((m) => m.artisanSlug === artisan.slug), []);

  const stats = [
    { icon: HandCoins, label: "Settled this month", value: 148200, money: true },
    { icon: TrendingUp, label: "Lifetime through the registry", value: 1284500, money: true },
    { icon: Boxes, label: "Orders on the bench", value: 3 },
    { icon: ScanLine, label: "Certificate scans, 30 days", value: 214 },
  ];

  const orderRows = [
    { id: "MM-ORD-3358", piece: "Amuku Sanniya", buyer: "Colombo 07", status: "Hand-over Friday" },
    { id: "MM-ORD-3345", piece: "Gini Raksha", buyer: "Berlin", status: "Export papers" },
    { id: "MM-ORD-3329", piece: "Sohnon Yaka study", buyer: "Kyoto", status: "Delivered" },
  ];

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="edge rounded-lg bg-s1 p-5">
            <div className="flex items-center justify-between">
              <s.icon className="size-4 text-gold" aria-hidden="true" />
            </div>
            <p className="mt-4 font-mono text-[26px] leading-none text-ink tnum">
              <NumberTicker value={s.value} format={s.money ? (n) => formatMoney(n, currency) : undefined} />
            </p>
            <p className="mt-2 text-xs text-ink3">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="edge rounded-lg bg-s1 p-6" aria-label="Orders">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">On the bench</h2>
            <button onClick={goListing} className="text-[13px] font-medium text-gold hover:text-gold-strong">
              + New listing
            </button>
          </div>
          <ul className="divide-y divide-line">
            {orderRows.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{o.piece}</p>
                  <p className="font-mono text-[11px] text-ink4 tnum">{o.id} · {o.buyer}</p>
                </div>
                <span className="rounded-md border border-line bg-s2 px-2 py-1 text-[11px] text-ink2">{o.status}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink3">
            Settlement: 61% of each sale lands within 14 days of order — visible to you in the bench ledger.
          </p>
        </section>

        <section className="edge rounded-lg bg-s1 p-6" aria-label="Listings">
          <h2 className="mb-4 font-display text-lg text-ink">Your listings</h2>
          <ul className="divide-y divide-line">
            {myMasks.map((m) => (
              <li key={m.slug} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                  <p className="font-mono text-[11px] text-ink4 tnum">{formatMoney(m.priceLKR, currency)} · {m.stock} left</p>
                </div>
                <button
                  onClick={() => toast("Editing unlocks at pilot", { description: "For now the registry desk makes changes on your phone call." })}
                  className="rounded-md border border-line px-2.5 py-1 text-[12px] text-ink3 transition-colors hover:text-ink hover:bg-s2"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ---------------- create listing flow ---------------- */

const mintSteps = ["Fingerprinting your photographs", "Pinning the study to IPFS", "Minting on Polygon", "Pairing the NFC & QR tag"];

function ListingFlow() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [mintStage, setMintStage] = useState(-1);
  const [minted, setMinted] = useState(false);
  const toast = useApp((s) => s.toast);

  const addPhoto = () => {
    if (photos.length >= 4) {
      toast("Four photographs is plenty", { description: "The studio re-shoots at scan day regardless." });
      return;
    }
    setPhotos((p) => [...p, `workshop-photo-${p.length + 1}.jpg`]);
  };

  const startScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanProgress(0);
    const iv = window.setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          window.clearInterval(iv);
          setScanning(false);
          toast("3D study uploaded", { description: "The AR preview will render from this scan.", kind: "success" });
          return 100;
        }
        return Math.min(100, p + 4 + Math.random() * 9);
      });
    }, 160);
  };

  const mint = () => {
    if (mintStage >= 0) return;
    setMintStage(0);
    mintSteps.forEach((_, i) => {
      window.setTimeout(() => setMintStage(i + 1), 900 * (i + 1));
    });
    window.setTimeout(() => setMinted(true), 900 * mintSteps.length + 200);
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* 1 photos */}
      <section className="edge rounded-lg bg-s1 p-6" aria-label="Photographs">
        <h2 className="flex items-baseline gap-3 font-display text-lg text-ink">
          <span className="font-mono text-xs text-gold tnum">01</span> Photographs
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink2">Daylight, plain wall, one straight on. The registry colour-corrects; the craft stays yours.</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {photos.map((p) => (
            <div key={p} className="skel relative aspect-square overflow-hidden rounded-lg border border-line bg-gradient-to-b from-s3 to-s2">
              <span className="absolute inset-x-1 bottom-1 truncate font-mono text-[8px] text-ink4">{p}</span>
            </div>
          ))}
          <button
            onClick={addPhoto}
            className="grid aspect-square place-items-center rounded-lg border border-dashed border-line text-ink3 transition-colors hover:border-gold/40 hover:text-gold"
            aria-label="Add photograph"
          >
            <Camera className="size-5" />
          </button>
        </div>
      </section>

      {/* 2 scan */}
      <section className="edge rounded-lg bg-s1 p-6" aria-label="3D scan">
        <h2 className="flex items-baseline gap-3 font-display text-lg text-ink">
          <span className="font-mono text-xs text-gold tnum">02</span> 3D scan
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink2">The scanning kit visits your village on Fridays, or borrow the bench kit. Ninety seconds of orbiting does it.</p>
        <button
          onClick={startScan}
          className="mt-4 grid h-28 w-full place-items-center rounded-lg border border-dashed border-line text-ink3 transition-colors hover:border-gold/40 hover:text-gold"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            {scanning ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {scanning ? "Scanning the piece…" : scanProgress >= 100 ? "mask-study.glb · uploaded" : "Upload scan"}
          </span>
        </button>
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-s3" aria-hidden="true">
          <div className="h-full bg-gold transition-all duration-180" style={{ width: `${scanProgress}%` }} />
        </div>
      </section>

      {/* 3 mint */}
      <section className="relative edge rounded-lg bg-s1 p-6" aria-label="Mint certificate">
        {!minted && <BorderBeam duration={6} />}
        <h2 className="flex items-baseline gap-3 font-display text-lg text-ink">
          <span className="font-mono text-xs text-gold tnum">03</span> Mint the certificate
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink2">One tap writes the piece into the registry forever. Gas is on us — you never touch crypto.</p>
        {minted ? (
          <div className="mt-5 flex flex-col items-center gap-3 py-4">
            <VerifiedSeal size="lg" label="Certificate minted" />
            <p className="font-mono text-xs text-ink3 tnum">MM-2026-0{Math.floor(Math.random() * 900 + 100)}</p>
          </div>
        ) : (
          <>
            <button
              onClick={mint}
              disabled={mintStage >= 0}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gold text-sm font-medium text-[#16120A] transition-all duration-100 hover:bg-gold-strong active:scale-[0.98] disabled:opacity-60"
            >
              {mintStage >= 0 ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {mintStage >= 0 ? "Minting…" : "Mint certificate"}
            </button>
            <ProvenanceTimeline
              className="mt-5"
              steps={mintSteps.map((label, i) => ({
                label,
                state: mintStage > i + 1 ? "done" : mintStage === i + 1 ? "current" : "pending",
              }))}
            />
          </>
        )}
      </section>

      {/* 4 tag */}
      <section className="edge rounded-lg bg-s1 p-6" aria-label="Attach tag">
        <h2 className="flex items-baseline gap-3 font-display text-lg text-ink">
          <span className="font-mono text-xs text-gold tnum">04</span> Tag &amp; publish
        </h2>
        <ol className="mt-4 space-y-3">
          {[
            "Press the NFC chip into the routed pocket on the reverse — the bench template marks the spot.",
            "Stick the printed QR beneath it, one thumb's width from the chip.",
            "Test-scan with any phone: the certificate should answer before you publish.",
          ].map((t, i) => (
            <li key={t} className="flex gap-3 text-sm leading-relaxed text-ink2">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-gold/40 font-mono text-[10px] text-gold tnum">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <button
          onClick={() => toast("Listing queued for heritage review", { description: "The desk reads every listing before it goes live — tomorrow morning, latest.", kind: "success" })}
          disabled={!minted}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line bg-s2 text-sm font-medium text-ink transition-colors hover:bg-s3 disabled:opacity-40"
        >
          <BadgeCheck className={cn("size-4", minted ? "text-gold" : "text-ink4")} />
          Publish listing
        </button>
        {!minted && <p className="mt-2 text-center text-xs text-ink4">Mint the certificate first — every listing carries one.</p>}
      </section>
    </div>
  );
}
