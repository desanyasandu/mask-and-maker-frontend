import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  Layers,
  Loader2,
  QrCode,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/mock/api";
import type { Certificate } from "@/lib/types";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { BorderBeam } from "@/components/ui/surfaces";

export function VerifierDesk() {
  const [query, setQuery] = useState("MM-2025-0338");
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [nfcResult, setNfcResult] = useState<{
    authenticated: boolean;
    certId?: string;
    maskName?: string;
    artisanName?: string;
    tapCount?: number;
  } | null>(null);

  const toast = useApp((s) => s.toast);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setLoading(true);
    setCertificate(null);
    setNfcResult(null);

    try {
      if (clean.startsWith("04:") || clean.includes(":")) {
        // NFC UID query
        const res = await api.authenticateNfc(clean);
        if (res && res.cert) {
          setCertificate(res.cert);
          toast("NFC Tag authenticated against registry", { kind: "success" });
        } else if (res && res.authenticated) {
          toast("Physical NFC Tag verified", { kind: "success" });
        } else {
          toast("NFC Tag not recognized in registry", { kind: "error" });
        }
      } else {
        // Certificate ID query
        const cert = await api.verifyCertificate(clean);
        setCertificate(cert);
        if (cert) {
          toast(`Certificate ${clean} verified on Polygon`, { kind: "success" });
        } else {
          toast("No certificate found with that ID", { kind: "error" });
        }
      }
    } catch {
      toast("Verification query failed", { kind: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-8">
      {/* Verifier Header Banner */}
      <div className="edge relative overflow-hidden rounded-lg bg-s1 p-6">
        <BorderBeam size={180} duration={14} colorFrom="#10b981" colorTo="#c9a45c" />
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
          <Fingerprint className="size-3.5" />
          Heritage Authentication &amp; NFC Tag Desk
        </div>
        <h2 className="mt-2 font-display text-2xl text-ink">Physical &amp; Cryptographic Verification</h2>
        <p className="mt-1 text-xs text-ink3">
          Authenticate physical NTAG 424 DNA tamper-evident tags, audit Polygon digital twins, and inspect IPFS metadata.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleVerify} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Certificate ID (e.g. MM-2025-0338) or NFC Tag UID (e.g. 04:7B:3F:8A:2C:19:80)"
              className="w-full rounded-md border border-line bg-s2 py-2.5 pl-9 pr-3 font-mono text-xs text-ink placeholder:text-ink3 focus:border-gold focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-gold px-4 py-2 text-xs font-semibold text-black hover:bg-gold/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
            Verify Authenticity
          </button>
        </form>
      </div>

      {/* Verification Result Card */}
      {certificate && (
        <div className="edge rounded-lg bg-s1 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="font-mono text-xs text-gold">REGISTRY CERTIFICATE</span>
              <h3 className="font-display text-xl text-ink">{certificate.id}</h3>
              <span className="text-xs text-ink3">
                Mask: {certificate.maskSlug} · Carver: {certificate.artisanSlug}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                  certificate.isTampered
                    ? "border border-red-500/40 bg-red-500/10 text-red-400"
                    : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                )}
              >
                {certificate.isTampered ? (
                  <>
                    <AlertTriangle className="size-3.5" /> TAMPER ALERT DETECTED
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" /> Physical &amp; Digital Proofs Intact
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Cryptographic Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Polygon On-Chain */}
            <div className="rounded-lg border border-line bg-s2 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                Polygon Blockchain
              </span>
              <div className="mt-2 space-y-1 font-mono text-xs text-ink2">
                <p>
                  <span className="text-ink3">Token ID:</span> {certificate.tokenId || "338"}
                </p>
                <p className="truncate">
                  <span className="text-ink3">Contract:</span> {certificate.contractAddress || "0x38F0...Fa"}
                </p>
                <p>
                  <span className="text-ink3">Minted:</span> {certificate.mintedAt || "2025-09-21"}
                </p>
              </div>
            </div>

            {/* 2. NFC Hardware Tag */}
            <div className="rounded-lg border border-line bg-s2 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                NTAG 424 DNA Hardware
              </span>
              <div className="mt-2 space-y-1 font-mono text-xs text-ink2">
                <p>
                  <span className="text-ink3">UID:</span> {certificate.nfcTag?.uid || "04:7B:3F:8A:2C:19:80"}
                </p>
                <p>
                  <span className="text-ink3">Tap Count:</span> {certificate.nfcTag?.tapCount || 8}
                </p>
                <p>
                  <span className="text-ink3">Batch:</span> {certificate.nfcTag?.batch || "AMB-2025-B2"}
                </p>
              </div>
            </div>

            {/* 3. Decentralized IPFS Storage */}
            <div className="rounded-lg border border-line bg-s2 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                IPFS Provenance Pin
              </span>
              <div className="mt-2 space-y-1 text-xs text-ink2">
                <p className="truncate font-mono">
                  <span className="text-ink3">CID:</span> {certificate.ipfs || "bafybeig7m2rvkq7xe4p3kqux3kqz9"}
                </p>
                <p className="truncate font-mono">
                  <span className="text-ink3">SHA-256:</span> {certificate.hashProof ? certificate.hashProof.slice(0, 16) + "..." : "e3b0c44298fc1c14..."}
                </p>
              </div>
            </div>
          </div>

          {/* History Timeline */}
          {certificate.history && certificate.history.length > 0 && (
            <div>
              <h4 className="font-display text-sm text-ink">Provenance Timeline</h4>
              <div className="mt-3 space-y-2">
                {certificate.history.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-md border border-line/60 bg-s2/60 px-3 py-2 text-xs">
                    <span className="font-medium text-ink">{step.label}</span>
                    <div className="text-right">
                      <span className="text-ink3">{step.actor}</span>
                      <span className="ml-2 font-mono text-[11px] text-gold">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
