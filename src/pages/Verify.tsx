import { BadgeCheck, Fingerprint, Landmark, Loader2, Lock, QrCode, ScanLine, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { artisans } from "@/lib/mock/data";
import { masks } from "@/lib/mock/data";
import { usePageMeta } from "@/lib/meta";
import type { Certificate } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { Button, EmptyState } from "@/components/ui/kit";
import { MaskArtwork } from "@/components/ui/MaskImage";
import { BorderBeam, VerifiedSeal } from "@/components/ui/surfaces";
import { ProvenanceTimeline, type ProvStep } from "@/components/ui/ProvenanceTimeline";

const checkpoints = [
  { icon: Landmark, label: "Checking the registry", done: "In the registry" },
  { icon: Fingerprint, label: "Matching the artisan signature", done: "Signature matches the maker" },
  { icon: ShieldCheck, label: "Confirming the certificate", done: "Certificate intact" },
];

export default function Verify() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  usePageMeta("Verify a certificate", "Scan the tag on the back of your mask — the registry answers in seconds.");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) navigate(`/verify/${code.trim().toUpperCase()}`);
  };

  if (certId) return <VerifyRun certId={certId} />;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
            <ScanLine className="size-3.5" aria-hidden="true" />
            Registry verification
          </p>
          <h1 className="mt-3 font-display text-[38px] leading-[1.06] font-light tracking-[-0.02em] text-ink sm:text-[46px]">
            The tag talks.
            <br />
            <span className="text-ink2">This page listens.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink2">
            Every mask leaves the workshop with an NFC chip and a printed QR on its reverse. Hold a phone to either and you'll
            land here — with the maker's name, the tree's story and a certificate nobody can forge politely.
          </p>

          <form onSubmit={submit} className="mt-8" aria-label="Certificate lookup">
            <label htmlFor="cert-code" className="mb-2 block text-[13px] font-medium text-ink2">
              Certificate code — printed beside the QR
            </label>
            <div className="flex gap-2">
              <input
                id="cert-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MM-2024-0117"
                autoComplete="off"
                spellCheck={false}
                className="h-11 w-full max-w-xs rounded-lg border border-line bg-s2 px-3.5 font-mono text-sm text-ink uppercase outline-none transition placeholder:normal-case placeholder:text-ink4 focus:border-gold/50 focus:ring-2 focus:ring-gold/20 tnum"
              />
              <Button type="submit" size="lg" disabled={!code.trim()}>
                <Search className="size-4" />
                Check
              </Button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink3">
            <span>Try</span>
            <button onClick={() => navigate("/verify/MM-2024-0117")} className="rounded-md border border-line bg-s1 px-2 py-1 font-mono text-[11px] text-gold transition-colors hover:border-gold/40 tnum">
              MM-2024-0117
            </button>
            <button onClick={() => navigate("/verify/MM-2023-0845")} className="rounded-md border border-line bg-s1 px-2 py-1 font-mono text-[11px] text-gold transition-colors hover:border-gold/40 tnum">
              MM-2023-0845
            </button>
            <span>· a claimed piece</span>
          </div>

          <div className="mt-10 space-y-4">
            {checkpoints.map((c) => (
              <div key={c.label} className="flex items-start gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-s1 text-gold">
                  <c.icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{c.label}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink3">
                    {c.icon === Landmark && "The certificate ID is looked up in the public registry — minted once, never reissued."}
                    {c.icon === Fingerprint && "The maker's signed stamp on the certificate is checked against the workshop's records."}
                    {c.icon === ShieldCheck && "Ownership state is confirmed: unclaimed, or claimed by the registered keeper."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="edge relative rounded-lg bg-s2 p-8">
          <QrCode className="size-6 text-gold" aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl text-ink">Holding the mask now?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink2">
            Tap the tag with an NFC phone, or point any camera at the printed QR. Both routes end on this page with the
            certificate filled in for you.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/verify/MM-2024-0117")}>
            <ScanLine className="size-4 text-gold" />
            Simulate a tag scan
          </Button>
          <div className="mt-8 border-t border-line pt-5">
            <p className="font-mono text-[11px] leading-relaxed text-ink4 tnum">
              Registry status: 191 certificates live
              <br />
              Counterfeit reports honoured within 48 h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= the animated check ================= */

function VerifyRun({ certId }: { certId: string }) {
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<{ cert: Certificate | null; found: boolean } | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const toast = useApp((s) => s.toast);
  usePageMeta(`Certificate ${certId}`);

  useEffect(() => {
    let alive = true;
    setStage(0);
    setResult(null);
    setClaimed(false);
    const promise = api.verifyCertificate(certId);
    const timers = checkpoints.map((_, i) => window.setTimeout(() => alive && setStage(i + 1), 620 * (i + 1)));
    const doneTimer = window.setTimeout(async () => {
      const r = await promise;
      if (alive) {
        setResult(r);
        setStage(checkpoints.length + 1);
      }
    }, 620 * (checkpoints.length + 1) + 250);
    return () => {
      alive = false;
      timers.forEach(window.clearTimeout);
      window.clearTimeout(doneTimer);
    };
  }, [certId]);

  const running = stage <= checkpoints.length;
  const mask = result?.cert ? masks.find((m) => m.slug === result.cert!.maskSlug) : undefined;
  const artisan = result?.cert ? artisans.find((a) => a.slug === result.cert!.artisanSlug) : undefined;
  const isClaimed = claimed || result?.cert?.status === "claimed";

  const claim = () => {
    setClaiming(true);
    window.setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
      toast("Digital twin claimed", { description: `${mask?.name} now answers to your name on the registry.`, kind: "success" });
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      {/* checking sequence — aria-live for screen readers */}
      <div className="edge mx-auto max-w-xl rounded-lg bg-s1 p-6" aria-live="polite">
        <p className="mb-4 flex items-center justify-between text-[13px] font-medium text-ink2">
          <span>Verifying against the registry</span>
          <span className="font-mono text-[12px] text-gold tnum">{certId}</span>
        </p>
        <ol className="space-y-3">
          {checkpoints.map((c, i) => {
            const state = stage > i + 1 ? "done" : stage === i + 1 ? "current" : "pending";
            return (
              <li key={c.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border",
                    state === "done" && "border-gold/60 bg-gold/15 text-gold",
                    state === "current" && "border-gold text-gold",
                    state === "pending" && "border-line text-ink4"
                  )}
                >
                  {state === "current" ? <Loader2 className="size-3.5 animate-spin" /> : state === "done" ? <BadgeCheck className="size-3.5" /> : <c.icon className="size-3.5" />}
                </span>
                <span className={cn("text-sm", state === "pending" ? "text-ink4" : "text-ink2")}>
                  {state === "done" ? c.done : c.label}
                </span>
              </li>
            );
          })}
        </ol>
        {running && <div className="skel mt-4 h-[3px] rounded-full" aria-hidden="true" />}
      </div>

      {/* result */}
      {result && !result.found && (
        <div className="mt-10">
          <EmptyState
            icon={ShieldCheck}
            title="Not on the registry"
            body="This number doesn't match any certificate we've minted. Check the digits — and if a seller gave you this tag, write to the registry desk. Counterfeit reports are investigated within 48 hours."
          >
            <Link to="/verify" className="inline-flex h-10 items-center rounded-lg border border-line bg-s2 px-4 text-sm font-medium text-ink transition-colors hover:bg-s3">
              Check another code
            </Link>
            <Button variant="ghost" onClick={() => toast("Report noted", { description: "The heritage desk replies within 48 hours.", kind: "success" })}>
              Report this tag
            </Button>
          </EmptyState>
        </div>
      )}

      {result?.cert && mask && artisan && (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[340px_1fr]">
          <div>
            <MaskArtwork mask={mask} ratio="aspect-[4/5]" eager />
            <p className="mt-3 text-center font-mono text-[11px] tracking-wide text-ink4 tnum">
              {mask.region} · carved {mask.year}
            </p>
          </div>

          <div>
            <div className="gold-frame relative rounded-lg bg-s2 p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Certificate of provenance</p>
                  <h1 className="mt-2 font-display text-[30px] leading-tight text-ink">{mask.name}</h1>
                  <p className="mt-1 text-sm text-ink2">
                    by {artisan.name} · <span className="font-sinhala">{artisan.sinhalaName}</span>
                  </p>
                </div>
                <VerifiedSeal size="lg" label={isClaimed ? "Claimed & verified" : "Verified authentic"} />
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-5 text-[13px] sm:grid-cols-3">
                {[
                  ["Certificate", result.cert.id],
                  ["Minted", formatDate(result.cert.mintedAt)],
                  ["Chain", result.cert.chain],
                  ["Timber", mask.wood.replace(" (Strychnos nux-vomica)", "")],
                  ["Pigments", mask.dyes[0] ?? "Natural mineral"],
                  ["Keeper", isClaimed ? claimed ? "You — just now" : result.cert.owner ?? "—" : "Unclaimed"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-ink4">{k}</dt>
                    <dd className={cn("mt-0.5", k === "Chain" || k === "Minted" ? "font-mono text-ink2 tnum" : "text-ink2", k === "Certificate" && "font-mono text-gold tnum")}>{v}</dd>
                  </div>
                ))}
              </dl>

              {/* claim card */}
              <div className="relative mt-6 rounded-lg border border-line bg-s1 p-5">
                {!isClaimed && <BorderBeam duration={5} />}
                {isClaimed ? (
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{claimed ? "The twin is yours" : "Already with its keeper"}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink2">
                        {claimed
                          ? "This certificate now names you. Ownership notes, care reminders and the collector's cut of future folklore releases travel with it."
                          : `Claimed by ${result.cert.owner ?? "its keeper"}. Any resale re-registers from this certificate, not from gold words.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <Lock className="size-4 text-gold" aria-hidden="true" />
                        Unclaimed twin
                      </p>
                      <p className="mt-1 max-w-xs text-[13px] leading-snug text-ink2">If this mask is yours, bind the certificate to your name. It's a one-minute act with a permanent effect.</p>
                    </div>
                    <Button onClick={claim} disabled={claiming}>
                      {claiming ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                      {claiming ? "Binding…" : "Claim digital twin"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ownership history */}
            <div className="edge mt-6 rounded-lg bg-s1 p-6">
              <h2 className="text-sm font-semibold text-ink">The piece's record</h2>
              <ProvenanceTimeline
                className="mt-4"
                steps={[
                  ...result.cert.history.map(
                    (h): ProvStep => ({ label: h.label, date: formatDate(h.date), actor: h.actor, state: "done" })
                  ),
                  ...(isClaimed
                    ? [{ label: "Digital twin claimed", date: claimed ? "Just now" : formatDate("2024-01-19"), actor: claimed ? "You" : result.cert!.owner ?? undefined, state: "done" as const }]
                    : [{ label: "Awaiting its keeper", state: "pending" as const }]),
                ]}
              />
            </div>

            <Link to="/verify" className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink">
              Verify another piece
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
