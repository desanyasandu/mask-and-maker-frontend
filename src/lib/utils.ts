import type { Currency } from "./types";

export const EXPO = [0.22, 1, 0.36, 1] as const;
export const LKR_PER_USD = 300;

export function formatLKR(value: number): string {
  return `Rs ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(value)}`;
}

export function formatUSD(valueLkr: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(valueLkr / LKR_PER_USD);
}

export function formatMoney(valueLkr: number, currency: Currency): string {
  return currency === "LKR" ? formatLKR(valueLkr) : formatUSD(valueLkr);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
};

export const fadeUpChild = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: EXPO } },
};

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: EXPO, delay },
});
