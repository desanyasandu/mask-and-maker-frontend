import { BadgeCheck, Copy, ExternalLink, Fingerprint, Landmark, Loader2, Lock, Radio, ScanLine, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import type { Artisan, Certificate, Mask, VerifyRegistryStats } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useApp } from "@/store/app";
import { useAuth } from "@/store/auth";
import { cn } from "@/utils/cn";
import { Button, EmptyState } from "@/components/ui/kit";
import { ImageFrame, MaskArtwork } from "@/components/ui/MaskImage";
import { BorderBeam, VerifiedSeal } from "@/components/ui/surfaces";
import { ProvenanceTimeline, type ProvStep } from "@/components/ui/ProvenanceTimeline";
import { photos } from "@/lib/photos";

const checkpoints = [
  { icon: Landmark, label: "Checking the Polygon registry", done: "On-chain token verified in registry" },
  { icon: Fingerprint, label: "Matching the artisan cryptographic signature", done: "ECDSA signature matches the maker" },
  { icon: ShieldCheck, label: "Confirming NTAG424 DNA & ownership state", done: "Physical tag & certificate intact" },
];

export default function Verify() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [stats, setStats] = useState<VerifyRegistryStats | null>(null);
  const [scanningNfc, setScanningNfc] = useState(false);
  const toast = useApp((s) => s.toast);
  usePageMeta("Verify a certificate", "Scan the tag on the back of your mask — the registry answers in seconds.");

  useEffect(() => {
    if (!certId) {
      api.getVerifyStats().then(setStats).catch(() => {});
    }
  }, [certId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) navigate(`/verify/${encodeURIComponent(code.trim().toUpperCase())}`);
  };

  const simulateNfcScan = async (targetCert = "MM-2024-0117") => {
    if (scanningNfc) return;
    setScanningNfc(true);
    try {
      const auth = await api.authenticateNfc(targetCert);
      if (auth?.authenticated) {
        toast(`NFC Tag ${auth.uid} authenticated`, {
          description: `NTAG424 DNA hardware tap #${auth.tapCount} verified on-chain.`,
          kind: "success",
        });
      }
    } catch {}
    setScanningNfc(false);
    navigate(`/verify/${targetCert}`);
  };

  if (certId) return <VerifyRun certId={certId} />;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-[38px] leading-[1.06] font-light tracking-[-0.02em] text-ink sm:text-[46px]">
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
                className="h-11 w-full max-w-xs rounded-lg border border-line bg-s2 px-3.5 font-mono text-sm text-ink uppercase outline-none transition placeholder:normal-case placeholder:text-ink3 focus:border-gold/50 focus:ring-2 focus:ring-gold/20 tnum"
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
            <button onClick={() => navigate("/verify/MM-2025-0338")} className="rounded-md border border-line bg-s1 px-2 py-1 font-mono text-[11px] text-gold transition-colors hover:border-gold/40 tnum">
              MM-2025-0338
            </button>
            <button onClick={() => navigate("/verify/MM-2023-0845")} className="rounded-md border border-line bg-s1 px-2 py-1 font-mono text-[11px] text-gold transition-colors hover:border-gold/40 tnum">
              MM-2023-0845
            </button>
            <span>· a claimed piece</span>
          </div>

          <ol className="mt-10 space-y-5">
            {checkpoints.map((c) => (
              <li key={c.label}>
                <p className="font-display text-lg text-ink">{c.label}</p>
                <p className="mt-1 max-w-md text-[14px] leading-relaxed text-ink2">
                  {c.icon === Landmark && "The certificate ID is looked up in the Polygon public registry — minted once, never reissued."}
                  {c.icon === Fingerprint && "The maker’s cryptographic stamp on the certificate is checked against the workshop’s records."}
                  {c.icon === ShieldCheck && "NTAG424 DNA hardware tap counter and ownership state are confirmed: unclaimed, or claimed by the registered keeper."}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative rounded-lg bg-s2 p-6 sm:p-8">
          <figure className="mb-6">
            <ImageFrame src={photos.maskDetail.src} alt={photos.maskDetail.alt} ratio="aspect-[16/10]" position={photos.maskDetail.position} className="rounded-lg" />
            <figcaption className="mt-2 text-[13px] text-ink3">{photos.maskDetail.caption}</figcaption>
          </figure>
          <h2 className="font-display text-2xl text-ink">Holding the mask now?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink2">
            Tap the tag with an NFC phone, or point any camera at the printed QR. Both routes end on this page with the
            certificate filled in for you.
          </p>
          <Button variant="outline" className="mt-6" disabled={scanningNfc} onClick={() => simulateNfcScan("MM-2024-0117")}>
            {scanningNfc ? <Loader2 className="size-4 animate-spin text-gold" /> : <ScanLine className="size-4 text-gold" />}
            {scanningNfc ? "Authenticating NTAG424 DNA…" : "Simulate a tag scan"}
          </Button>
          <div className="mt-8 border-t border-line pt-5">
            <p className="text-sm leading-relaxed text-ink3">
              {stats
                ? `${stats.stats.totalCertificates} certificates live on ${stats.network} · ${stats.stats.claimedCount} claimed · ${stats.stats.totalNfcTaps} NFC hardware taps verified.`
                : "18 certificates live on Polygon PoS. Counterfeit reports are answered within 48 hours."}
            </p>
            {stats?.contract && (
              <p className="mt-1.5 font-mono text-[11px] text-ink3 tnum">
                Registry contract: <span className="text-gold">{stats.contract}</span>
              </p>
            )}
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
  const [mask, setMask] = useState<Mask | undefined>(undefined);
  const [artisan, setArtisan] = useState<Artisan | undefined>(undefined);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const [tapping, setTapping] = useState(false);
  const toast = useApp((s) => s.toast);
  const user = useAuth((s) => s.user);
  usePageMeta(`Certificate ${certId}`);

  useEffect(() => {
    if (user?.name && !ownerInput) {
      setOwnerInput(user.name);
    }
  }, [user?.name, ownerInput]);

  useEffect(() => {
    let alive = true;
    setStage(0);
    setResult(null);
    setMask(undefined);
    setArtisan(undefined);
    setClaimed(false);
    setClaiming(false);
    /* a failed lookup must still end the animation, not spin forever */
    const promise = api.verifyCertificate(certId).then(async (r) => {
      if (r.cert) {
        const [m, a] = await Promise.all([
          api.getMask(r.cert.maskSlug),
          api.getArtisan(r.cert.artisanSlug),
        ]);
        if (alive) {
          setMask(m);
          setArtisan(a);
        }
      }
      return r;
    }).catch(() => ({ cert: null, found: false }));
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
  const isClaimed = claimed || result?.cert?.status === "claimed";

  const claim = async () => {
    if (claiming) return;
    const keeperName = ownerInput.trim() || user?.name || "Registered Keeper";
    setClaiming(true);
    try {
      const updated = await api.claimCertificate(certId, keeperName, walletInput.trim() || undefined);
      if (updated) {
        setResult((prev) => ({
          found: true,
          cert: {
            ...prev?.cert,
            ...updated,
            verificationStatus: prev?.cert?.verificationStatus,
          },
        }));
      }
      setClaimed(true);
      toast("Digital twin claimed on-chain", {
        description: `${mask?.name ?? certId} is now bound to ${keeperName} on the Polygon registry.`,
        kind: "success",
      });
    } catch {
      toast("Could not claim twin", { description: "Please check your connection or certificate status.", kind: "error" });
    } finally {
      setClaiming(false);
    }
  };

  const handleNfcTap = async () => {
    if (tapping || !result?.cert) return;
    setTapping(true);
    try {
      const auth = await api.authenticateNfc(result.cert.id);
      if (auth?.cert) {
        setResult({ found: true, cert: auth.cert });
        toast(`NFC Tag ${auth.uid} tapped`, {
          description: `Hardware counter incremented to #${auth.tapCount} (${auth.cert.nfcTag?.standard || "NTAG424_DNA"}).`,
          kind: "success",
        });
      }
    } finally {
      setTapping(false);
    }
  };

  const cert = result?.cert;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      {/* checking sequence — aria-live for screen readers */}
      <div className="edge mx-auto max-w-xl rounded-lg bg-s1 p-6" aria-live="polite">
        <p className="mb-4 flex items-center justify-between text-[13px] font-medium text-ink2">
          <span>Verifying against the Polygon registry</span>
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
                    state === "pending" && "border-line text-ink3"
                  )}
                >
                  {state === "current" ? <Loader2 className="size-3.5 animate-spin" /> : state === "done" ? <BadgeCheck className="size-3.5" /> : <c.icon className="size-3.5" />}
                </span>
                <span className={cn("text-sm", state === "pending" ? "text-ink3" : "text-ink2")}>
                  {state === "done" ? c.done : c.label}
                </span>
              </li>
            );
          })}
        </ol>
        {running && <div className="skel mt-4 h-[3px] rounded-full" aria-hidden="true" />}
      </div>

      {/* result: not found */}
      {result && !result.found && (
        <div className="mt-10">
          <EmptyState
            photo={photos.masksBanner}
            title="Not on the registry"
            body="This number doesn't match any certificate we've minted. Check the digits — and if a seller gave you this tag, write to the registry desk. Counterfeit reports are investigated within 48 hours."
          >
            <Link to="/verify" className="inline-flex h-10 items-center rounded-lg border border-line bg-s2 px-4 text-sm font-medium text-ink transition-colors hover:bg-s3">
              Check another code
            </Link>
            <Button
              variant="ghost"
              onClick={async () => {
                await api.reportCertificate(certId, "Unrecognized certificate code reported via web verifier");
                toast("Report noted", { description: "The heritage desk replies within 48 hours.", kind: "success" });
              }}
            >
              Report this tag
            </Button>
          </EmptyState>
        </div>
      )}

      {/* result: verified */}
      {cert && (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[340px_1fr]">
          <div>
            {mask ? (
              <>
                <MaskArtwork mask={mask} ratio="aspect-[4/5]" eager />
                <p className="mt-3 text-center text-[13px] text-ink3">
                  {mask.region} · carved {mask.year}
                </p>
              </>
            ) : (
              <div className="edge rounded-lg bg-s2 p-6 text-center">
                <VerifiedSeal size="lg" label="Verified on-chain" />
                <p className="mt-3 font-mono text-xs text-gold">{cert.id}</p>
              </div>
            )}
          </div>

          <div>
            <div className="gold-frame relative rounded-lg bg-s2 p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="mt-2 font-display text-[30px] leading-tight text-ink">{mask?.name ?? cert.maskSlug}</h1>
                  <p className="mt-1 text-sm text-ink2">
                    by {artisan?.name ?? cert.artisanSlug}
                    {artisan?.sinhalaName && (
                      <>
                        {" "}
                        · <span className="font-sinhala">{artisan.sinhalaName}</span>
                      </>
                    )}
                  </p>
                </div>
                <VerifiedSeal size="lg" label={isClaimed ? "Claimed & verified" : "Verified authentic"} />
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-5 text-[13px] sm:grid-cols-3">
                {[
                  ["Certificate", cert.id],
                  ["Minted", formatDate(cert.mintedAt)],
                  ["Chain", `${cert.chain} PoS (Amoy)`],
                  ["Timber", mask ? mask.wood.replace(" (Strychnos nux-vomica)", "") : "Kaduru"],
                  ["Pigments", mask?.dyes?.[0] ?? "Natural mineral"],
                  ["Keeper", isClaimed ? cert.owner ?? (claimed ? ownerInput || "You — just now" : "—") : "Unclaimed"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[12.5px] text-ink3">{k}</dt>
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
                      <p className="mt-1 text-sm leading-relaxed text-ink2">
                        {claimed
                          ? `This certificate now names ${cert.owner || ownerInput || "you"}. Ownership notes, care reminders and the collector's cut of future folklore releases travel with it.`
                          : `Claimed by ${cert.owner ?? "its keeper"}. Any resale re-registers from this certificate, not from gold words.`}
                      </p>
                      {cert.ownerWallet && (
                        <p className="mt-1.5 font-mono text-xs text-gold tnum">
                          Wallet: {cert.ownerWallet}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <Lock className="size-4 text-gold" aria-hidden="true" />
                          Unclaimed digital twin
                        </p>
                        <p className="mt-1 max-w-md text-[13px] leading-snug text-ink2">
                          If this mask is yours, bind the certificate to your name and optional Polygon wallet. Claiming also releases the workshop's 61% escrow settlement.
                        </p>
                      </div>
                      <Button onClick={claim} disabled={claiming}>
                        {claiming ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                        {claiming ? "Binding on-chain…" : "Claim digital twin"}
                      </Button>
                    </div>
                    <div className="grid gap-3 pt-1 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11.5px] text-ink3">Keeper name</label>
                        <input
                          value={ownerInput}
                          onChange={(e) => setOwnerInput(e.target.value)}
                          placeholder="Your name for the registry"
                          className="h-9 w-full rounded-md border border-line bg-s2 px-3 text-xs text-ink outline-none focus:border-gold/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11.5px] text-ink3">Polygon wallet (optional)</label>
                        <input
                          value={walletInput}
                          onChange={(e) => setWalletInput(e.target.value)}
                          placeholder="0x..."
                          className="h-9 w-full rounded-md border border-line bg-s2 px-3 font-mono text-xs text-ink outline-none focus:border-gold/50"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Blockchain, IPFS & NFC Hardware Cryptographic Proofs */}
            <div className="edge mt-6 rounded-lg bg-s1 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Blockchain &amp; NFC Cryptographic Proof</h2>
                  <p className="mt-0.5 text-xs text-ink3">Verified live against Polygon PoS &amp; NTAG424 DNA hardware registry</p>
                </div>
                {cert.nfcTag && (
                  <Button size="sm" variant="outline" onClick={handleNfcTap} disabled={tapping}>
                    {tapping ? <Loader2 className="size-3.5 animate-spin text-gold" /> : <Radio className="size-3.5 text-gold" />}
                    Tap NFC ({cert.nfcTag.tapCount} taps)
                  </Button>
                )}
              </div>

              <dl className="mt-4 space-y-2.5 font-mono text-xs tnum">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-ink3">Smart Contract (Polygon)</dt>
                  <dd className="flex items-center gap-2 text-ink2">
                    <span className="truncate max-w-[220px] sm:max-w-xs">{cert.contractAddress || "0x38F087796d11eB40A5581B855Dcb2b3cEb78d3Fa"}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(cert.contractAddress || "0x38F087796d11eB40A5581B855Dcb2b3cEb78d3Fa");
                        toast("Contract address copied");
                      }}
                      className="text-gold hover:text-gold-strong"
                      aria-label="Copy contract address"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-ink3">ERC-721 Token ID</dt>
                  <dd className="text-gold">{cert.tokenId}</dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-ink3">IPFS Metadata URI</dt>
                  <dd className="truncate max-w-[240px] sm:max-w-sm text-ink2">{cert.ipfs}</dd>
                </div>
                {cert.artisanSignature && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="text-ink3">Artisan ECDSA Signature</dt>
                    <dd className="truncate max-w-[220px] sm:max-w-xs text-ink2">{cert.artisanSignature}</dd>
                  </div>
                )}
                {cert.hashProof && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="text-ink3">SHA-256 Asset Hash</dt>
                    <dd className="truncate max-w-[220px] sm:max-w-xs text-ink2">{cert.hashProof}</dd>
                  </div>
                )}
                {cert.nfcTag && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                    <dt className="text-ink3">NFC Chip UID ({cert.nfcTag.standard})</dt>
                    <dd className="text-ink2">
                      {cert.nfcTag.uid} · Batch {cert.nfcTag.batch} · <span className="text-gold">{cert.nfcTag.tapCount} taps</span>
                    </dd>
                  </div>
                )}
              </dl>

              {cert.verificationStatus && (
                <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4 text-xs">
                  <a
                    href={cert.verificationStatus.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-gold hover:text-gold-strong"
                  >
                    Inspect on PolygonScan (Amoy)
                    <ExternalLink className="size-3.5" />
                  </a>
                  <a
                    href={cert.verificationStatus.ipfsGatewayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-ink2 hover:text-ink"
                  >
                    Open IPFS metadata
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* ownership history */}
            <div className="edge mt-6 rounded-lg bg-s1 p-6">
              <h2 className="text-sm font-semibold text-ink">The piece's provenance record</h2>
              <ProvenanceTimeline
                className="mt-4"
                steps={[
                  ...cert.history.map(
                    (h): ProvStep => ({ label: h.label, date: formatDate(h.date), actor: h.actor, state: "done" })
                  ),
                  ...(!isClaimed ? [{ label: "Awaiting its keeper", state: "pending" as const }] : []),
                ]}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <Link to="/verify" className="inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink">
                ← Verify another piece
              </Link>
              {mask && (
                <Link to={`/masks/${mask.slug}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gold transition-colors hover:text-gold-strong">
                  View {mask.name} in collection →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
