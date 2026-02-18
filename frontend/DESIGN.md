# Chiron — UI/UX Design Spec

Reference for designers working on the Chiron frontend. Everything here maps to actual CSS variables and components in `src/index.css` and the React source.

---

## Color System

All colors are defined as CSS custom properties on `:root` (light) and `:root.dark` (dark). Every surface, text element, and border references these tokens — never raw hex values in components.

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
| `--color-success` | `#10b981` | Correct answers, positive indicators |
| `--color-error` | `#ef4444` | Wrong answers, destructive actions |
| `--color-warning` | `#f59e0b` | Caution states |

### Dark Mode

Every token above has a dark counterpart. Key shifts:

- Backgrounds go near-black (`#0f0f0f` primary, `#171717` secondary, `#262626` tertiary)
- Text flips to light grays (`#f9fafb` primary, `#d1d5db` secondary)
- Borders darken to `#262626` / `#404040`
- Accent shifts to `#60a5fa` (lighter blue for contrast)
- Success/error/warning colors shift to lighter tints with dark background fills

### Brand Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-brand-ink` | `#111827` | `#f5f7fb` | Primary CTA gradient base |
| `--color-brand-blue` | `#3b82f6` | `#60a5fa` | Feature labels, active states, accents |
| `--color-brand-bone` | `#f8f5ee` | `#1f2937` | Warm tint in background gradient, CTA wrap |
| `--color-brand-copper` | `#b45309` | `#f59e0b` | Warm accent in ambient glow, meter gradient |
| `--color-brand-glow` | `rgba(59,130,246,0.2)` | `rgba(96,165,250,0.26)` | Background radial glow |

---

## Typography

| Property | Value |
|---|---|
| Primary font | `Nunito`, falling back to system sans-serif |
| Monospace font | `JetBrains Mono`, for code/meta text |
| Base body size | `0.875rem` (14px) |
| Display headings | `.font-display` — adds `letter-spacing: -0.02em` |
| Feature headings | `1.35rem`, weight 600 |
| Feature body | `0.88rem`, line-height 1.55 |
| Labels / kickers | `0.72rem`, uppercase, letter-spacing `0.08em–0.18em` |
| Nav group labels | `0.6rem`, uppercase, bold, tracking `0.12em` |

---

## Spacing & Layout

| Property | Value |
|---|---|
| Container max-width | `1200px`, centered, `1rem` padding (mobile), `1.5rem` (768px+) |
| Section padding | `3.5rem` top and bottom (py-14) |
| Card padding | `1.1rem` (chiron-mockup) |
| Grid gap (two-column) | `1.5rem` (gap-6) |
| Sidebar width (expanded) | `224px` (w-56) |
| Sidebar width (collapsed) | `56px` (w-14) |
| Nav group gap | `0.25rem` between items, `0.75rem` before group labels |

---

## Design System Classes

These CSS classes form the design language shared between the landing page and all app pages:

### Panels & Containers

| Class | Purpose |
|---|---|
| `.chiron-mockup` | Primary panel — 1px border, 1rem radius, 1.1rem padding, subtle shadow |
| `.chiron-mockup-label` | Panel header — 0.72rem, uppercase, tracking, muted color |
| `.chiron-mockup-meta` | Panel footer row — flex, gap-0.5rem, 0.72rem text |

### Progress & Metrics

| Class | Purpose |
|---|---|
| `.chiron-progress-grid` | 2-column grid of progress items, 0.7rem gap |
| `.chiron-progress-row` | Individual progress item — bordered, padded, bg-primary |
| `.chiron-meter-track` | Bar track — full width, 0.44rem height, rounded, tertiary bg |
| `.chiron-meter-fill` | Bar fill — gradient from brand-blue to brand-copper, transitions |
| `.chiron-meter-fill-animated` | Animated fill — grows from 0 to `--fill-target` on scroll reveal |

### Feature Sections

| Class | Purpose |
|---|---|
| `.chiron-feature-label` | Section kicker — 0.72rem uppercase, brand-blue color |
| `.chiron-feature-heading` | Section title — 1.35rem, semibold, display tracking |
| `.chiron-feature-body` | Section description — 0.88rem, secondary text, 1.55 line-height |

### Page Structure

| Class | Purpose |
|---|---|
| `.chiron-dash` | Page-level background (ambient gradient, positioned relative) |
| `.dash-glow` | Ambient glow overlay (large blurred gradient circles) |
| `.chiron-page-enter` | Staggered entrance animation (uses `--page-enter-order`) |

---

## Page Patterns

All app pages follow this consistent structure:

```
<div className="chiron-dash min-h-screen">
  <div className="dash-glow" />
  <section className="py-14 chiron-page-enter">
    <div className="container">
      <p className="chiron-feature-label">Group Name</p>
      <h1 className="chiron-feature-heading">Page Title</h1>
      <p className="chiron-feature-body mt-2">Description</p>
      
      <!-- Content in chiron-mockup panels -->
      <div className="chiron-mockup">
        <p className="chiron-mockup-label mb-4">Panel Title</p>
        <!-- Panel content -->
      </div>
    </div>
  </section>
</div>
```

