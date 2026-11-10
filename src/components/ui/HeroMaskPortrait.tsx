import { useEffect, useRef } from "react";

const portrait = "/images/masks/naga-raja-kolam";

export function HeroMaskPortrait() {
  const panelRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const photo = photoRef.current;
    if (!panel || !photo) return;

    const motion = window.matchMedia("(prefers-reduced-motion: no-preference) and (any-pointer: fine)");
    let stop: (() => void) | undefined;
    let controller: AbortController | undefined;

    function start(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !motion.matches || controller || !panel || !photo) return;

      const request = new AbortController();
      controller = request;

      void (async () => {
        await photo.decode();
        if (request.signal.aborted) return;
        const { mountHeroMaskScene } = await import("./heroMaskScene");
        if (!request.signal.aborted) stop = mountHeroMaskScene(panel, photo);
      })().catch(() => {
        // The photograph stays visible if the image or renderer cannot initialize.
      });
    }

    function reset() {
      controller?.abort();
      controller = undefined;
      stop?.();
      stop = undefined;
    }

    panel.addEventListener("pointermove", start);
    motion.addEventListener("change", reset);
    return () => {
      panel.removeEventListener("pointermove", start);
      motion.removeEventListener("change", reset);
      reset();
    };
  }, []);

  return (
    <div ref={panelRef} className="absolute inset-0 isolate overflow-hidden bg-s1">
      <img
        ref={photoRef}
        src={`${portrait}-800.webp`}
        srcSet={`${portrait}-800.webp 800w, ${portrait}-1600.webp 1600w`}
        sizes="(min-width: 1024px) 42vw, 100vw"
        alt="Naga Raja, a carved and painted cobra-king mask from Kolam theatre"
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover object-[50%_30%]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_6rem_color-mix(in_srgb,var(--canvas)_24%,transparent)]" />
    </div>
  );
}
