import {
  Camera,
  Check,
  ChevronRight,
  DollarSign,
  FileCheck2,
  Loader2,
  Ruler,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/mock/api";
import type { Tradition } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/kit";
import { BorderBeam } from "@/components/ui/surfaces";

const TRADITIONS: { id: Tradition; label: string; desc: string }[] = [
  { id: "raksha", label: "Raksha (Demons & Protectors)", desc: "Apotropaic ritual masks guarding against misfortune" },
  { id: "sanni", label: "Sanni (Eighteen Afflictions)", desc: "Healing masks danced in the southern Tovil exorcisms" },
  { id: "kolam", label: "Kolam (Rural Folk Comedy)", desc: "Narrative and satirical village dance theatre characters" },
];

const WOOD_SPECIES = [
  "Kaduru heartwood (Strychnos nux-vomica)",
  "Ginisapu (Michelia champaca)",
  "Velanga (Pterospermum suberifolium)",
  "Albesia lightwood (Albisia lebbeck)",
];

const PIGMENT_OPTIONS = [
  "Hingula vermilion",
  "Kanaviru green",
  "Gold orpiment",
  "Lamp-soot black",
  "Bone white",
  "Cochineal lake",
  "Beeswax polish",
  "Alliyadi resin primer",
];

const MINT_STEPS = [
  "Cryptographically fingerprinting photography (SHA-256)",
  "Pinning 3D asset and cultural metadata to IPFS",
  "Minting digital twin token on Polygon blockchain",
  "Pairing NTAG 424 DNA tamper-evident NFC tag",
];

interface MaskCreateFormProps {
  artisanSlug?: string;
  artisanName?: string;
  onSuccess?: () => void;
}

export function MaskCreateForm({
  artisanSlug = "chandana-bandara",
  artisanName = "Chandana Bandara",
  onSuccess,
}: MaskCreateFormProps) {
  const toast = useApp((s) => s.toast);
  const currency = useApp((s) => s.currency);

  // Form State
  const [name, setName] = useState("");
  const [sinhala, setSinhala] = useState("");
  const [tradition, setTradition] = useState<Tradition>("raksha");
  const [woodSpecies, setWoodSpecies] = useState(WOOD_SPECIES[0]);
  const [heightCm, setHeightCm] = useState(44);
  const [widthCm, setWidthCm] = useState(36);
  const [depthCm, setDepthCm] = useState(18);
  const [weightKg, setWeightKg] = useState(1.4);
  const [carvingDays, setCarvingDays] = useState(24);
  const [selectedPigments, setSelectedPigments] = useState<string[]>([
    "Hingula vermilion",
    "Kanaviru green",
    "Lamp-soot black",
    "Beeswax polish",
  ]);
  const [story, setStory] = useState("");
  const [priceLKR, setPriceLKR] = useState<number>(85000);
  const [stock, setStock] = useState<number>(1);

  // Media & 3D
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [photoKey, setPhotoKey] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [scanStreamUrl, setScanStreamUrl] = useState<string>("");
  const [scanKey, setScanKey] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Minting & Publishing
  const [mintStage, setMintStage] = useState(-1);
  const [minted, setMinted] = useState(false);
  const [publishedCertId, setPublishedCertId] = useState("");
  const [publishedSlug, setPublishedSlug] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanTimer = useRef<number | undefined>(undefined);

  const togglePigment = (p: string) => {
    setSelectedPigments((prev) => (prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const localPreview = URL.createObjectURL(file);
    setUploadedPhotoUrl(localPreview);
    setScanStreamUrl("");
    setScanKey("");

    try {
      setUploading(true);
      const res = await api.uploadMediaFile(file);
      setPhotoKey(res.key);
      toast("Photograph uploaded to MinIO storage", { kind: "success" });
    } catch {
      toast("Local photo ready", { description: "Stored locally for 3D reconstruction and preview." });
    } finally {
      setUploading(false);
    }
  };

  const handleRun3DScan = async () => {
    if (!uploadedFile && !uploadedPhotoUrl) {
      toast("Please upload a photograph first", { kind: "error" });
      return;
    }

    setScanning(true);
    setScanProgress(8);

    scanTimer.current = window.setInterval(() => {
      setScanProgress((p) => {
        if (p < 30) return p + 4;
        if (p < 75) return p + 2;
        if (p < 95) return p + 1;
        return 95;
      });
    }, 600);

    try {
      let blob: Blob | File = uploadedFile!;
      if (!blob && uploadedPhotoUrl) {
        const fetchRes = await fetch(uploadedPhotoUrl);
        blob = await fetchRes.blob();
      }

      const baseSlug = name.trim() ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "new-mask";
      const generatedSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      const result = await api.generate3DModel(blob, generatedSlug, artisanSlug);

      window.clearInterval(scanTimer.current);
      setScanProgress(100);
      setScanKey(result.key);
      setScanStreamUrl(result.src);
      setScanning(false);

      toast("3D model generated from photo (256 resolution)", {
        description: "Laplacian smoothing and studio lighting applied. Interactive preview ready.",
        kind: "success",
      });
    } catch (err: unknown) {
      window.clearInterval(scanTimer.current);
      setScanProgress(0);
      setScanning(false);
      const msg = err instanceof Error ? err.message : "3D mesh generation encountered an error.";
      toast("3D reconstruction failed", {
        description: `${msg}. Please verify your photo and try again.`,
        kind: "error",
      });
    }
  };

  const handleMintAndPublish = async () => {
    if (!name.trim()) {
      toast("Please provide a mask title", { kind: "error" });
      return;
    }

    setMintStage(0);
    const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      // 1. Create Draft Listing
      const draft = await api.createListingDraft({
        name: name.trim(),
        artisanSlug,
        tradition,
        woodSpecies,
        priceLKR,
        stock,
        maskSlug: generatedSlug,
      });

      // Advance minting animation
      MINT_STEPS.forEach((_, idx) => {
        setTimeout(() => setMintStage(idx + 1), 700 * (idx + 1));
      });

      // 2. Mint Certificate
      const mintRes = await api.mintCertificate({
        listingId: draft.id,
        maskSlug: generatedSlug,
        artisanSlug,
        maskTitle: name.trim(),
        tradition,
        woodSpecies,
        priceLKR,
        photos: photoKey ? [photoKey] : (uploadedPhotoUrl ? [uploadedPhotoUrl] : []),
        scanUrl: scanKey || "",
      });

      setTimeout(async () => {
        const certId = mintRes.certificateId || `MM-2026-${Math.floor(Math.random() * 900 + 100)}`;
        setPublishedCertId(certId);
        setPublishedSlug(generatedSlug);

        // 3. Publish to public marketplace
        if (draft.id) {
          await api.publishListing(draft.id);
        }

        setMinted(true);
        toast("Mask successfully published & minted on Polygon!", {
          description: `Certificate ${certId} is live on the public registry.`,
          kind: "success",
        });

        if (onSuccess) onSuccess();
      }, 700 * MINT_STEPS.length + 300);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast("Publishing failed", { description: msg, kind: "error" });
      setMintStage(-1);
    }
  };

  // Economic breakdown (61 / 19 / 12 / 8)
  const artisanShare = Math.round(priceLKR * 0.61);
  const reforestationShare = Math.round(priceLKR * 0.19);
  const guildShare = Math.round(priceLKR * 0.12);
  const platformShare = Math.round(priceLKR * 0.08);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-12">
      {/* Left Form Column (7 cols) */}
      <div className="space-y-6 lg:col-span-7">
        {/* 1. Identity & Tradition */}
        <section className="edge relative overflow-hidden rounded-lg bg-s1 p-6" aria-label="Mask Identity">
          <BorderBeam duration={14} />
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Sparkles className="size-4 text-gold" />
            1. Mask Identity &amp; Sacred Lore
          </h2>
          <p className="mt-1 text-xs text-ink3">
            Every mask carved carries a lineage of stories. Registered directly under master carver {artisanName}.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mask-title" className="block text-xs font-medium text-ink2">
                Title in English *
              </label>
              <input
                id="mask-title"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gini Raksha (Fire Demon)"
                className="mt-1.5 w-full rounded-md border border-line bg-s2 px-3 py-2 text-sm text-ink placeholder:text-ink3 focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="mask-sinhala" className="block text-xs font-medium text-ink2">
                Sinhala Name (නාමය)
              </label>
              <input
                id="mask-sinhala"
                type="text"
                value={sinhala}
                onChange={(e) => setSinhala(e.target.value)}
                placeholder="උදා: ගිනි රක්ෂ"
                className="mt-1.5 w-full rounded-md border border-line bg-s2 px-3 py-2 font-sinhala text-sm text-ink placeholder:text-ink3 focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <span className="block text-xs font-medium text-ink2">Sacred Tradition</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {TRADITIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTradition(t.id)}
                  className={cn(
                    "rounded-md border p-3 text-left transition-all",
                    tradition === t.id
                      ? "border-gold bg-gold/[0.08] text-ink"
                      : "border-line bg-s2 text-ink3 hover:border-line2 hover:text-ink"
                  )}
                >
                  <p className="text-xs font-semibold capitalize text-ink">{t.label}</p>
                  <p className="mt-1 text-[11px] leading-tight text-ink3">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wood-species" className="block text-xs font-medium text-ink2">
                Timber Species
              </label>
              <select
                id="wood-species"
                value={woodSpecies}
                onChange={(e) => setWoodSpecies(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line bg-s2 px-3 py-2 text-xs text-ink focus:border-gold focus:outline-none"
              >
                {WOOD_SPECIES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="carving-days" className="block text-xs font-medium text-ink2">
                Days in Carving &amp; Rest
              </label>
              <input
                id="carving-days"
                type="number"
                min={1}
                value={carvingDays}
                onChange={(e) => setCarvingDays(Number(e.target.value))}
                className="mt-1.5 w-full rounded-md border border-line bg-s2 px-3 py-2 text-xs text-ink focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <span className="block text-xs font-medium text-ink2">Mineral Pigment Palette</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PIGMENT_OPTIONS.map((p) => {
                const active = selectedPigments.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePigment(p)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                      active
                        ? "border-gold/50 bg-gold/15 font-medium text-gold"
                        : "border-line bg-s2 text-ink3 hover:border-line2 hover:text-ink"
                    )}
                  >
                    {active && "✓ "}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="cultural-lore" className="block text-xs font-medium text-ink2">
              Cultural Story &amp; Origin
            </label>
            <textarea
              id="cultural-lore"
              rows={3}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Describe how the wood grain flows, the master's signature technique, or which festival this face enters..."
              className="mt-1.5 w-full rounded-md border border-line bg-s2 p-3 text-xs leading-relaxed text-ink placeholder:text-ink3 focus:border-gold focus:outline-none"
            />
          </div>
        </section>

        {/* 2. Physical Scale & Dimensions */}
        <section className="edge rounded-lg bg-s1 p-6" aria-label="Dimensions">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Ruler className="size-4 text-gold" />
            2. Dimensions &amp; Wall Scale
          </h2>
          <p className="mt-1 text-xs text-ink3">
            Accurate measurements allow collectors to scale the 3D mask onto their walls with centimeter precision.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="height-cm" className="block text-[11px] text-ink3">
                Height (cm)
              </label>
              <input
                id="height-cm"
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-line bg-s2 px-3 py-1.5 text-xs text-ink focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="width-cm" className="block text-[11px] text-ink3">
                Width (cm)
              </label>
              <input
                id="width-cm"
                type="number"
                value={widthCm}
                onChange={(e) => setWidthCm(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-line bg-s2 px-3 py-1.5 text-xs text-ink focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="depth-cm" className="block text-[11px] text-ink3">
                Depth (cm)
              </label>
              <input
                id="depth-cm"
                type="number"
                value={depthCm}
                onChange={(e) => setDepthCm(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-line bg-s2 px-3 py-1.5 text-xs text-ink focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="weight-kg" className="block text-[11px] text-ink3">
                Weight (kg)
              </label>
              <input
                id="weight-kg"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-line bg-s2 px-3 py-1.5 text-xs text-ink focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* 3. Fair-Trade Pricing */}
        <section className="edge rounded-lg bg-s1 p-6" aria-label="Pricing and Economics">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <DollarSign className="size-4 text-gold" />
            3. Fair-Trade Economics &amp; Registry Payout
          </h2>
          <p className="mt-1 text-xs text-ink3">
            Mask &amp; Maker guarantees a transparent 4-way settlement for every sale via smart contract escrow.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price-lkr" className="block text-xs font-medium text-ink2">
                Mask Price (LKR)
              </label>
              <input
                id="price-lkr"
                type="number"
                step="1000"
                value={priceLKR}
                onChange={(e) => setPriceLKR(Number(e.target.value))}
                className="mt-1.5 w-full rounded-md border border-line bg-s2 px-3 py-2 text-sm font-semibold text-gold focus:border-gold focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-ink3">≈ ${(priceLKR / 303).toFixed(0)} USD</span>
            </div>
            <div>
              <label htmlFor="stock-units" className="block text-xs font-medium text-ink2">
                Available Stock
              </label>
              <input
                id="stock-units"
                type="number"
                min={1}
                max={10}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="mt-1.5 w-full rounded-md border border-line bg-s2 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-ink3">1 for masterwork · 2+ for workshop series</span>
            </div>
          </div>

          {/* 4-way settlement pills */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md border border-gold/40 bg-gold/[0.08] p-2.5 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-gold">Master Artisan (61%)</span>
              <span className="mt-1 block font-mono text-xs font-bold text-ink">{formatMoney(artisanShare, currency)}</span>
            </div>
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/[0.06] p-2.5 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-emerald-400">Reforestation (19%)</span>
              <span className="mt-1 block font-mono text-xs font-bold text-ink">{formatMoney(reforestationShare, currency)}</span>
            </div>
            <div className="rounded-md border border-blue-500/30 bg-blue-500/[0.06] p-2.5 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-blue-400">Guild Fund (12%)</span>
              <span className="mt-1 block font-mono text-xs font-bold text-ink">{formatMoney(guildShare, currency)}</span>
            </div>
            <div className="rounded-md border border-line bg-s2 p-2.5 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-ink3">Platform Ops (8%)</span>
              <span className="mt-1 block font-mono text-xs font-bold text-ink">{formatMoney(platformShare, currency)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Media, 3D Scan & Minting (5 cols) */}
      <div className="space-y-6 lg:col-span-5">
        {/* Studio Photography & 3D Capture */}
        <section className="edge rounded-lg bg-s1 p-6" aria-label="Media & 3D Capture">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Camera className="size-4 text-gold" />
            Studio Photo &amp; 3D Scan
          </h2>
          <p className="mt-1 text-xs text-ink3">
            Upload a clear daylight photo of your mask. Our AI pipeline reconstructs an upright 3D GLB model in ~30s.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {/* Photo Dropzone / Preview */}
          <div className="mt-4">
            {uploadedPhotoUrl ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-line bg-s2">
                <img src={uploadedPhotoUrl} alt="Uploaded mask" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-2 rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="grid aspect-video cursor-pointer place-items-center rounded-lg border border-dashed border-line bg-s2 text-center transition-colors hover:border-gold/50 hover:bg-s3"
              >
                <div className="p-4">
                  <Upload className="mx-auto size-8 text-gold" />
                  <p className="mt-2 text-xs font-medium text-ink">Upload Mask Photograph</p>
                  <p className="mt-1 text-[11px] text-ink3">JPEG or PNG under 20MB · White/neutral background</p>
                </div>
              </div>
            )}
          </div>

          {/* AI 3D Reconstruction Button & Progress */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={scanning || uploading || (!uploadedPhotoUrl && !uploadedFile)}
              onClick={handleRun3DScan}
              className="w-full justify-center"
            >
              {scanning ? (
                <>
                  <Loader2 className="size-4 animate-spin text-gold" />
                  Reconstructing 3D Mesh ({scanProgress}%)...
                </>
              ) : (
                <>
                  <Wand2 className="size-4 text-gold" />
                  Generate 3D Model (TripoSR 256)
                </>
              )}
            </Button>
          </div>

          {/* 3D Model-Viewer Preview if ready */}
          {scanStreamUrl && (
            <div className="mt-4">
              <span className="block text-xs font-medium text-ink2">3D Interactive Preview</span>
              <div className="mt-1.5 h-64 overflow-hidden rounded-lg border border-line bg-s3">
                <model-viewer
                  src={scanStreamUrl}
                  alt="Generated 3D mask study"
                  camera-controls
                  auto-rotate
                  environment-image="neutral"
                  shadow-intensity="0.85"
                  shadow-softness="0.75"
                  camera-orbit="0deg 75deg 105%"
                  exposure="1.05"
                  style={{ width: "100%", height: "100%", background: "transparent" }}
                />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                <Check className="size-3.5" /> High-fidelity 3D mesh ready with Laplacian smoothing.
              </p>
            </div>
          )}
        </section>

        {/* Minting & Publishing Section */}
        <section className="edge rounded-lg bg-s1 p-6" aria-label="Mint & Publish">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <FileCheck2 className="size-4 text-gold" />
            Registry Verification &amp; Mint
          </h2>
          <p className="mt-1 text-xs text-ink3">
            Minting writes your provenance to Polygon Amoy testnet and registers the mask in the public catalog.
          </p>

          {/* Minting progress steps */}
          {mintStage >= 0 && !minted && (
            <div className="mt-4 space-y-2 rounded-lg border border-gold/30 bg-gold/[0.05] p-3 text-xs">
              {MINT_STEPS.map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  {mintStage > idx ? (
                    <Check className="size-3.5 text-gold" />
                  ) : mintStage === idx ? (
                    <Loader2 className="size-3.5 animate-spin text-gold" />
                  ) : (
                    <div className="size-3.5 rounded-full border border-line" />
                  )}
                  <span className={cn(mintStage >= idx ? "text-ink font-medium" : "text-ink3")}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Success Box */}
          {minted && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.08] p-4 text-xs text-ink">
              <p className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Check className="size-4" /> Certificate Issued: {publishedCertId}
              </p>
              <p className="mt-1 text-ink2">
                Your mask has been minted on Polygon and added to the public catalog.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/masks/${publishedSlug}`}
                  className="inline-flex items-center gap-1 rounded bg-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-gold/90"
                >
                  View in Marketplace
                  <ChevronRight className="size-3.5" />
                </Link>
                <Link
                  to={`/verify/${publishedCertId}`}
                  className="inline-flex items-center gap-1 rounded border border-line bg-s2 px-3 py-1.5 text-xs text-ink hover:bg-s3"
                >
                  Inspect Certificate
                </Link>
              </div>
            </div>
          )}

          {!minted && (
            <div className="mt-5">
              <Button
                type="button"
                variant="primary"
                disabled={mintStage >= 0 || !name.trim()}
                onClick={handleMintAndPublish}
                className="w-full justify-center"
              >
                {mintStage >= 0 ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-black" />
                    Minting Certificate...
                  </>
                ) : (
                  <>Mint on Polygon &amp; Publish to Marketplace</>
                )}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