### Dashboard Page

- **Overview section**: 2-column grid — left panel with 2×2 stat cards (chiron-progress-row), right panel with goal ring + meter bar
- **Analytics section**: 2-column grid of chiron-mockup panels wrapping recharts (ProgressChart, SectionBreakdown)
- **Section breakdown**: Left column with feature text + focus areas, right column with chiron-progress-grid
- **Quick actions**: chiron-mockup panel with action rows

### Previous Tests Page

- Filter tabs (All / Completed / In Progress) with active-state styling
- Session cards in chiron-mockup panels with status badges, accuracy meters, action buttons

### Performance Page

- 3-column summary stats in chiron-mockup panels
- 2-column chart grid (same as dashboard analytics)
- Full chiron-progress-grid section breakdown

### Notes Page

- Split-pane layout: 280px sidebar (note list) + main editor panel
- Both sides are chiron-mockup panels
- Inline title editing, textarea content, save/delete actions

### Flashcards Page

- Due-card banner with start-review button
- Deck creation input + deck list
- Card review interface with flip animation and SM-2 quality buttons
- chiron-meter-track progress bar during review

### Search Page

- Search input + section filter + search button in a chiron-mockup panel
- Results in chiron-progress-row cards with section badges, expandable stems

### Bookmarks Page

- chiron-mockup panel wrapping chiron-progress-row cards
- Section tags, saved date, expandable question stems

---

## Sidebar Navigation

Grouped into three labeled sections:

| Group | Items |
|---|---|
| **Study** | Dashboard |
| **QBank** | New Test, Previous Tests, Performance, Search |
| **Tools** | Notes, Flashcards, Bookmarks, Lab Values |

Group labels: `0.6rem`, bold, uppercase, `tracking-[0.12em]`, muted color. Hidden when sidebar is collapsed (dividers shown instead).

---

## Animations

### Scroll Reveal
- Class: `.chiron-reveal` + `data-reveal` attribute
- Start: `opacity: 0`, `translate: 0 24px`
- Trigger: 12% visible via IntersectionObserver → `.is-visible` added
- Transition: `520ms cubic-bezier(0.22, 1, 0.36, 1)`

### Page Enter
- Class: `.chiron-page-enter` with `--page-enter-order` CSS variable
- Staggered entrance for dashboard/page sections

### Progress Bar Fill
- Class: `.chiron-meter-fill-animated`
- Animates width from 0 to `var(--fill-target)` over 1s
- Paused by default; plays when parent has `.is-visible`

### Ambient Background Glows
- Two large blurred circles (30rem diameter, blur 64px, opacity 0.33)
- Drift animations at 12s and 15s cycles

### Reduced Motion
- All animations disabled when `prefers-reduced-motion: reduce`
- Reveal elements render at full opacity immediately

---

## Feedback Colors (Exam)

| State | Border | Background | Text/Icon |
|---|---|---|---|
| Correct answer | `--color-success` | `--color-success-bg` | Green check |
| Wrong answer | `--color-error` | `--color-error-bg` | Red X |
| Selected (before submit) | `--color-brand-blue` | 10% blue mix | — |

---

## Icon System

All icons from [Lucide React](https://lucide.dev/). Standard size `w-4 h-4` (16px), header size `w-5 h-5` (20px).

Key icons: `LayoutDashboard`, `PlusCircle`, `ClipboardList`, `BarChart3`, `Search`, `FileText`, `Layers`, `Bookmark`, `FlaskConical`, `Settings`, `CheckCircle2`, `XCircle`, `TrendingUp`, `BookOpen`, `ArrowRight`, `Target`, `Clock3`, `Activity`.

---

## Key Files

| File | Contains |
|---|---|
| `src/index.css` | All design tokens, global styles, chiron component classes |
| `src/config/branding.ts` | App name, tagline, logo URLs |
| `src/context/ThemeContext.tsx` | Dark mode toggle logic |
| `src/components/layout/AppSidebar.tsx` | Sidebar navigation with grouped sections |
| `src/pages/Landing.tsx` | Landing page |
| `src/pages/Dashboard.tsx` | Dashboard with stats, analytics, breakdown |
| `src/pages/PreviousTests.tsx` | Test session history |
| `src/pages/Performance.tsx` | Dedicated analytics page |
| `src/pages/Search.tsx` | Question search |
| `src/pages/Notes.tsx` | Notes editor |
| `src/pages/Flashcards.tsx` | Flashcard decks and review |
| `src/pages/Bookmarks.tsx` | Saved questions |
| `src/pages/ExamConfig.tsx` | Test configuration |
| `src/pages/ExamView.tsx` | Exam-taking interface |
| `src/pages/LabValues.tsx` | Lab values reference |
| `src/pages/Settings.tsx` | User settings |
