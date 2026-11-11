import type { ModelViewerElement } from "@google/model-viewer";
import { Camera, CameraOff, Loader2, Mouse, QrCode, RefreshCw, RotateCcw, Ruler, ScanLine, Smartphone, Sparkles } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/mock/api";
import type { Mask } from "@/lib/types";
import { cn } from "@/utils/cn";
import { Button, Modal } from "./kit";
import { ArchivePlate, ImageFrame } from "./MaskImage";
import { photos } from "@/lib/photos";

type ViewerStatus = "idle" | "loading" | "error";
const WALL_ORBIT = "0deg 90deg 102%";
// Catalog scans are Z-up and face +X. The viewer expects Y-up and +Z.
const CATALOG_ORIENTATION = "0deg -90deg -90deg";

const previewModes = [
  { id: "wall", label: "Wall preview", Icon: Ruler },
  { id: "camera", label: "Live camera", Icon: Camera },
  { id: "qr", label: "Phone QR", Icon: QrCode },
] as const;

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
          <ImageFrame
            src={mask.image || photos.cobraMask.src}
            alt={mask.name}
            ratio="aspect-[4/3]"
            position={photos.cobraMask.position}
            className="rounded-md"
          />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-ink">
          {generating
            ? "Reconstructing 3D mesh via TripoSR AI…"
            : scanning
              ? "Preparing the 3D study"
              : "3D scan ready to generate"}
        </p>
        <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-ink3">
          {generating
            ? "Removing background and extracting 3D geometry (~10 seconds)…"
            : scanning
              ? "Loading the photogrammetry viewer…"
              : `Generate or reload the interactive 3D mesh for ${mask.name} from the studio archive.`}
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

