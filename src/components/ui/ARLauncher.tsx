import type { ModelViewerElement } from "@google/model-viewer";
import { Loader2, Mouse, QrCode, RefreshCw, RotateCcw, Ruler, ScanLine, Smartphone, Sparkles } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { api, mediaStreamUrl } from "@/lib/mock/api";
import refinedScans from "@/lib/refined-scans.json";
import type { Mask } from "@/lib/types";
import { cn } from "@/utils/cn";
import { Button, Modal } from "./kit";
import { ArchivePlate, MaskArtwork } from "./MaskImage";

type ViewerStatus = "idle" | "loading" | "error";
const WALL_ORBIT = "0deg 90deg 102%";
// Legacy streamed catalog scans are Z-up and face +X.
const CATALOG_ORIENTATION = "0deg -90deg -90deg";
// These bundled scans have been matched to the corresponding studio photographs.
const REFINED_SCANS = new Set(refinedScans);

const previewModes = [
  { id: "wall", label: "Wall preview", Icon: Ruler },
  { id: "qr", label: "Phone QR", Icon: QrCode },
] as const;

function mobileARPlatform() {
  if (/Android/i.test(navigator.userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  return null;
}

function bundledQuickLookUrl(slug: string) {
  if (!import.meta.env.PROD || !REFINED_SCANS.has(slug)) return undefined;
  return `/models/${encodeURIComponent(slug)}.usdz`;
}

function QuickLookLink({ href, mask, className }: { href: string; mask: Mask; className?: string }) {
  return (
    <a
      rel="ar"
      href={href}
      aria-label="View in AR"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-medium text-on-gold shadow-md hover:bg-gold-strong after:content-[attr(aria-label)]",
        className,
      )}
    >
      <img src={mask.image || "/favicon.svg"} alt="" className="size-6 rounded-full object-cover" />
    </a>
  );
}

