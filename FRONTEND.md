# Chiron — Frontend Architecture

Design tokens, component system, and patterns for the Chiron frontend.

---

## Visual Philosophy

**"Precision Fluidity"** — operational, clean, polished and approachable. Minimalism is functional, not decorative.

| Principle | Implementation |
|---|---|
| **Typography carries hierarchy** | Size (2xl → xs), weight (600 → 400), and spacing define structure. Color is supportive, never structural. |
| **Color communicates status** | Green = success, Amber = warning, Red = error, Blue = accent/active. Neutral grays for everything else. |
| **Density without clutter** | Compact spacing (gap-2 to gap-4), but consistent breathing room. |
| **Icons, never emojis** | All iconography via Lucide React. Clean, consistent 16px stroke icons. |
| **Flat surfaces** | No gratuitous shadows. Subtle shadows only on hover or elevated surfaces (dropdowns, modals). |
| **Instant interactions** | All hover/focus transitions ≤100ms. Entrance animations ≤200ms. |

## Non-Negotiables

- Every interactive element is keyboard-accessible
- Visible `:focus-visible` rings (`2px solid #3B82F6`, `2px offset`)
- Dark mode via CSS variables — never hardcoded Tailwind colors
- No information conveyed by color alone (always pair with text/icon)
- Loading states use `<Skeleton*>` components, never spinners
- Empty states use `<EmptyState>` component with icon, title, description, optional CTA
- Modals close on Escape and backdrop click

## Responsive Strategy

- **Desktop-first** — primary target is desktop dashboards
- Container max-width: `1200px`, centered
- Sidebar is collapsible for more workspace
- Breakpoints: Tailwind defaults (`sm:640px`, `md:768px`, `lg:1024px`)
- Mobile: stack columns vertically, hide sidebar labels

---

## Design Tokens

All tokens in `src/index.css` under `:root` and `:root.dark`.

### Color Palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-bg-primary` | `#FFFFFF` | `#0F0F0F` | Surfaces, cards, modals |
| `--color-bg-secondary` | `#F9FAFB` | `#171717` | Page background |
| `--color-bg-tertiary` | `#F3F4F6` | `#262626` | Hover states, skeletons |
| `--color-bg-active` | `#EFF6FF` | `#1E3A5F` | Active/selected items |
| `--color-text-primary` | `#111827` | `#F9FAFB` | Headings |
| `--color-text-secondary` | `#4B5563` | `#D1D5DB` | Body text |
| `--color-text-tertiary` | `#6B7280` | `#9CA3AF` | Labels |
| `--color-text-muted` | `#9CA3AF` | `#6B7280` | Placeholders |
| `--color-border` | `#E5E7EB` | `#262626` | Borders |
| `--color-accent` | `#3B82F6` | `#60A5FA` | Accent blue |

**Status:** Success `#10B981`, Warning `#F59E0B`, Error `#EF4444` (with light/dark bg variants).

**Brand:** `--color-brand-ink`, `--color-brand-blue`, `--color-brand-bone`, `--color-brand-copper`, `--color-brand-glow`.

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| UI / Body | Nunito | 400, 500 | `0.875rem` (14px) |
| Display / Titles | Nunito | 600, 700 | `text-lg` to `text-3xl` |
| Metadata | JetBrains Mono | 400, 500 | `0.75rem` (12px) |

### Spacing

| Element | Value |
|---|---|
| Container max-width | `1200px` |
| Card padding (chiron-mockup) | `1.1rem` |
| Section padding | `3.5rem` (py-14) |
| Sidebar expanded | `224px` |
| Sidebar collapsed | `56px` |
| Border radius — buttons | `6px` |
| Border radius — cards | `8px` / `1rem` (chiron-mockup) |
| Icon size | `w-4 h-4` (standard), `w-5 h-5` (header) |

### Shadows

| Token | Light | Dark |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | `0 4px 6px -1px rgba(0,0,0,0.4)` |

### Motion

| Token | Duration | Usage |
|---|---|---|
| `--transition-fast` | `100ms` | Buttons, hovers |
| `--transition-normal` | `150ms` | Panels, cards |
| Sidebar collapse | `200ms` | Width transition |
| Scroll reveal | `520ms` | chiron-reveal elements |

---

## Component Classes

### Buttons
- `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-accent`
- Landing: `.chiron-btn-primary` (gradient), `.chiron-btn-subtle` (bordered)

### Panels
- `.chiron-mockup` — primary panel container (border, radius, padding, shadow)
- `.chiron-mockup-label` — panel header text
- `.chiron-mockup-meta` — panel footer row

### Progress
- `.chiron-progress-grid` — 2-column grid layout
- `.chiron-progress-row` — individual bordered item
- `.chiron-meter-track` / `.chiron-meter-fill` — gradient progress bars

### Feature Sections
- `.chiron-feature-label` — uppercase kicker
- `.chiron-feature-heading` — section title
- `.chiron-feature-body` — section description

### Page Structure
- `.chiron-dash` — page background with ambient gradient
- `.dash-glow` — ambient glow overlay
- `.chiron-page-enter` — staggered entrance animation

---

## App Pages

| Route | Page | Group |
|---|---|---|
| `/dashboard` | Dashboard — stats, analytics, breakdown, goals, actions | Study |
| `/exam/config` | ExamConfig — section selection, mode, count, start | QBank |
| `/previous-tests` | PreviousTests — session history, review, retake | QBank |
| `/performance` | Performance — dedicated analytics | QBank |
| `/search` | Search — keyword + section search | QBank |
| `/notes` | Notes — split-pane editor | Tools |
| `/flashcards` | Flashcards — decks, cards, SM-2 review | Tools |
| `/bookmarks` | Bookmarks — saved questions | Tools |
| `/lab-values` | LabValues — reference values | Tools |
| `/settings` | Settings — user preferences | Bottom |
| `/exam` | ExamView — exam-taking interface | (standalone) |

## Sidebar Navigation

Three groups: **Study**, **QBank**, **Tools**. Group labels shown when expanded, dividers when collapsed. Settings pinned at bottom. User menu pops up from the user area.

---

## Adding a new page

1. Create `src/pages/NewPage.tsx` using the chiron page pattern (`chiron-dash` → section → container → feature-label/heading → chiron-mockup panels)
2. Add route in `App.tsx` using `<ProtectedPage><NewPage /></ProtectedPage>`
3. Add nav item in `AppSidebar.tsx` — add to the appropriate `navGroups` entry
4. Import Lucide icon for the nav item
5. Add TypeScript types in `api/types.ts` and API methods in `api/api.ts` if needed

## Adding a new API endpoint

1. Add TypeScript interface in `api/types.ts`
2. Add method to the appropriate namespace in the `api` object in `api/api.ts`
3. Use `request<T>()` helper (handles auth headers and error handling)

## Styling checklist

- [ ] Use `var(--color-*)` tokens, not hardcoded colors
- [ ] Apply `transition-colors` on interactive elements
- [ ] Use `text-sm` for body, `text-xs` for metadata
- [ ] Use Lucide icons at `w-4 h-4`
- [ ] Ensure keyboard accessibility and visible focus states
- [ ] Test in both light and dark mode
- [ ] Wrap content in `chiron-mockup` panels for consistency