/** Inline 3D/AR viewer connected to Media Service S3 stream + local fallback + TripoSR AI reconstruction. */
export function ModelViewerPanel({
  mask,
  customSrc,
  enableAR = true,
  previewMode,
  className,
}: {
  mask: Mask;
  customSrc?: string;
  enableAR?: boolean;
  previewMode?: "wall" | "camera";
  className?: string;
}) {
  const libReady = useModelViewerLib();
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const [useStaticFallback, setUseStaticFallback] = useState(false);
  const [generatedSrc, setGeneratedSrc] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const viewerRef = useRef<ModelViewerElement | null>(null);

  useEffect(() => {
    setUseStaticFallback(false);
    setGeneratedSrc(null);
    setStatus("loading");
  }, [mask.slug, customSrc]);

  const activeSrc =
    customSrc ||
    generatedSrc ||
    (useStaticFallback ? `/models/${mask.slug}.glb` : `/api/media/stream/models/${mask.slug}.glb`);

  useEffect(() => {
    if (!libReady || !viewerRef.current) return;
    setStatus("loading");
    const el = viewerRef.current;
    const onLoad = () => setStatus("idle");
    const onError = () => {
      if (!customSrc && !generatedSrc && !useStaticFallback) {
        setUseStaticFallback(true);
      } else {
        setStatus("error");
      }
    };
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [libReady, attempt, activeSrc, customSrc, generatedSrc, useStaticFallback]);

  const handleGenerateAI = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const imgUrl = mask.image || "/images/masks/naga-raja-kolam.jpg";
      const imgRes = await fetch(imgUrl);
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

  if (!libReady || generating) {
    return <ViewerFallback mask={mask} scanning={!generating} generating={generating} className={className} />;
  }
  if (status === "error")
    return (
      <ViewerFallback
        mask={mask}
        className={className}
        onGenerateAI={handleGenerateAI}
        onRetry={() => {
          setUseStaticFallback(false);
          setStatus("loading");
          setAttempt((n) => n + 1);
        }}
      />
    );

  return (
    <div className={cn("relative overflow-hidden rounded-lg", !previewMode && "edge bg-s2", className)}>
      <model-viewer
        key={`${activeSrc}-${attempt}`}
        ref={(el) => {
          viewerRef.current = el;
        }}
        src={activeSrc}
        poster={mask.image}
        alt={`Interactive 3D study of the ${mask.name}`}
        camera-controls
        auto-rotate={!previewMode}
        orientation={!customSrc && !generatedSrc ? CATALOG_ORIENTATION : undefined}
        camera-orbit={previewMode ? WALL_ORBIT : "0deg 75deg 105%"}
        interaction-prompt={previewMode ? "none" : undefined}
        touch-action={previewMode ? "pan-y" : undefined}
        ar={enableAR}
        ar-modes="webxr scene-viewer quick-look"
        shadow-intensity={previewMode ? 0 : 0.85}
        shadow-softness="0.75"
        environment-image="neutral"
        exposure={previewMode ? 0.95 : 1.05}
        loading="eager"
        className={cn("block size-full bg-transparent", !previewMode && "min-h-[340px]")}
      />
      {previewMode && status === "idle" && (
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
    </div>
  );
}

/**
 * "View on your wall" — Interactive AR & Wall Scale Launcher.
 * Works on both desktop (Wall Scale + Live Webcam AR overlay + Mobile QR hand-off) and mobile (Camera AR + WebXR/QuickLook).
 */
export function ARLauncher({ mask }: { mask: Mask }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [mode, setMode] = useState<(typeof previewModes)[number]["id"]>("wall");
  const [qr, setQr] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!viewerOpen || mode !== "camera") {
      stopCamera();
      return;
    }
    let active = true;
    setCamError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Camera access is unavailable in this browser.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (active) {
          setCamError("Camera unavailable. Check your browser permissions and camera connection.");
        }
      });
    return () => {
      active = false;
      stopCamera();
    };
  }, [viewerOpen, mode]);

  const openModal = async () => {
    setViewerOpen(true);
    setMode("wall");
    try {
      const url = `${window.location.origin}/masks/${mask.slug}?ar=1`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 240,
        margin: 1,
        color: { dark: "#16120A", light: "#F4EFE6" },
      });
      setQr(dataUrl);
    } catch {}
  };

  const closeModal = () => {
    stopCamera();
    setViewerOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="lg" className="w-full justify-center" onClick={openModal}>
        <ScanLine className="size-4 text-gold" />
        View on your wall (3D &amp; AR)
      </Button>

      <Modal open={viewerOpen} onClose={closeModal} title={`${mask.name} · Wall & AR preview`} maxWidth="max-w-4xl">
        <div role="group" aria-label="Preview mode" className="mb-4 grid grid-cols-3 gap-1 rounded-lg border border-line bg-canvas p-1 sm:inline-grid">
          {previewModes.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                "flex min-h-11 flex-wrap items-center justify-center gap-x-2 gap-y-0 rounded-lg px-1 py-1 text-center text-xs font-medium leading-tight transition-colors sm:px-4",
                mode === id ? "edge bg-s3 text-gold" : "text-ink2 hover:bg-s2 hover:text-ink"
              )}
            >
              <Icon className="hidden size-4 shrink-0 min-[360px]:block" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {mode === "qr" ? (
          <div className="flex flex-col items-center justify-center gap-6 rounded-lg border border-line bg-s2 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
            <div className="shrink-0 rounded-lg bg-[#F4EFE6] p-3">
              {qr ? (
                <img src={qr} alt={`QR code to open the ${mask.name} AR preview`} className="size-44" />
              ) : (
                <div className="skel size-44 rounded-md" />
              )}
            </div>
            <div className="max-w-xs text-sm leading-relaxed text-ink2">
              <p className="flex items-center justify-center gap-2 font-medium text-ink sm:justify-start">
                <Smartphone className="size-4 text-gold" aria-hidden="true" />
                Scan with your phone camera
              </p>
              <p className="mt-1.5">
                Open the 3D study, then use the AR control on a supported phone to place the mask in your space.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-s2">
            <div className="relative h-[clamp(15rem,54dvh,29rem)] bg-[radial-gradient(ellipse_at_50%_40%,var(--s3)_0%,var(--s2)_52%,var(--canvas)_100%)]">
              {mode === "camera" && !camError && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 size-full object-cover"
                />
              )}
              <ModelViewerPanel
                mask={mask}
                previewMode={mode}
                className="size-full"
              />
            </div>
            {mode === "camera" && camError && (
              <div role="status" className="flex items-center gap-2 border-t border-line px-4 py-2 text-xs text-ink2">
                <CameraOff className="size-4 shrink-0 text-gold" aria-hidden="true" />
                <span>{camError}</span>
              </div>
            )}
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