function useModelViewerLib() {
  const [libReady, setLibReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    import("@google/model-viewer")
      .then(() => mounted && setLibReady(true))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return libReady;
}

function ViewerFallback({
  mask,
  onRetry,
  onGenerateAI,
  scanning,
  generating,
  className,
}: {
  mask: Mask;
  onRetry?: () => void;
  onGenerateAI?: () => void;
  scanning?: boolean;
  generating?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("edge relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-y-auto rounded-lg bg-s2 p-4 text-center", className)}>
      {scanning || generating ? (
        <Loader2 className="size-6 animate-spin text-gold" aria-hidden="true" />
      ) : (
        <div className="hidden w-full max-w-[150px] sm:block">
          <MaskArtwork mask={mask} ratio="aspect-[4/3]" className="rounded-md" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-ink">
          {generating
            ? "Reconstructing 3D mesh via TripoSR AI…"
            : scanning
              ? "Preparing the 3D study"
              : "3D preview unavailable"}
        </p>
        <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-ink3">
          {generating
            ? "Removing background and extracting 3D geometry (~10 seconds)…"
            : scanning
              ? "Loading the photogrammetry viewer…"
              : onGenerateAI
                ? "Retry the scan or create a 3D preview from the studio photograph."
                : "The studio scan could not be loaded."}
        </p>
      </div>
      {!scanning && !generating && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onGenerateAI && (
            <Button size="sm" onClick={onGenerateAI}>
              <Sparkles className="size-3.5" />
              Generate 3D with AI
            </Button>
          )}
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="size-3.5" />
              Retry stream
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Inline 3D/AR viewer for studio scans and photo reconstructions. */
export function ModelViewerPanel({
  mask,
  customSrc,
  wallPreview = false,
  className,
}: {
  mask: Mask;
  customSrc?: string;
  wallPreview?: boolean;
  className?: string;
}) {
  const libReady = useModelViewerLib();
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const [skipRefinedScan, setSkipRefinedScan] = useState(false);
  const [generatedSrc, setGeneratedSrc] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [launchingAR, setLaunchingAR] = useState(false);
  const [arError, setARError] = useState<string | null>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const platform = mobileARPlatform();
  // iOS hands off to the native viewer. Android WebXR runs in the page.
  const canRequestAR = platform === "ios" || (platform === "android" && window.isSecureContext);

  useEffect(() => {
    setSkipRefinedScan(false);
    setGeneratedSrc(null);
    setStatus("loading");
  }, [mask.slug, customSrc]);

  const useRefinedScan = !customSrc && !generatedSrc && !skipRefinedScan && REFINED_SCANS.has(mask.slug);
  const iosSrc = platform === "ios" && useRefinedScan ? bundledQuickLookUrl(mask.slug) : undefined;
  const nativeQuickLook = iosSrc && document.createElement("a").relList.supports("ar");
  const activeSrc =
    customSrc ||
    generatedSrc ||
    (useRefinedScan
      ? `/models/${encodeURIComponent(mask.slug)}.glb?v=3`
      : mediaStreamUrl(`models/${mask.slug}.glb`));

  useEffect(() => {
    if (!libReady || !viewerRef.current) return;
    setStatus("loading");
    setARError(null);
    const el = viewerRef.current;
    const onLoad = () => setStatus("idle");
    const onError = () => {
      if (useRefinedScan) {
        setSkipRefinedScan(true);
      } else {
        setStatus("error");
      }
    };
    const onARStatus = (event: Event) => {
      if ((event as CustomEvent<{ status: string }>).detail.status === "failed") {
        setARError("AR could not open. Try Safari on iPhone or Chrome on an Android phone with Google Play Services for AR.");
      }
    };
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    el.addEventListener("ar-status", onARStatus);
    if (el.loaded) onLoad();
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
      el.removeEventListener("ar-status", onARStatus);
    };
  }, [libReady, attempt, activeSrc, useRefinedScan]);

  const handleGenerateAI = async () => {
    if (generating || !mask.image) return;
    setGenerating(true);
    try {
      const imgRes = await fetch(mask.image);
      if (!imgRes.ok) throw new Error("Studio photograph could not be loaded");
      const blob = await imgRes.blob();
      const res = await api.generate3DModel(blob, mask.slug, mask.artisanSlug);
      setGeneratedSrc(res.src);
      setStatus("loading");
      setAttempt((n) => n + 1);
    } catch {
      setStatus("error");
    } finally {
      setGenerating(false);
    }
  };

  const resetView = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraOrbit = WALL_ORBIT;
    viewer.cameraTarget = "auto auto auto";
    viewer.fieldOfView = "auto";
    viewer.jumpCameraToGoal();
  };

  const openAR = async () => {
    const viewer = viewerRef.current;
    if (!viewer?.loaded || launchingAR) return;
    if (!viewer.canActivateAR) {
      setARError(platform === "ios"
        ? "AR is unavailable here. Open this page in Safari on a compatible iPhone or iPad."
        : "AR is unavailable here. Open this page in Chrome on a compatible Android device with Google Play Services for AR.");
      return;
    }
    setARError(null);
    setLaunchingAR(true);
    try {
      // Keep the native launch on the tap that granted browser user activation.
      await viewer.activateAR();
    } catch {
      setARError("AR could not open. Try again from your phone’s browser.");
    } finally {
      setLaunchingAR(false);
    }
  };

  if (!libReady || generating) {
    return <ViewerFallback mask={mask} scanning={!generating} generating={generating} className={className} />;
  }
  if (status === "error")
    return (
      <ViewerFallback
        mask={mask}
        className={className}
        onGenerateAI={mask.image ? handleGenerateAI : undefined}
        onRetry={() => {
          setSkipRefinedScan(false);
          setStatus("loading");
          setAttempt((n) => n + 1);
        }}
      />
    );

  return (
    <div className={cn("relative overflow-hidden rounded-lg", !wallPreview && "edge bg-s2", className)}>
      <model-viewer
        key={`${activeSrc}-${attempt}`}
        ref={(el) => {
          viewerRef.current = el;
        }}
        src={activeSrc}
        poster={mask.image}
        alt={`Interactive 3D study of the ${mask.name}`}
        camera-controls
        data-lenis-prevent-wheel
        auto-rotate={!wallPreview && !platform}
        orientation={!customSrc && !generatedSrc && !useRefinedScan ? CATALOG_ORIENTATION : undefined}
        camera-orbit={wallPreview ? WALL_ORBIT : "0deg 75deg 105%"}
        interaction-prompt={wallPreview ? "none" : undefined}
        touch-action="pan-y"
        ar={canRequestAR}
        ar-modes={platform === "ios" ? "quick-look" : window.location.protocol === "https:" ? "webxr scene-viewer" : "webxr"}
        ios-src={iosSrc}
        ar-placement="wall"
        shadow-intensity={wallPreview ? 0 : 0.85}
        shadow-softness="0.75"
        environment-image="neutral"
        exposure={wallPreview ? 0.95 : 1.05}
        loading="eager"
        style={{ "--ar-button-display": "none" } as React.CSSProperties}
        className={cn("block size-full bg-transparent", !wallPreview && "min-h-[340px]")}
      />
      {wallPreview && status === "idle" && (
        <button
          type="button"
          onClick={resetView}
          className="absolute top-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-s1 px-3 text-xs font-medium text-ink2 shadow-sm transition-colors hover:bg-s3 hover:text-ink"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset view
        </button>
      )}
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-s1/60">
          <Loader2 className="size-6 animate-spin text-gold" aria-hidden="true" />
        </div>
      )}
      {platform && (nativeQuickLook || status === "idle") && (
        <div className="absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
          {nativeQuickLook ? (
            <QuickLookLink href={iosSrc} mask={mask} />
          ) : canRequestAR && (
            <Button type="button" onClick={openAR} disabled={launchingAR} className="min-h-11 shadow-md">
              {launchingAR
                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <ScanLine className="size-4" aria-hidden="true" />}
              {launchingAR ? "Opening AR…" : "View on your wall in AR"}
            </Button>
          )}
          {!nativeQuickLook && (arError || !canRequestAR) && (
            <p role="status" className="max-w-sm rounded-lg bg-s1 px-3 py-2 text-center text-xs text-ink">
              {arError || "Open this page over HTTPS to use AR."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Desktop 3D preview and QR hand-off, or a phone preview with native AR. */
export function ARLauncher({ mask }: { mask: Mask }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [mode, setMode] = useState<(typeof previewModes)[number]["id"]>("wall");
  const [qr, setQr] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const platform = mobileARPlatform();
  const quickLookUrl = platform === "ios" && document.createElement("a").relList.supports("ar")
    ? bundledQuickLookUrl(mask.slug)
    : undefined;
  const phoneUrl = new URL(`/masks/${encodeURIComponent(mask.slug)}?ar=1`, window.location.origin).href;

  useEffect(() => {
    if (!viewerOpen || mode !== "qr") return;
    let current = true;
    setQr(null);
    setQrFailed(false);
    QRCode.toDataURL(phoneUrl, {
      width: 240,
      margin: 4,
      color: { dark: "#16120A", light: "#F4EFE6" },
    })
      .then((dataUrl) => { if (current) setQr(dataUrl); })
      .catch(() => { if (current) setQrFailed(true); });
    return () => { current = false; };
  }, [viewerOpen, mode, phoneUrl]);

  return (
    <>
      {quickLookUrl ? (
        <QuickLookLink href={quickLookUrl} mask={mask} className="h-12 w-full" />
      ) : (
        <Button variant="outline" size="lg" className="w-full justify-center" onClick={() => {
          setMode("wall");
          setViewerOpen(true);
        }}>
          <ScanLine className="size-4 text-gold" aria-hidden="true" />
          {platform ? "Preview on your wall in AR" : "View on your wall in 3D"}
        </Button>
      )}

      <Modal open={viewerOpen} onClose={() => setViewerOpen(false)} title={`${mask.name} · Wall preview`} maxWidth="max-w-4xl">
        {!platform && (
          <div role="group" aria-label="Preview mode" className="mb-4 inline-grid grid-cols-2 gap-1 rounded-lg border border-line bg-canvas p-1">
            {previewModes.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-1 text-xs font-medium transition-colors",
                  mode === id ? "edge bg-s3 text-gold" : "text-ink2 hover:bg-s2 hover:text-ink"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        )}

        {mode === "qr" ? (
          <div className="flex flex-col items-center justify-center gap-6 rounded-lg border border-line bg-s2 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
            {!qrFailed && (
              <div className="shrink-0 rounded-lg bg-[#F4EFE6] p-3">
                {qr ? (
                  <img src={qr} alt={`QR code to open the ${mask.name} AR preview`} className="size-44" />
                ) : (
                  <div className="skel size-44 rounded-md" />
                )}
              </div>
            )}
            <div className="max-w-xs text-sm leading-relaxed text-ink2">
              <p className="flex items-center justify-center gap-2 font-medium text-ink sm:justify-start">
                <Smartphone className="size-4 text-gold" aria-hidden="true" />
                {qrFailed ? "Open on your phone" : "Scan with your phone camera"}
              </p>
              <p className="mt-1.5">
                Open this mask on your phone, then tap the AR button.
              </p>
              {qrFailed && <a href={phoneUrl} className="mt-2 inline-block text-gold underline">Open the phone preview</a>}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-s2">
            <div className="relative h-[clamp(15rem,54dvh,29rem)] bg-[radial-gradient(ellipse_at_50%_40%,var(--s3)_0%,var(--s2)_52%,var(--canvas)_100%)]">
              <ModelViewerPanel mask={mask} wallPreview className="size-full" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line px-4 py-3 text-xs">
              <div className="inline-flex items-center gap-2 text-ink2">
                <Ruler className="size-4 shrink-0 text-gold" aria-hidden="true" />
                <span className="tnum">{mask.heightCm} H × {mask.widthCm} W × {mask.depthCm} D cm · {mask.weightKg} kg</span>
              </div>
              <div className="inline-flex items-center gap-2 text-ink3">
                <Mouse className="size-4 shrink-0" aria-hidden="true" />
                <span>Drag to rotate · Pinch or scroll to zoom</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export { ArchivePlate };
