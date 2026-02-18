
### 8.1 Visual Philosophy

**"Precision Fluidity"** — operational, clean, but polished and approachable. Minimalism is functional, not decorative.

| Principle | Implementation |
|---|---|
| **Typography carries hierarchy** | Size (2xl → xs), weight (600 → 400), and spacing define structure. Color is supportive, never structural. |
| **Color communicates status** | Green = success, Amber = warning, Red = error, Blue = accent/active. Neutral grays for everything else. |
| **Density without clutter** | Compact spacing (gap-2 to gap-4), but consistent breathing room. No wasted whitespace, no cramped layouts. |
| **Icons, never emojis** | All iconography via Lucide React. Clean, consistent 16px stroke icons. |
| **Flat surfaces** | No gratuitous shadows or depth. Subtle shadows only on hover (card lift) or elevated surfaces (dropdowns, modals). |
| **Instant interactions** | All hover/focus transitions ≤100ms. Entrance animations ≤200ms. No bounce, no overshoot. |

### 8.2 Non-Negotiables

- Every interactive element is keyboard-accessible
- Visible `:focus-visible` rings on all non-input interactive elements (`2px solid #3B82F6`, `2px offset`)
- Dark mode must work fully — use CSS variables or custom classes, not hardcoded Tailwind colors
- No information conveyed by color alone (always pair with text/icon)
- Loading states use `<Skeleton*>` components, never spinners (except the initial app load spinner)
- Empty states use purpose-built `<Empty*>` components with illustrations and CTAs
- Modals close on Escape and backdrop click
- Body scroll is locked when modals are open

### 8.3 Responsive Strategy

- **Desktop-first** — the primary target is desktop dashboards
- Container max-width: `1200px`, centered with `margin: 0 auto`
- Sidebar is collapsible for more workspace
- Responsive breakpoints follow Tailwind defaults (`sm:640px`, `md:768px`, `lg:1024px`)
- Mobile: stack columns vertically, hide sidebar labels
- Touch targets: ≥44px on mobile

---


## 3. Design Tokens (CSS Custom Properties)

All design tokens are defined in `index.css` under `:root` and `:root.dark`. They are consumed via Tailwind's `@theme` directive and directly in custom CSS classes.

### 3.1 Color Palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-bg-primary` | `#FFFFFF` | `#0F0F0F` | Main surfaces, cards, modals |
| `--color-bg-secondary` | `#F9FAFB` | `#171717` | Page background, sidebar |
| `--color-bg-tertiary` | `#F3F4F6` | `#262626` | Subtle backgrounds, hover states |
| `--color-bg-hover` | `#F3F4F6` | `#262626` | Interactive hover |
| `--color-bg-active` | `#EFF6FF` | `#1E3A5F` | Active/selected items |
| `--color-text-primary` | `#111827` | `#F9FAFB` | Headings, primary text |
| `--color-text-secondary` | `#4B5563` | `#D1D5DB` | Body text, descriptions |
| `--color-text-tertiary` | `#6B7280` | `#9CA3AF` | Labels, captions |
| `--color-text-muted` | `#9CA3AF` | `#6B7280` | Placeholders, disabled |
| `--color-border` | `#E5E7EB` | `#262626` | Default borders |
| `--color-border-hover` | `#D1D5DB` | `#404040` | Hover borders |
| `--color-accent` | `#3B82F6` | `#60A5FA` | Primary accent (blue) |
| `--color-accent-hover` | `#2563EB` | `#3B82F6` | Accent hover |
| `--color-accent-light` | `#EFF6FF` | `#1E3A5F` | Accent background |
| `--color-accent-text` | `#1D4ED8` | `#93C5FD` | Accent-colored text |

**Status Colors:**

| Status | Color | Light BG | Dark BG |
|---|---|---|---|
| Success | `#10B981` / `#34D399` | `#ECFDF5` | `#064E3B` |
| Warning | `#F59E0B` / `#FBBF24` | `#FEF3C7` | `#78350F` |
| Error | `#EF4444` / `#F87171` | `#FEE2E2` | `#7F1D1D` |

### 3.2 Typography

Loaded via Google Fonts in `index.html` with `font-display=swap`.

| Role | Font | Weight | Size | CSS Class / Token |
|---|---|---|---|---|
| UI / Body | Inter | 400, 500 | `0.875rem` (14px) | `--font-sans` |
| Display / Titles | Inter | 600, 700 | `text-lg` to `text-3xl` | `.font-display` (adds `letter-spacing: -0.02em`) |
| Metadata / IDs / Timestamps | JetBrains Mono | 400, 500 | `0.75rem` (12px) | `.text-meta` or `.font-mono` |

**Hierarchy rule:** Size, weight, and spacing carry hierarchy — not color. Color is supportive only.

### 3.3 Spacing & Geometry

| Element | Value |
|---|---|
| Border radius (buttons, inputs, nav) | `6px` |
| Border radius (cards, panels, modals) | `8px` |
| Border radius (badges) | `4px` |
| Border radius (avatars) | `50%` (full) |
| Card padding | `1.25rem` (20px) |
| Modal padding | `1.5rem` (24px) horizontal, `1rem` (16px) vertical |
| Container max-width | `1200px` |
| Container padding | `1.5rem` (desktop), `1rem` (mobile) |
| Sidebar width (expanded) | `w-56` (224px) |
| Sidebar width (collapsed) | `w-14` (56px) |
| Top bar height | `h-14` (56px) |
| Icon size (standard) | `w-4 h-4` (16px) |
| Icon size (header actions) | `w-5 h-5` (20px) |
| Avatar size | `w-8 h-8` (32px) |

