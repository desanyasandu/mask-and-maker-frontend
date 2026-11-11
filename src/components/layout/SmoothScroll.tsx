import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { setLenis } from "@/lib/smoothScroll";

/** Inertial page scrolling via Lenis. Skipped entirely under prefers-reduced-motion. */
export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | null = null;

    const sync = () => {
      if (query.matches) {
        instance?.destroy();
        instance = null;
        setLenis(null);
      } else if (!instance) {
        instance = new Lenis({ autoRaf: true, lerp: 0.1 });
        setLenis(instance);
      }
    };

    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      instance?.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
