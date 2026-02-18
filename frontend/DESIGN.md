# Chiron — UI/UX Design Spec

Reference for designers working on the Chiron frontend. Everything here maps to actual CSS variables and components in `src/index.css` and the React source.

---

## Color System

All colors are defined as CSS custom properties on `:root` (light) and `:root.dark` (dark). Every surface, text element, and border in the app references these tokens — never raw hex values in components.

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-primary` | `#ffffff` | Card backgrounds, panels, inputs |
| `--color-bg-secondary` | `#f9fafb` | Page background, body |
| `--color-bg-tertiary` | `#f3f4f6` | Hover fills, badge backgrounds, skeletons |
| `--color-bg-hover` | `#f3f4f6` | Button/row hover state |
| `--color-text-primary` | `#111827` | Headings, body text, primary labels |
| `--color-text-secondary` | `#4b5563` | Subheadings, descriptions |
| `--color-text-tertiary` | `#6b7280` | Helper text, metadata |
| `--color-text-muted` | `#9ca3af` | Timestamps, disabled text, placeholders |
| `--color-border` | `#e5e7eb` | Default borders on cards, inputs, dividers |
| `--color-border-hover` | `#d1d5db` | Borders on hover |
| `--color-accent` | `#3b82f6` | Focus rings, active controls, links |
| `--color-accent-hover` | `#2563eb` | Accent on hover |
| `--color-accent-light` | `#eff6ff` | Accent badge background |
| `--color-success` | `#10b981` | Correct answers, positive indicators |
| `--color-success-bg` | `#ecfdf5` | Correct answer background fill |
| `--color-error` | `#ef4444` | Wrong answers, destructive actions |
| `--color-error-bg` | `#fee2e2` | Wrong answer background fill |
| `--color-warning` | `#f59e0b` | Caution states |
| `--color-warning-bg` | `#fef3c7` | Warning background fill |

### Dark Mode

Every token above has a dark counterpart. Key shifts:

- Backgrounds go near-black (`#0f0f0f` primary, `#171717` secondary, `#262626` tertiary)
- Text flips to light grays (`#f9fafb` primary, `#d1d5db` secondary)
- Borders darken to `#262626` / `#404040`
- Accent shifts to `#60a5fa` (lighter blue for contrast)
- Success/error/warning colors shift to lighter tints with dark background fills

### Brand Colors (Landing Page)

These are used only on the public landing page for visual identity.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-brand-ink` | `#111827` | `#f5f7fb` | Primary CTA button gradient base |
| `--color-brand-blue` | `#3b82f6` | `#60a5fa` | CTA gradient accent, feature labels, active states |
| `--color-brand-bone` | `#f8f5ee` | `#1f2937` | Warm tint in background radial gradient, CTA wrap |
| `--color-brand-copper` | `#b45309` | `#f59e0b` | Warm accent in ambient glow, meter gradient |
| `--color-brand-glow` | `rgba(59,130,246,0.2)` | `rgba(96,165,250,0.26)` | Background radial glow |

---

## Typography

| Property | Value |
|---|---|
| Primary font | `Inter`, falling back to system sans-serif |
| Monospace font | `JetBrains Mono`, for code/meta text |
| Base body size | `0.875rem` (14px) |
| Display headings | `.font-display` class — adds `letter-spacing: -0.02em` |
| Hero h1 | `3.35rem` on desktop, `text-5xl` on tablet, `text-4xl` on mobile |
| Feature headings | `1.35rem`, weight 600, letter-spacing `-0.02em` |
| Feature body | `0.88rem`, line-height 1.55 |
| Labels / kickers | `0.72rem`, uppercase, letter-spacing `0.08em–0.18em` |
| Antialiasing | `-webkit-font-smoothing: antialiased` globally |

---

## Spacing & Layout

| Property | Value |
|---|---|
| Container max-width | `1200px`, centered, `1rem` padding (mobile), `1.5rem` (768px+) |
| Hero top padding | `3.5rem` mobile, `6rem` desktop |
| Feature row padding | `3rem` top and bottom |
| Card padding | `1.1rem` |
| Grid gap (hero) | `2.5rem` between text and mockup |
| Grid gap (feature cards) | `2rem` mobile, `2.5rem` desktop |

---

## Border Radii

| Element | Radius |
|---|---|
| Buttons | `6px` (`--radius-btn`) |
| Cards / panels | `8px` (`--radius-card`), landing cards use `1rem` |
| Badges | `4px` (`--radius-badge`) |
| Pills / tags | `9999px` (full round) |
| Mockup containers | `1rem` |
| Answer choices | `0.6rem` |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Buttons, small cards |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Hover cards, dropdowns |
| `--shadow-elevated` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Landing panels |

Dark mode increases shadow opacity (0.3–0.5 range) since the background is already dark.

---

## Buttons

Four button tiers used across the app:

| Class | Style | When to use |
|---|---|---|
| `.btn-primary` | Solid dark (`#111827`), white text. Dark mode inverts. | Primary app actions (start exam, submit) |
| `.btn-secondary` | White bg, 1px border, subtle shadow | Secondary actions (cancel, back) |
| `.btn-ghost` | Transparent, text only | Tertiary actions (nav links, sign in) |
| `.btn-accent` | Solid blue (`--color-accent`) | Rare emphasis (not used on landing) |

**Landing-specific buttons:**

| Class | Style | When to use |
|---|---|---|
| `.chiron-btn-primary` | Gradient from `brand-ink` to `brand-blue`, white text, blue box-shadow. Lifts 1px on hover. | Hero CTA, section CTAs |
| `.chiron-btn-subtle` | 1px border, semi-transparent bg. Border tints blue on hover. | Secondary CTA ("See how it works") |

