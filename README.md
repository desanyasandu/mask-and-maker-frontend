# Mask & Maker (M&M) — Digital Heritage & Ethical E-Commerce

A production-grade **frontend** for Sri Lanka's mask-making heritage: a curated multi-vendor
marketplace for hand-carved Kaduru wood masks (Raksha · Sanni · Kolam) with minted provenance,
AR "view on your wall" previews, and a portal designed *with* the carving workshops.

Frontend-only by design — every data call is a typed mock with simulated latency, architected so a
real backend swaps in without touching UI components.

## Stack

- **React 19 + Vite + TypeScript (strict)** · `react-router-dom` for routes
- **Tailwind CSS v4** — design tokens as CSS variables, single source of truth in `DESIGN.md`
- **Framer Motion** — page/section motion, one easing everywhere (`cubic-bezier(0.22,1,0.36,1)`)
- **Zustand** (persisted) — cart, wishlist, currency, toasts
- **React Hook Form + Zod** — checkout address validation
- **@google/model-viewer** — 3D/AR, lazy-loaded, graceful fallbacks
- **qrcode** — desktop→phone AR hand-off
- Lucide icons only. No emoji in the UI.

## Structure

```
src/
├── lib/
│   ├── types.ts            # All domain types (Mask, Artisan, Certificate, Order…)
│   ├── utils.ts            # Currency, dates, motion presets
│   ├── meta.ts             # Per-route title/description
│   └── mock/
│       ├── data.ts         # 18 masks · 8 artisans · 10 articles · certs · orders · stages
│       └── api.ts          # Mock service layer (300–800 ms latency) — see below
├── store/app.ts            # Zustand store (persisted partial)
├── components/
│   ├── ui/                 # kit, motion, surfaces, ProvenanceTimeline, MaskImage (archive
│   │                       #   plates), ARLauncher, CommandPalette
│   ├── layout/             # Shell (header/footer/cookie), CartDrawer
│   └── MaskCard.tsx
└── pages/                  # Home, Marketplace, MaskDetail, Artisans(+Detail), Heritage,
                            # TraditionDetail, Verify, Cart, Checkout, Account, Portal,
                            # About, System (404/legal/error/loading)
```

## Mock layer → future API

`src/lib/mock/api.ts` is the swap point. Each function documents its future endpoint:

| Mock | Future REST |
|---|---|
| `listMasks(query)` | `GET /api/masks?tradition=&artisan=&q=&sort=` |
| `getMask(slug)` | `GET /api/masks/:slug` |
| `listArtisans` / `getArtisan` | `GET /api/artisans[/:slug]` |
| `verifyCertificate(id)` | `GET /api/verify/:certId` |
| `listOrders` | `GET /api/orders` |
| `search(q)` | `GET /api/search?q=` |

Replace the function bodies with `fetch` calls; the UI needs no changes.

## Replacing placeholder assets

- **Logo** — the gold-frame "M&M" mark is inline (`Shell.tsx → Wordmark`) + `public/favicon.svg`.
- **Photography** — plates live in `public/images/…`. To add real photos for a mask, set its
  `image` field in `data.ts`. Masks without photos render a seeded **archive plate** (SVG
  line-drawing) so the catalog always looks intentional.
- **3D models** — the viewer uses the media service or a matching scan bundled in `public/models/`.
  To add a bundled scan, save an upright `{slug}.glb` and add the slug to
  `src/lib/refined-scans.json` after checking it against the listing. The production build
  exports these scans to USDZ for Safari Quick Look.
- **Android AR** — serve the deployed site and its model URLs over HTTPS. Terminate TLS
  on the public load balancer using a certificate for the site's domain.

## Design system

Everything visual resolves from `src/index.css` tokens (dark canvas default; light "gallery" theme
via the header toggle, persisted). Read `DESIGN.md` first — it encodes the palette, type scale,
motion tokens, the one-ornament-per-screen rule, and the anti-AI guardrails this repo enforces.

## Scripts

```bash
npm run dev     # local dev
npm run build   # production build (single-file dist via vite-plugin-singlefile)
npm run preview # serve the build
```

## Google sign-in

`/login` offers one way in: **Continue with Google** (Google Identity Services, no password stored). The profile (name, email, photo) is kept in the browser under `mm-auth`; `/account` redirects to the login page until someone is signed in.

1. In Google Cloud Console create an OAuth 2.0 client of type *Web application* and add your site (for example `http://localhost:5173`) under *Authorized JavaScript origins*.
2. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID`.
3. Restart `npm run dev`.

Without a client id the page runs in **preview mode**: the button opens two sample accounts so the flow can be demonstrated offline.

## Verification demo paths

- `/verify` — landing, paste a code or simulate a scan
- `/verify/MM-2024-0117` — **verified, unclaimed** (claim the twin)
- `/verify/MM-2023-0845` — **verified, already claimed** (ownership history)
- `/verify/MM-0000-0000` — **not found** state
- `/portal` — artisan persona with role switcher, minting flow, tri-lingual onboarding stubs
