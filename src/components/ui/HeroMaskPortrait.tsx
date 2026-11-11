import type { PointerEvent } from "react";

const portrait = "/images/masks/naga-raja-kolam";

export function HeroMaskPortrait() {
  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    const panel = event.currentTarget;
    const bounds = panel.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -3;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -3;

    panel.style.setProperty("--portrait-x", `${x}%`);
    panel.style.setProperty("--portrait-y", `${y}%`);
    panel.style.setProperty("--portrait-scale", "1.06");
  }

  function reset(event: PointerEvent<HTMLDivElement>) {
    const { style } = event.currentTarget;
    style.removeProperty("--portrait-x");
    style.removeProperty("--portrait-y");
    style.removeProperty("--portrait-scale");
  }

  return (
    <div
      className="absolute inset-0 isolate overflow-hidden bg-s1"
      onPointerMove={move}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      <img
        src={`${portrait}-800.webp`}
        srcSet={`${portrait}-800.webp 800w, ${portrait}-1600.webp 1600w`}
        sizes="(min-width: 1024px) 42vw, 100vw"
        alt="Naga Raja, a carved and painted cobra-king mask from Kolam theatre"
        fetchPriority="high"
        className="absolute inset-0 size-full origin-[50%_30%] object-cover object-[50%_30%] motion-safe:transform-[translate(var(--portrait-x,0%),var(--portrait-y,0%))_scale(var(--portrait-scale,1))] motion-safe:transition-transform motion-safe:duration-300"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_6rem_color-mix(in_srgb,var(--canvas)_24%,transparent)]" />
    </div>
  );
}
