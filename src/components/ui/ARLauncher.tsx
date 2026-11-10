import { Camera, CameraOff, Loader2, QrCode, RefreshCw, Ruler, ScanLine, Smartphone, Sparkles } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/mock/api";
import type { Mask } from "@/lib/types";
import { cn } from "@/utils/cn";
import { Button, Modal } from "./kit";
import { ArchivePlate, ImageFrame } from "./MaskImage";
import { photos } from "@/lib/photos";

type ViewerStatus = "idle" | "loading" | "error";

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
}: {
  mask: Mask;
  onRetry?: () => void;
  onGenerateAI?: () => void;
  scanning?: boolean;
  generating?: boolean;
}) {
  return (
    <div className="edge relative flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg bg-s2 p-8 text-center">
      {scanning || generating ? (
        <Loader2 className="size-6 animate-spin text-gold" aria-hidden="true" />
      ) : (
        <div className="w-full max-w-[240px]">
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
  transparentBg = false,
  className,
}: {
  mask: Mask;
  customSrc?: string;
  enableAR?: boolean;
  transparentBg?: boolean;
  className?: string;
}) {
  const libReady = useModelViewerLib();
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const [useStaticFallback, setUseStaticFallback] = useState(false);
  const [generatedSrc, setGeneratedSrc] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);

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

  if (!libReady || generating) return <ViewerFallback mask={mask} scanning={!generating} generating={generating} />;
  if (status === "error")
    return (
      <ViewerFallback
        mask={mask}
        onGenerateAI={handleGenerateAI}
        onRetry={() => {
          setUseStaticFallback(false);
          setStatus("loading");
          setAttempt((n) => n + 1);
        }}
      />
    );

  return (
    <div className={cn(" relative overflow-hidden rounded-lg", !transparentBg && "edge bg-s2", className)}>
      <model-viewer
        key={`${activeSrc}-${attempt}`}
        ref={(el: HTMLElement | null) => {
          viewerRef.current = el;
        }}
        src={activeSrc}
        poster={mask.image}
        alt={`Interactive 3D study of the ${mask.name}`}
        camera-controls
        auto-rotate
        ar={enableAR}
        ar-modes="webxr scene-viewer quick-look"
        shadow-intensity="0.85"
        exposure="1.05"
        loading="eager"
        style={{ width: "100%", height: "100%", minHeight: 340, background: "transparent" }}
      />
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
  const [mode, setMode] = useState<"wall" | "camera" | "qr">("wall");
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
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
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
          setCamError("Camera permission was denied or no camera was detected. Switched to studio wall preview.");
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

      <Modal open={viewerOpen} onClose={closeModal} title={`${mask.name} — Wall & AR Preview`} maxWidth="max-w-3xl">
        {/* Mode switcher */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-line bg-s1 p-0.5">
            <button
              type="button"
              onClick={() => setMode("wall")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "wall" ? "bg-s3 text-gold" : "text-ink3 hover:text-ink"
              )}
            >
              <Ruler className="size-3.5" />
              Wall scale ({mask.heightCm} × {mask.widthCm} cm)
            </button>
            <button
              type="button"
              onClick={() => setMode("camera")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "camera" ? "bg-s3 text-gold" : "text-ink3 hover:text-ink"
              )}
            >
              <Camera className="size-3.5" />
              Live Camera AR
            </button>
            <button
              type="button"
              onClick={() => setMode("qr")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "qr" ? "bg-s3 text-gold" : "text-ink3 hover:text-ink"
              )}
            >
              <QrCode className="size-3.5" />
              Phone QR
            </button>
          </div>
          <span className="font-mono text-xs text-ink3 tnum">
            {mask.heightCm} cm H · {mask.widthCm} cm W · {mask.depthCm} cm D
          </span>
        </div>

        {mode === "qr" ? (
          <div className="flex flex-col items-center gap-5 rounded-lg border border-line bg-s2 p-6 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-lg bg-[#F4EFE6] p-3">
              {qr ? (
                <img src={qr} alt={`QR code to open the ${mask.name} AR preview`} className="size-44" />
              ) : (
                <div className="skel size-44 rounded-md" />
              )}
            </div>
            <div className="text-sm leading-relaxed text-ink2">
              <p className="flex items-center gap-2 font-medium text-ink">
                <Smartphone className="size-4 text-gold" />
                Scan with your phone camera
              </p>
              <p className="mt-1.5">
                Opens the 3D/AR study directly on your mobile device. On iPhone it launches Quick Look; on Android it launches Scene Viewer or WebXR.
              </p>
              <p className="mt-3 text-xs text-ink3">
                Tip: Use the <strong>Wall scale</strong> or <strong>Live Camera AR</strong> tabs above to inspect and place the 3D mask right here in your browser.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative h-[440px] w-full overflow-hidden rounded-lg border border-line bg-[#1c1813]">
            {/* Wall background grid or live camera video */}
            {mode === "camera" && !camError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 35%, rgba(201,164,92,0.14), transparent 70%), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
                  backgroundSize: "100% 100%, 40px 40px, 40px 40px",
                }}
              />
            )}

            {/* Dimension ruler overlay */}
            <div className="pointer-events-none absolute top-4 left-4 z-10 rounded-md bg-black/65 px-3 py-1.5 font-mono text-[11px] text-gold backdrop-blur-sm tnum">
              Scale: {mask.heightCm} cm tall × {mask.widthCm} cm wide ({mask.weightKg} kg)
            </div>

            {camError && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-md bg-black/75 px-3 py-1.5 text-xs text-ink2">
                <CameraOff className="size-3.5 text-gold" />
                <span>{camError}</span>
              </div>
            )}

            {/* Interactive 3D model-viewer layered over wall/camera */}
            <ModelViewerPanel
              mask={mask}
              enableAR={true}
              transparentBg={true}
              className="relative z-0 h-full w-full"
            />
          </div>
        )}
      </Modal>
    </>
  );
}

export { ArchivePlate };
