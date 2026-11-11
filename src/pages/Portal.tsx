import {
  BadgeCheck,
  Boxes,
  Camera,
  Check,
  Drama,
  HandCoins,
  Languages,
  MapPin,
  ScanLine,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import type { Artisan, Certificate, Mask, Order, PortalDashboardData } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { useAuth, type AuthUser } from "@/store/auth";
import { cn } from "@/utils/cn";
import { NumberTicker } from "@/components/ui/motion";
import { AnimatedTabs, VerifiedSeal } from "@/components/ui/surfaces";
import { AdminDashboard } from "@/components/portal/AdminDashboard";
import { VerifierDesk } from "@/components/portal/VerifierDesk";
import { ArtisanCollection } from "@/components/portal/ArtisanCollection";
import { MaskCreateForm } from "@/components/portal/MaskCreateForm";

type Role = "buyer" | "artisan" | "verifier" | "admin";
const roles: { id: Role; label: string }[] = [
  { id: "buyer", label: "Buyer / Collector" },
  { id: "artisan", label: "Artisan Workshop" },
  { id: "verifier", label: "Heritage Verifier" },
  { id: "admin", label: "Admin Control Tower" },
];

const SAMPLE_WORKSHOPS = [
  { slug: "chandana-bandara", name: "Chandana Bandara (Ambalangoda)" },
  { slug: "apuhamy-sirisena", name: "Sirisena Apuhamy (Wathugedara)" },
  { slug: "kumari-dissanayake", name: "Kumari Dissanayake (Balapitiya)" },
];

export default function Portal() {
  usePageMeta("Platform Portal");
  const user = useAuth((s) => s.user);

  // Initialize role to user's real role if logged in, default to buyer
  const [role, setRole] = useState<Role>(() => user?.role || "buyer");
  const [tab, setTab] = useState("dashboard");

  // Workshop selection
  const userWorkshopSlug =
    user?.artisanSlug ||
    (user?.name ? user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "my-workshop");
  const [selectedWorkshopSlug, setSelectedWorkshopSlug] = useState<string>(
    user?.artisanSlug || "my-workshop"
  );
  const [artisan, setArtisan] = useState<Artisan | null>(null);

  const isOwnWorkshop = selectedWorkshopSlug === userWorkshopSlug || selectedWorkshopSlug === "my-workshop";
  const currentArtisanName = isOwnWorkshop
    ? user?.name || "My Workshop"
    : artisan?.name || "Chandana Bandara";

  useEffect(() => {
    if (!isOwnWorkshop) {
      api.getArtisan(selectedWorkshopSlug).then((a) => a && setArtisan(a)).catch(() => {});
    } else {
      setArtisan(null);
    }
  }, [selectedWorkshopSlug, isOwnWorkshop]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      {/* Role Switcher & Persona Indicator Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/30 bg-gold/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] tracking-wide text-gold tnum">
            PLATFORM PORTAL · {user ? `Signed in as ${user.name}` : "Visitor mode"}
          </p>
          {user && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
              {role}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-line bg-s1 p-0.5" role="group" aria-label="Preview as role">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              aria-pressed={role === r.id}
              className={cn(
                "h-7 rounded-md px-2.5 text-[12px] font-medium transition-colors duration-180",
                role === r.id ? "bg-s3 text-gold" : "text-ink3 hover:text-ink2"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Admin Control Tower */}
      {role === "admin" && <AdminDashboard />}

      {/* 2. Heritage Verifier Desk */}
      {role === "verifier" && <VerifierDesk />}

      {/* 3. Collector & Buyer Portal */}
      {role === "buyer" && (
        <BuyerPortal
          user={user}
          onSwitchToArtisan={() => {
            setRole("artisan");
            setTab("dashboard");
          }}
        />
      )}

      {/* 4. Artisan Workshop Desk */}
      {role === "artisan" && (
        <>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-[28px] leading-tight text-ink">
                  Ayubowan, {user ? user.name.split(" ")[0] : currentArtisanName.split(" ")[0]}
                  <span className="ml-3 font-sinhala text-[0.6em] text-ink3">ආයුබෝවන්</span>
                </h1>
              </div>

              {/* Workshop Selector Pill */}
              <div className="mt-2 flex items-center gap-2 text-xs text-ink3">
                <span>Active Workshop:</span>
                <select
                  value={selectedWorkshopSlug}
                  onChange={(e) => setSelectedWorkshopSlug(e.target.value)}
                  className="rounded border border-line bg-s2 px-2.5 py-1 text-xs text-gold focus:border-gold focus:outline-none"
                >
                  <option value={userWorkshopSlug}>
                    {user?.name ? `${user.name}'s Workshop` : "My Personal Workshop"}
                  </option>
                  {SAMPLE_WORKSHOPS.map((w) => (
                    <option key={w.slug} value={w.slug}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {!isOwnWorkshop && (
                  <span className="rounded bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                    Demo Preview
                  </span>
                )}
              </div>
            </div>

            <AnimatedTabs
              id="portal"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "dashboard", label: "Workshop desk" },
                { id: "collection", label: "My collection" },
                { id: "listing", label: "New listing" },
                { id: "onboarding", label: "Onboarding" },
              ]}
            />
          </div>

          {tab === "dashboard" && (
            <Dashboard
              goListing={() => setTab("listing")}
              artisanSlug={selectedWorkshopSlug}
              artisanName={currentArtisanName}
              isOwnWorkshop={isOwnWorkshop}
            />
          )}

          {tab === "collection" && (
            <ArtisanCollection
              artisanSlug={selectedWorkshopSlug}
              artisanName={currentArtisanName}
              onAddNew={() => setTab("listing")}
            />
          )}

          {tab === "listing" && (
            <MaskCreateForm
              artisanSlug={selectedWorkshopSlug}
              artisanName={currentArtisanName}
              onSuccess={() => setTab("collection")}
            />
          )}

          {tab === "onboarding" && <Onboarding />}
        </>
      )}
    </div>
  );
}

/* ---------------- Buyer / Collector Portal Component ---------------- */

function BuyerPortal({
  user,
  onSwitchToArtisan,
}: {
  user: AuthUser | null;
  onSwitchToArtisan: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const wishlist = useApp((s) => s.wishlist);

  useEffect(() => {
    Promise.all([
      api.listOrders().catch(() => []),
      api.listCertificates().catch(() => []),
    ]).then(([orderList, certList]) => {
      setOrders(orderList);
      setCerts(certList.filter((c) => c.status === "claimed"));
    });
  }, []);

  return (
    <div className="mt-8 space-y-8">
      {/* Buyer Welcome Banner */}
      <div className="edge relative overflow-hidden rounded-lg bg-s1 p-6">
        <h1 className="font-display text-2xl text-ink">
          Ayubowan, {user ? user.name.split(" ")[0] : "Collector"}
          <span className="ml-3 font-sinhala text-[0.6em] text-ink3">ආයුබෝවන්</span>
        </h1>
        <p className="mt-1 text-xs text-ink3">
          Your personal collector desk for authentic ritual masks, claimed digital twins, and order deliveries.
        </p>

        {/* Quick Collector Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-s2 p-4">
            <span className="block text-[11px] font-medium text-ink3">Pieces in Collection</span>
            <p className="mt-1 font-mono text-2xl font-bold text-ink">{orders.length}</p>
            <Link to="/account" className="mt-1 block text-[11px] text-gold hover:underline">
              View Order History →
            </Link>
          </div>
          <div className="rounded-lg border border-line bg-s2 p-4">
            <span className="block text-[11px] font-medium text-ink3">Claimed Digital Twins</span>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">{certs.length}</p>
            <Link to="/account" className="mt-1 block text-[11px] text-emerald-400 hover:underline">
              View Certificates &amp; AR →
            </Link>
          </div>
          <div className="rounded-lg border border-line bg-s2 p-4">
            <span className="block text-[11px] font-medium text-ink3">Saved to Wishlist</span>
            <p className="mt-1 font-mono text-2xl font-bold text-gold">{wishlist.length}</p>
            <Link to="/masks" className="mt-1 block text-[11px] text-gold hover:underline">
              Browse Catalog →
            </Link>
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="edge rounded-lg bg-s1 p-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-gold" />
            <h3 className="font-display text-base text-ink">Explore Sacred Heritage</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink2">
            Inspect our verified collection of Kaduru ritual masks from master artisans in Ambalangoda.
            Every piece comes with an on-chain Polygon provenance certificate and AR preview.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/masks"
              className="inline-flex items-center gap-1.5 rounded-md bg-gold px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-gold/90"
            >
              Browse Marketplace
            </Link>
            <Link
              to="/heritage"
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-s2 px-3.5 py-1.5 text-xs text-ink hover:bg-s3"
            >
              Folklore &amp; Traditions
            </Link>
          </div>
        </div>

        <div className="edge rounded-lg bg-s1 p-5 border-gold/30 bg-gold/[0.03]">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-gold" />
            <h3 className="font-display text-base text-gold">Are You a Mask Carver?</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink2">
            Switch to the Artisan Workshop Desk to post your hand-carved collection, run 3D scans, and mint Polygon certificates.
          </p>
          <div className="mt-4">
            <button
              onClick={onSwitchToArtisan}
              className="inline-flex items-center gap-1.5 rounded-md border border-gold/50 bg-gold/15 px-3.5 py-1.5 text-xs font-semibold text-gold hover:bg-gold/25"
            >
              Open Workshop Desk →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Artisan Workshop Dashboard ---------------- */

function Dashboard({
  goListing,
  artisanSlug,
  artisanName,
  isOwnWorkshop,
}: {
  goListing: () => void;
  artisanSlug: string;
  artisanName: string;
  isOwnWorkshop: boolean;
}) {
  const currency = useApp((s) => s.currency);
  const [myMasks, setMyMasks] = useState<Mask[]>([]);
  const [dashboard, setDashboard] = useState<PortalDashboardData | null>(null);

  useEffect(() => {
    Promise.all([
      api.masksByArtisan(artisanSlug).catch(() => []),
      api.getPortalDashboard(artisanSlug).catch(() => null),
    ]).then(([masksList, dashData]) => {
      setMyMasks(masksList);
      setDashboard(dashData);
    });
  }, [artisanSlug]);

  const stats = [
    {
      icon: HandCoins,
      label: "Settled this month",
      value: isOwnWorkshop && myMasks.length === 0 ? 0 : (dashboard?.stats.settledThisMonthLKR ?? 0),
      money: true,
    },
    {
      icon: TrendingUp,
      label: "Lifetime through the registry",
      value: isOwnWorkshop && myMasks.length === 0 ? 0 : (dashboard?.stats.lifetimeRegistryRevenueLKR ?? 0),
      money: true,
    },
    {
      icon: Boxes,
      label: "Orders on the bench",
      value: isOwnWorkshop && myMasks.length === 0 ? 0 : (dashboard?.stats.ordersOnBench ?? 0),
    },
    {
      icon: ScanLine,
      label: "Certificate scans, 30 days",
      value: isOwnWorkshop && myMasks.length === 0 ? 0 : (dashboard?.stats.certificateScans30Days ?? 0),
    },
  ];

  const orderRows = isOwnWorkshop && myMasks.length === 0 ? [] : (dashboard?.benchOrders ?? []);

  return (
    <div className="mt-8 space-y-8">
      {/* Personal workshop welcome note if new */}
      {isOwnWorkshop && myMasks.length === 0 && (
        <div className="rounded-lg border border-gold/40 bg-gold/[0.06] p-4 text-xs text-ink">
          <p className="font-semibold text-gold">Welcome to your new workshop bench, {artisanName}!</p>
          <p className="mt-1 text-ink2">
            You haven't listed any masks yet. Click <strong>+ New listing</strong> below to upload your first photograph, reconstruct a 3D model, and mint its Polygon certificate.
          </p>
        </div>
      )}

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
          {orderRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink3">
              <p>No active orders on the bench.</p>
              <p className="mt-1">New customer orders will appear here for fulfillment.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {orderRows.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{o.piece}</p>
                    <p className="font-mono text-[11px] text-ink3 tnum">{o.id} · {o.buyer}</p>
                  </div>
                  <span className="rounded-md border border-line bg-s2 px-2 py-1 text-[11px] text-ink2">{o.status}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink3">
            Settlement: 61% of each sale lands within 14 days of order — visible to you in the bench ledger.
          </p>
        </section>

        <section className="edge rounded-lg bg-s1 p-6" aria-label="Listings">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Your listings</h2>
            <button onClick={goListing} className="text-[13px] font-medium text-gold hover:text-gold-strong">
              + Add piece
            </button>
          </div>
          {myMasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink3">
              <p>No masks listed in this workshop yet.</p>
              <button onClick={goListing} className="mt-2 text-gold hover:underline">
                + Create your first mask listing
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {myMasks.map((m) => (
                <li key={m.slug} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                    <p className="font-mono text-[11px] text-ink3 tnum">{formatMoney(m.priceLKR, currency)} · {m.stock} left</p>
                  </div>
                  <Link
                    to={`/masks/${m.slug}`}
                    className="rounded-md border border-line px-2.5 py-1 text-[12px] text-ink3 transition-colors hover:text-ink hover:bg-s2"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------------- Onboarding Wizard ---------------- */

const langCopy = {
  en: { welcome: "Welcome to the registry", next: "Continue", back: "Back", finish: "Join the registry" },
  si: { welcome: "ලේඛනාගාරයට සාදරයෙන් පිළිගනිමු", next: "ඊළඟට", back: "ආපසු", finish: "ලේඛනාගාරයට එක්වන්න" },
  ta: { welcome: "பதிவகத்திற்கு வரவேற்கிறோம்", next: "தொடரவும்", back: "பின்", finish: "பதிவகத்தில் இணையுங்கள்" },
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
  const user = useAuth((s) => s.user);
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
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg", state === "current" ? "bg-gold text-on-gold" : "bg-s2 text-ink3")}>
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

      <div className="edge rounded-lg bg-s1 p-6">
        <span className="font-mono text-xs text-gold tnum">Step {step + 1} of {onboardingSteps.length}</span>
        <h2 className="mt-1 font-display text-xl text-ink">{onboardingSteps[step].title}</h2>
        <p className="mt-1 text-xs text-ink2">{onboardingSteps[step].note}</p>

        {step === 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {(["en", "si", "ta"] as const).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={cn(
                  "h-11 rounded-lg border px-5 text-sm font-medium transition-colors duration-180",
                  lang === code ? "border-gold bg-gold/15 text-gold" : "border-line bg-s2 text-ink3 hover:text-ink"
                )}
              >
                {code === "en" ? "English" : code === "si" ? "සිංහල" : "தமிழ்"}
              </button>
            ))}
          </div>
        )}

        {step === 4 && <div className="mt-8"><VerifiedSeal size="lg" label="Maker stamp created" /></div>}

        <div className="mt-8 flex justify-between border-t border-line pt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="h-11 rounded-lg border border-line px-5 text-sm text-ink3 transition-colors hover:text-ink disabled:opacity-30"
          >
            {copy.back}
          </button>
          <button
            onClick={async () => {
              if (step === onboardingSteps.length - 1) {
                await api.saveOnboarding({
                  artisanSlug: user?.name ? user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "my-workshop",
                  language: lang,
                  village: "Ambalangoda",
                  tradition: "raksha",
                });
                toast("Welcome to the registry", { description: "Your maker stamp has been created on the live registry.", kind: "success" });
                setStep(0);
              } else {
                setStep((s) => s + 1);
              }
            }}
            className={cn("h-11 rounded-lg bg-gold px-6 text-sm font-medium text-on-gold transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]", lang !== "en" && "font-sinhala")}
          >
            {step === onboardingSteps.length - 1 ? copy.finish : copy.next}
          </button>
        </div>
      </div>
    </div>
  );
}