### 3.4 Shadows

| Token | Light | Dark |
|---|---|---|
| `--shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | `0 1px 2px 0 rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | `0 4px 6px -1px rgba(0,0,0,0.4)` |
| Elevated (dark) | — | `0 4px 20px rgba(0,0,0,0.5)` |

### 3.5 Motion

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `--transition-fast` | `100ms` | `ease-out` | Buttons, hovers, focus rings |
| `--transition-normal` | `150ms` | `ease-out` | Drawers, panels, cards |
| Sidebar collapse | `200ms` | `ease-in-out` | Sidebar width transition |
| Slide-in-right | `200ms` | `ease-out` | Right drawer entrance |
| Slide-up | `200ms` | `ease-out` | Modals, dropdowns, cards |
| Fade-in | `150ms` | `ease-out` | Overlays, appearing content |
| Skeleton shimmer | `1.5s` | `ease-in-out infinite` | Loading placeholders |
| Pulse-soft | `1.4s` | `ease-in-out infinite` | AI thinking indicator |

**Rule:** All interactive transitions must be ≤150ms. Entrance animations ≤200ms. No bounce, no overshoot — clean and mechanical.

---

## 4. Dark Mode Implementation

Dark mode is toggled via `ThemeContext` which adds/removes the `dark` class on `<html>`.

**Two-layer approach:**

1. **Custom properties:** `:root.dark` overrides all `--color-*` tokens. Any CSS class referencing these tokens automatically adapts.
2. **Tailwind overrides:** `:root.dark` includes explicit overrides for hardcoded Tailwind classes (`bg-white`, `bg-gray-50`, `text-gray-900`, etc.) using `!important`.

```css
:root.dark {
    & .bg-white { background-color: var(--color-bg-primary) !important; }
    & .bg-gray-50 { background-color: var(--color-bg-secondary) !important; }
    & .text-gray-900 { color: var(--color-text-primary) !important; }
    /* ... etc */
}
```

**Best practice going forward:** Prefer CSS variables (`bg-[var(--color-bg-primary)]`) or the custom CSS classes (`.panel`, `.card`, `.btn-*`) over hardcoded Tailwind color classes, to avoid needing dark mode overrides.

---

## 5. Component System

All components are custom-built. No external component library.

### 5.1 CSS Component Classes (in `index.css`)

These are utility classes that provide consistent styling across the app:

#### Buttons (`.btn`)
```
.btn              — base: inline-flex, center-aligned, gap-2.5, py-2 px-4, text-sm, font-medium, rounded-6px
.btn-primary      — dark bg (#111827), white text, subtle shadow
.btn-secondary    — white bg, gray border, gray text, sm shadow
.btn-ghost        — transparent bg, muted text, no border
.btn-accent       — blue bg (#3B82F6), white text
.btn:disabled     — opacity 0.5, cursor not-allowed
```

#### Inputs (`.input`)
```
.input            — full-width, py-2 px-3, text-sm, 1px border, rounded-6px
.input:hover      — border darkens
.input:focus      — blue border + blue ring (3px, 15% opacity)
```

#### Cards & Panels
```
.panel            — white bg, 1px border, rounded-8px (no padding — layout wrapper)
.card             — white bg, 1px border, rounded-8px, 1.25rem padding
.card-hover       — adds translateY(-1px) + shadow on hover
```

#### Badges (`.badge`)
```
.badge            — inline-flex, small padding, text-xs, font-medium, rounded-4px, gray bg
.badge-primary    — blue accent bg + text
.badge-success    — green bg + text
.badge-warning    — amber bg + text
.badge-error      — red bg + text
```

#### Drawers (`.drawer`)
```
.drawer           — secondary bg, right-border 1px
.drawer-right     — primary bg, left-border 1px, slide-in-right animation
```

#### Decorative
```
.gradient-bg      — subtle white-to-blue gradient
.gradient-text    — blue-to-violet gradient text (for hero headlines)
.glass            — frosted glass: 85% white bg, 12px blur, border-bottom
```


## 10. Quick Reference: Common Patterns

### Adding a new page
1. Create `src/pages/NewPage.tsx` following the page structure pattern (Section 7)
2. Add route in `App.tsx` under the `/app` parent route
3. Add nav item in `AppLayout.tsx` (choose `coreNav`, `toolsNav`, or `workspaceNav`)
4. Import Lucide icon for the nav item

### Adding a new reusable component
1. Create in `src/components/common/`
2. Export from `src/components/common/index.ts`
3. Use design tokens and CSS component classes from `index.css`

### Adding a new API endpoint
1. Add TypeScript interface in `api.ts`
2. Add method to the appropriate namespace in the `api` object
3. Use `request<T>()` helper which handles auth headers and error handling

### Adding a new modal
1. Use the `<Modal>` base component from `common/`
2. Pick a size (`sm` | `md` | `lg` | `xl`)
3. Escape and backdrop dismiss come free

### Styling checklist for new components
- [ ] Use `var(--color-*)` tokens or custom CSS classes, not hardcoded colors
- [ ] Apply `transition-colors` or `transition-all` with `var(--transition-fast)` on interactive elements
- [ ] Use `text-sm` (14px) for body text, `text-xs` (12px) for metadata
- [ ] Use Inter for UI text, JetBrains Mono (`.font-mono` / `.text-meta`) for IDs/timestamps
- [ ] Use Lucide icons at `w-4 h-4` (standard) or `w-5 h-5` (header)
- [ ] Ensure keyboard accessibility and visible focus states
- [ ] Test in both light and dark mode