---

## Landing Page Structure

The landing page has five sections, top to bottom:

### 1. Nav Bar
- Sticky, `backdrop-filter: blur` with semi-transparent background
- Logo image (theme-aware SVG from `public/`) + "CHIRON" in uppercase tracked type
- Right side: "Features" anchor link, "Sign in" ghost button, "Get started" primary CTA

### 2. Hero (two-column on desktop)
- **Left column:** Kicker pill (uppercase tagline in a rounded border capsule) → h1 → one-line subhead → two buttons → three stat pills with icons
- **Right column:** Interactive question preview card showing a real exam question with four answer choices (A–D). Visitor can click any answer to see correct/incorrect feedback with color-coded states and an explanation panel. This demonstrates the core product experience.

### 3. Feature Showcases (four rows)
Each row is a two-column grid: text on one side, interactive mockup on the other. Rows alternate which side the mockup is on, and alternate background tint.

| Feature | Mockup contents |
|---|---|
| **Custom Sets** | Clickable subject pill tags (toggle on/off), summary bar showing count + "Timed" + start button |
| **Mode Switching** | Radio-style list (All / Unused / Incorrect) with active badge, plus a truncated question card below |
| **Progress Map** | 2×3 grid of per-subject progress bars with percentage and "X/Y answered" counts. Bars animate in on scroll. |
| **Targeted Review** | Tabbed interface (Incorrect / Unused). Incorrect tab shows wrong vs correct answer badges. Unused tab shows unattempted questions. Tabs are clickable. |

### 4. CTA Banner
- Rounded card with warm gradient background (`brand-bone` tint)
- "Enter Chiron." heading + subtext + primary button
- Responsive: stacks vertically on mobile

### 5. Footer
- Simple single row: app name left, "For study use." right

---

## Animations

### Scroll Reveal
- Class: `.chiron-reveal` + `data-reveal` attribute
- Elements start `opacity: 0` and `translate: 0 24px` (shifted down 24px)
- When 12% visible (IntersectionObserver), class `.is-visible` is added
- Transition: `520ms cubic-bezier(0.22, 1, 0.36, 1)` on both opacity and translate
- Stagger delays: `chiron-reveal-delay-1` (80ms), `delay-2` (140ms), `delay-3` (200ms)

### Ambient Background Glows
- Two large blurred circles (30rem diameter, `filter: blur(64px)`, opacity 0.33)
- Glow one: top-left, blue tint, drifts via `chiron-drift-1` animation (12s alternate)
- Glow two: right side, copper tint, drifts via `chiron-drift-2` animation (15s alternate)
- Positioned absolute behind all content (`z-index: 0`)

### Progress Bar Fill
- Class: `.chiron-meter-fill-animated`
- Starts at `width: 0`, animates to `var(--fill-target)` over `1s cubic-bezier(0.22, 1, 0.36, 1)`
- Animation is paused by default; plays when parent has `.is-visible` (tied to scroll reveal)

### Stat Pill Pulse
- Three hero stat pills cycle opacity between 0.75 and 1.0 over 5.5s
- Stagger: 0s, 0.9s, 1.8s

### Hover Micro-interactions
- Landing buttons: lift `1px` up on hover (`translate: 0 -1px`)
- Surface cards: lift `2px` up, border tints toward blue, shadow increases
- Subject tags: border color changes on hover, blue tint background when selected
- Answer choices: background shifts to hover color, then to success-bg or error-bg on answer

### Reduced Motion
- All animations and transitions are disabled when `prefers-reduced-motion: reduce`
- Reveal elements render at full opacity immediately
- Progress bars show at final width without animation

---

## Feedback Colors (Exam)

Used in the question interface and review sections:

| State | Border | Background | Text/Icon |
|---|---|---|---|
| Correct answer | `--color-success` | `--color-success-bg` | Green check icon |
| Wrong answer | `--color-error` | `--color-error-bg` | Red X icon |
| Selected (before submit) | `--color-brand-blue` | 10% blue mix | — |
| Explanation panel | `--color-success` border | `--color-success-bg` | Green label + secondary text |

---

## Icon System

Icons come from [Lucide React](https://lucide.dev/). Used at `w-3.5 h-3.5` (14px) for inline/pill usage, `w-4 h-4` (16px) for buttons. No custom SVGs on the landing page.

Key icons used:
- `ArrowRight` — CTAs
- `Clock3` — Timer, timed sets
- `Target` — Adaptive review
- `Activity` — Live progress
- `CheckCircle2` — Correct answer
- `XCircle` — Wrong answer
- `RotateCcw` — Unused/retry

---

## Dark Mode Implementation

- Toggled by adding/removing `.dark` class on `<html>`
- All components reference CSS variables — no conditional styling in JS
- `getLogoUrl(theme)` swaps between `logo-light.svg` and `logo-dark.svg`
- Landing background gradients use `color-mix()` with brand tokens, so they adapt automatically

---

## Key Files

| File | Contains |
|---|---|
| `src/index.css` | All design tokens, global styles, landing-specific styles |
| `src/config/branding.ts` | App name, tagline, logo URLs |
| `src/context/ThemeContext.tsx` | Dark mode toggle logic |
| `src/pages/Landing.tsx` | Landing page component |
| `src/pages/Login.tsx` | Login/demo mode page |
| `public/logo-light.svg` | Logo for light mode |
| `public/logo-dark.svg` | Logo for dark mode |
