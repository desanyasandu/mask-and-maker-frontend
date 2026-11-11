import Lenis from "lenis";

/* One Lenis instance for the whole page. It is created by <SmoothScroll /> and
   absent for visitors who ask for reduced motion, so every helper here falls
   back to the browser's own scrolling when it is null. */
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

/** Jump to a vertical position without animation (route changes, scroll restoration). */
export function scrollToInstant(top: number) {
  if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
  else window.scrollTo({ top, behavior: "instant" });
}

/* Dialogs freeze the page behind them. Lenis scrolls the window itself, so
   `overflow: hidden` on the body is not enough; it has to be told to stop. */
let freezes = 0;

export function freezeSmoothScroll() {
  freezes += 1;
  lenis?.stop();
}

export function thawSmoothScroll() {
  freezes = Math.max(0, freezes - 1);
  if (freezes === 0) lenis?.start();
}
