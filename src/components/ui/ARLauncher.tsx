import { Box, Loader2, RefreshCw, ScanLine, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mask } from "@/lib/types";
import { cn } from "@/utils/cn";
import { Button, Modal } from "./kit";
import { ArchivePlate } from "./MaskImage";

type ViewerStatus = "idle" | "lib-loading" | "loading" | "error";

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

function ViewerFallback({ mask, onRetry, scanning }: { mask: Mask; onRetry?: () => void; scanning?: boolean }) {
  return (
    <div className="edge relative flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg bg-gradient-to-b from-s2 to-s1 p-8 text-center">
      {scanning ? (
        <Loader2 className="size-6 animate-spin text-gold" aria-hidden="true" />
      ) : (
        <Box className="size-6 text-gold" aria-hidden="true" />
      )}
      <div>
        <p className="text-sm font-medium text-ink">{scanning ? "Preparing the 3D study" : "3D scan in preparation"}</p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-ink3">
          {scanning
            ? "Loading the photogrammetry viewer…"
            : `The ${mask.name} is being photogrammetry-scanned at the Ambalangoda studio. The studio photographs and archival plate remain fully available.`}
        </p>
      </div>
      {!scanning && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

/** Inline 3D/AR viewer with loading, error and reduced-capability fallbacks. */
export function ModelViewerPanel({ mask, enableAR = true, className }: { mask: Mask; enableAR?: boolean; className?: string }) {
  const libReady = useModelViewerLib();
  const [status, setStatus] = useState<ViewerStatus>("idle");
  const [attempt, setAttempt] = useState(0);
  const viewerRef = useRef<HTMLElement | null>(null);
  const src = `/models/${mask.slug}.glb`;

  useEffect(() => {
    if (!libReady || !viewerRef.current) return;
    setStatus("loading");
    const el = viewerRef.current;
    const onLoad = () => setStatus("idle");
    const onError = () => setStatus("error");
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [libReady, attempt]);

  if (!libReady) return <ViewerFallback mask={mask} scanning />;
  if (status === "error") return <ViewerFallback mask={mask} onRetry={() => setAttempt((n) => n + 1)} />;

  return (
    <div className={cn("edge relative overflow-hidden rounded-lg bg-gradient-to-b from-s3 via-s2 to-s1", className)}>
      <model-viewer
        key={attempt}
        ref={(el: HTMLElement | null) => {
          viewerRef.current = el;
        }}
        src={src}
        poster={mask.image}
        alt={`Interactive 3D study of the ${mask.name}`}
        camera-controls
        auto-rotate
        ar={enableAR}
        ar-modes="webxr scene-viewer quick-look"
        shadow-intensity="0.8"
        exposure="1.05"
        loading="eager"
        style={{ width: "100%", height: "100%", minHeight: 340, background: "transparent" }}
      />
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-s1/60">
          <Loader2 className="size-6 animate-spin text-gold" aria-hidden="true" />
        </div>
      )}
      <p className="absolute right-3 bottom-3 rounded-md bg-scrim px-2 py-1 font-mono text-[10px] tracking-wide text-ink3 backdrop-blur-sm tnum">
        {src}
      </p>
    </div>
  );
}

/**
 * "View on your wall" — AR launcher. Touch devices open the AR viewer;
 * desktop opens a QR hand-off modal; everything degrades gracefully.
 */
export function ARLauncher({ mask }: { mask: Mask }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const isTouch = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      (navigator.maxTouchPoints > 2 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)),
    []
  );

  const launch = async () => {
    if (isTouch) {
      setViewerOpen(true);
      return;
    }
    try {
      const url = `${window.location.origin}/masks/${mask.slug}?ar=1`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 240,
        margin: 1,
        color: { dark: "#16120A", light: "#F4EFE6" },
      });
      setQr(dataUrl);
      setQrOpen(true);
    } catch {
      setViewerOpen(true);
    }
  };

  if (!mask.arAvailable) {
    return (
      <p className="edge flex items-center gap-2.5 rounded-lg bg-s1 px-4 py-3 text-[13px] text-ink3">
        <ScanLine className="size-4 shrink-0 text-ink4" aria-hidden="true" />
        This piece predates our scanning programme — photographs and measurements only, for now.
      </p>
    );
  }

  return (
    <>
      <Button variant="outline" size="lg" className="w-full justify-center" onClick={launch}>
        <ScanLine className="size-4 text-gold" />
        View on your wall
      </Button>

      <Modal open={viewerOpen} onClose={() => setViewerOpen(false)} title={mask.name} maxWidth="max-w-2xl">
        <p className="mb-4 flex items-start gap-2 text-[13px] leading-relaxed text-ink2">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
          Point your phone at a wall with a metre of clear space. The mask appears life-size — all {mask.heightCm} cm of it.
        </p>
        {viewerOpen && <ModelViewerPanel mask={mask} className="h-[420px]" />}
      </Modal>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Open AR on your phone">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-lg bg-[#F4EFE6] p-3">
            {qr ? <img src={qr} alt={`QR code to open the ${mask.name} AR preview`} className="size-44" /> : <div className="skel size-44 rounded-md" />}
          </div>
          <div className="text-[13px] leading-relaxed text-ink2">
            <p className="font-medium text-ink">Scan with your phone camera</p>
            <p className="mt-1.5">
              The preview opens full-screen on your device. On iPhone it uses Quick Look; on Android, Scene Viewer — no app to install.
            </p>
            <p className="mt-3 text-ink3">
              No camera handy? The 3D study in the gallery above spins on desktop, too.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

export { ArchivePlate };
