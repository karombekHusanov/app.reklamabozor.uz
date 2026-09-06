# Reklama Bozor — Mini App Design System (v1)

> **Rule of the road:** build UI **strictly** from these tokens and patterns. Do not
> hard-code accent colors, the display font, shadows, or radii in components — reference
> the `--rb-*` / app tokens below. New screens reuse the documented component patterns.

The system was derived from the 2026‑09 mobile redesign (hero + glowing stats + feature
tiles + stepper + rails + bottom tab bar). Grounded with the `ui-ux-pro-max` and
`frontend-design` skills: **Marketplace / Directory** pattern, blue trust brand, a single
warm CTA, 150–300 ms motion, WCAG‑AA contrast, `prefers-reduced-motion` respected.

Token source of truth: [`src/style.css`](src/style.css) (`:root` + `.dark`).

---

## 1. Aesthetic direction

- **Vibe:** trustworthy, energetic, mobile‑native. Deep‑blue brand with one warm coral
  accent and a cyan "signal" highlight. Big confident headlines, soft cards, purposeful motion.
- **Surfaces:** neutral canvas → white/dark card → raised element. Content sits on a
  rounded "sheet" that overlaps the immersive hero.
- **One accent rule:** **coral is the only warm color** and marks the single primary action
  (the Create FAB, "new"/badge markers). Everything else is blue/neutral. Cyan is a *signal*
  (verified seals, live/online glows, the running stat border) — not a second brand color.

## 2. Color

Brand & neutrals come from the existing app tokens (theme‑aware, light + `.dark`):

| Role | Token | Light |
|------|-------|-------|
| Brand primary | `--primary` | `#0b6bcb` |
| Brand gradient | `--brand-gradient` | blue → deep blue |
| Immersive hero | `--rb-hero-grad` / `.brand-hero` | navy → blue |
| Canvas | `--background` | `#f3f4f6` |
| Card surface | `--card` | `#ffffff` |
| Hairline | `--border` | `#e5e7eb` |
| Text | `--foreground` | `#101828` |
| Muted text | `--muted-foreground` | `#5f6b7d` |
| Chip | `--secondary` / `--secondary-foreground` | soft blue |
| Success / verified | `--success` | `#12b76a` |

Design‑system accents (`--rb-*`, theme‑independent):

| Role | Token | Value |
|------|-------|-------|
| **CTA (only warm accent)** | `--rb-cta` / `--rb-cta-strong` / `--rb-on-cta` | `#f26b21` / `#dc5a13` / `#fff` |
| **Signal (cyan)** | `--rb-glow` / `--rb-glow-soft` | `#38bdf8` / `#9becff` |
| **Rating stars** | `--rb-rating` | `#f5a524` |

> Decorative illustration art inside a viz (map pins, chat avatars, the animated headline
> shimmer) may use fixed local hues — it is artwork, not surface UI, and does not re‑theme.

## 3. Typography

- **Display:** `--rb-font-display` → **Archivo** (800/900), Geist fallback. Use for every
  headline, section title, stat number, agency/step name.
- **Body / UI:** **Geist** (app default via `body`) — labels, descriptions, inputs.
- **Numerals:** always `font-variant-numeric: tabular-nums` for stats & ratings.

Scale (mobile): hero 28 · section title 18 · stat number 22 · card title 15–16 · body 12.5–14 ·
label 10–11 · eyebrow 10.5 uppercase / `0.1em`. Headlines: `letter-spacing:-0.02em`,
`text-wrap: balance`.

## 4. Radii, elevation, rhythm, motion

| Token | Use |
|-------|-----|
| `--rb-r-card: 20px` | agency / large cards |
| `--rb-r-tile: 18px` | feature tiles, list cards, stat cards |
| `--rb-r-field: 16px` | search / inputs |
| `--rb-r-icon: 16px` | icon tiles |
| `--rb-r-chip: 999px` | chips, pills, avatars-as-circle |
| `--rb-elev-1` | resting card shadow (theme‑aware) |
| `--rb-elev-2` | raised / floating |
| `--rb-elev-cta` | coral FAB / CTA glow |
| `--rb-elev-bar` | bottom tab bar |
| `--rb-gutter: 18px` | horizontal page gutter |
| `--rb-section-gap: 1.6rem` | vertical space between sections |
| `--rb-dur: 180ms` · `--rb-dur-slow: 300ms` · `--rb-ease` | transitions |

**Motion:** micro‑interactions `--rb-dur`/`--rb-ease`; page‑load = one staggered reveal, not
scattered effects; ambient loops (glow drift, running border, live dot) are subtle. **Every**
animation is wrapped so it stops under `@media (prefers-reduced-motion: reduce)`.

## 5. Component patterns (built)

All under `src/modules/home/components/` + `src/modules/shell/components/TabBar.vue`:

- **Hero** (`HomeHero`) — `.brand-hero` immersive header: greeting (circular avatar + bell),
  animated‑gradient display headline, subtitle, white search field (`--rb-r-field`), floating
  billboard photo card. Content sheet below overlaps it (`border-radius:26px 26px 0 0`).
- **Stat cards** (`HomeStatCards`) — trio on the sheet seam; `--rb-elev-1`, **running cyan
  border** (`conic-gradient` + `@property --sang`, `--rb-glow`), count‑up numbers.
- **Feature tiles** (`HomeFeatureTiles`) — 2‑up; illustrated viz (map / chat) + title + 2‑line sub.
- **Stepper** (`HomeSteps`) — horizontal 1→2→3 nodes on a gradient rail, coral number badges.
- **Service rail** (`HomeServiceRail`) — horizontal category chips, `categoryIcon()` in a
  `--rb-r-icon` tile.
- **Agency card** (`HomeAgencyRail`) — image avatar + **cyan verified seal**, name, ★ rating ·
  jobs, 2‑line bio, green Verified chip + category chips. Reused for agencies & designers.
- **Live request** (`HomeLiveRequests`) — icon + title + offers/New + `Offer` CTA.
- **Bottom tab bar** (`TabBar`) — fixed edge‑to‑edge, `border-top`, blur; raised **coral
  Create FAB** in the center; active = `--primary`.

**Card recipe:** `background: var(--card); border: 1px solid var(--border); border-radius:
var(--rb-r-*); box-shadow: var(--rb-elev-1);` hover → `translateY(-2px)` + `border-color: var(--primary)`.
**Chip recipe:** `--rb-r-chip`, `background: var(--secondary); color: var(--secondary-foreground)`.

## 6. Accessibility (enforced)

- Text contrast ≥ 4.5:1 (both themes); never color‑only state — pair with icon/shape.
- Every interactive element: `cursor: pointer`, visible `:focus-visible` (2px `--primary`),
  ≥ 44px touch target, real `aria-label` on icon‑only controls.
- Design both themes token‑first; verify light **and** `.dark`.
- Respect `prefers-reduced-motion` for all animation.

## 7. Working rules (do this)

1. Reach for a **token** before a literal. If a needed value is missing, **add a `--rb-*`
   token** here + in `style.css`, then use it — don't hard‑code.
2. Display headings → `var(--rb-font-display)`. Body → inherit (Geist).
3. Coral (`--rb-cta`) only for the one primary action / "new" marker. Cyan (`--rb-glow`) only
   for signal/verified/live. Stars → `--rb-rating`.
4. Reuse the component patterns above; keep scoped styles theme‑token‑driven.
5. Gate `backdrop-filter`/heavy effects; keep transitions 150–300 ms.
6. Ship checks: `vue-tsc` + `npm run build` green, no new lint errors, light + dark verified.
