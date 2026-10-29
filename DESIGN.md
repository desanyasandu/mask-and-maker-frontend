# Mask & Maker — Design System (single source of truth)

A museum-grade, dark-first design language for Sri Lanka's digital heritage marketplace.
Premium and reverent — never a souvenir shop. Every value below is implemented as a token
in `src/index.css` (Tailwind v4, CSS-first). Components must reference tokens, never raw hex.

---

## 1. Surfaces — 4-tier depth (warm, never pure black)

| Token            | Dark (default) | Light "gallery" theme | Use |
|------------------|----------------|------------------------|-----|
| `--canvas`       | `#0B0A09`      | `#F4EFE6`              | Page background |
| `--surface-1`    | `#14110E`      | `#EDE7DB`              | Elevated panels, nav, footer |
| `--surface-2`    | `#1B1712`      | `#E5DECF`              | Interactive cards |
| `--surface-3`    | `#24201A`      | `#DDD5C4`              | Hover state on cards |

- Elevated cards also carry a **top-edge specular highlight** (`--edge-hi`), 1px inset.
- The light theme exists for gallery/editorial contexts; dark is canonical.

## 2. Color roles

| Token            | Value     | Role |
|------------------|-----------|------|
| `--gold`         | `#C9A45C` | Primary accent: CTAs, key lines, verified states. Used sparingly. |
| `--gold-strong`  | `#DDB983` | Hover/emphasis on gold text. |
| `--vermilion`    | `#E2561F` | Kolam vermilion — cultural marker only (tradition tags, folklore). Never chrome. |
| `--forest`       | `#1F5B45` | Deep Kolam green — cultural marker only. |
| `--success`      | `#4E9F6E` | Verified, in stock. Harmonised to palette. |
| `--warning`      | `#D9A45B` | Pending, low stock. |
| `--danger`       | `#C4574E` | Errors, not-found. |

### Text tiers (all WCAG AA on their intended surfaces)
| Token      | Dark       | Light      | Use |
|------------|------------|------------|-----|
| `--text-1` | `#EDE7DB`  | `#211C15`  | Headings, body emphasis |
| `--text-2` | `#ABA399`  | `#5C554A`  | Secondary copy |
| `--text-3` | `#7A7268`  | `#837A6C`  | Captions, meta |
| `--text-4` | `#50493F`  | `#B4AB9C`  | Disabled |

## 3. Typography

- **Display:** Fraunces (serif, optical size axis, `300–500`, tight leading) — hero & editorial headings.
- **UI/body:** Inter, 13–15px, line-height 1.5, sentence case.
- **Mono:** JetBrains Mono + `font-variant-numeric: tabular-nums` — prices, certificate IDs, dates, counters.
- **Heritage accents:** Noto Serif Sinhala for Sinhala terms (e.g. කොලම್, රක්ෂ).

Scale (Tailwind classes → px):

| Name | Size / leading | Tracking | Notes |
|------|----------------|----------|-------|
| overline | 11/16 | +0.14em uppercase | Only uppercase allowed in UI | 
| caption | 12/18 | 0 | meta, labels |
| body | 14/21 | 0 | default UI |
| lead | 16/26 | 0 | intro paragraphs |
| h4 | 18/24 | 0 | card titles |
| h3 | 22/28 | -0.01em | section subheads |
| h2 | 28/34 | -0.01em | section heads |
| h1 | 40/44 | -0.02em | page heads |
| display | 56–76 / 1.02 | -0.02em | hero, Fraunces 300–400 |

## 4. Spacing & radius

- Strict rhythm: **4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96**. Section padding: 96 desktop, 64 mobile.
- Radius: **8px** uniform (`rounded-lg`) for cards, inputs, buttons. `999px` (`rounded-full`) only for avatars and pills. No other radii.

## 5. Borders & lighting

- Hairline: `1px solid var(--line)` — `rgba(255,255,255,0.07)` dark / `rgba(0,0,0,0.08)` light.
- Specular top edge on elevated cards: `box-shadow: inset 0 1px 0 var(--edge-hi)`.
- Focus ring: 2px `var(--gold)` with 2px offset (`:focus-visible`).
- Shadows are soft, warm-black, low-opacity. No neon glow, ever.

## 6. Motion

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` everywhere ("expo-out").
- Durations: **100 / 180 / 320 / 600ms**.
- Staggered entry: opacity 0→1, translateY(6px→0), 180ms, 40ms stagger.
- Press: `active:scale-[0.98]` 100ms.
- `prefers-reduced-motion`: replace transforms with simple fades (enforced via media query).

## 7. Cultural ornament — restraint budget: ONE per screen

1. **Thin double gold frame** (echoes the logo): outer hairline + inner offset 1px gold at 30%.
2. **Kolam flame divider**: fine repeating SVG line motif between major sections.
3. **Wood-grain noise**: 2.5% opacity SVG grain on hero/ritual backdrops.

## 8. Anti-patterns (hard rules)

- No neon gradients, no purple-blue text gradients, no glow shadows, no glassmorphism stacks.
- Max **one** status badge per card. Technical jargon (hashes, token IDs) behind "Technical details".
- Consistent image ratios (4/5 catalog, 16/10 editorial), `ring-1 ring-inset` inner ring, blur-up.
- Photography is art-directed (warm charcoal backdrop, golden rim light). Catalog gaps use the
  **archive plate** system: unique gold line-drawing of each mask on a tiered gradient — never stock.
- Copy is specific and respectful. No clichés ("elevate", "unleash", "journey").
