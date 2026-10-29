import { useEffect } from "react";

/** Per-route document title + description (SSR-grade swap point). */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} — Mask & Maker`;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    }
  }, [title, description]);
}
