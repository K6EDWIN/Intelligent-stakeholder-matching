---
name: Aero Executive
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5c403f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#906f6e'
  outline-variant: '#e5bdbb'
  surface-tint: '#bf0229'
  primary: '#9e001f'
  on-primary: '#ffffff'
  primary-container: '#c8102e'
  on-primary-container: '#ffdad8'
  inverse-primary: '#ffb3b1'
  secondary: '#515f72'
  on-secondary: '#ffffff'
  secondary-container: '#d2e1f7'
  on-secondary-container: '#566477'
  tertiary: '#6d4400'
  on-tertiary: '#ffffff'
  tertiary-container: '#8e5900'
  on-tertiary-container: '#ffddb8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#d5e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0e1c2d'
  on-secondary-fixed-variant: '#3a485a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system serves an enterprise-grade alumni networking and flight operations ecosystem tailored for Kenya Airways. The platform balances executive corporate governance with operational command-center rigor. The aesthetic blends modern developer-tool efficiency (Linear-inspired crisp micro-borders, dense metrics, subdued typography) with sovereign aviation prestige.

### Emotional Signature
- **Command & Composure:** High data clarity, precise alignment, zero visual excess.
- **National Flagship Pride:** Deliberate, high-impact accents of crimson paired with deep oceanic navy, projecting institutional heritage.
- **Elite Cohesion:** Tiered alumni and operational statuses rendered with jewel-like clarity, reinforcing mutual professional achievement.

### Visual Style
- **Control Center Density:** Compact vertical cadence, 1px structural dividing lines, micro-labels, and integrated monospaced metrics.
- **Subtle Modern Depth:** Pure slate canvas offset by clinical white cards, faint navy surfaces for navigation rails, and micro-diffused elevations.

## Colors

The system uses a calibrated four-tier color architecture that balances crisp neutral data canvases with deep aeronautical midnight and sovereign red accents.

### Color Tokens & Roles
- **Primary Pride Red (`#c8102e`):** Reserved for core actions, critical operational callouts, live network indicators, and active selection anchors.
  - Hover: `#a50d25`
  - Subtle Tint: `#fef2f2`
  - Border Tint: `#fecaca`
- **Deep Midnight Navy (`#071626`):** The institutional anchor. Used for high-contrast navigation sidebars, mastheads, executive metric headers, and high-emphasis typography.
  - Surface Navy: `#0e2740` (Used for nested operational dark bars, floating tooltips, and elevated control decks)
  - Navy Border: `#1e3a5f` (Subtle boundary between deep elements)
- **Asante Gold / Amber (`#f59e0b`):** Elite accreditation, loyalty markers, and tier highlights (Asante Rewards, Captain badges, service milestones).
  - Subtle Gold Tint: `#fffbeb`
  - Gold Border Tint: `#fde68a`
- **Neutrals & Surfaces:**
  - Canvas Root: `#f8fafc`
  - Card & Container Surface: `#ffffff`
  - Muted Borders: `#e2e8f0`
  - Secondary Text / Meta Slate: `#64748b`
  - Primary Text: `#0f172a`

## Typography

The typographic hierarchy combines **Plus Jakarta Sans** for structural headers with **Inter** for data grids, metadata, body text, and micro-labels. 

### Typographic Principles
- **Headlines:** Set in Plus Jakarta Sans with subtle negative letter-spacing for tight, architectural balance.
- **Labels & Micro-copy:** Uppercase badge tags and metadata employ `label-sm` with tabular tracking (`0.04em`) to ensure legibility across high-density tables and badge overlays.
- **Operational Data:** Flight codes, staff IDs, and alumni graduation classes apply tabular numeric rendering (`font-variant-numeric: tabular-nums`) within `Inter` to retain rigid columnar alignment.

## Layout & Spacing

The layout model is anchored by a structured 12-column grid designed for data-dense dashboards, directories, and alumni record sheets.

### Grid & Breakpoints
- **Desktop (≥ 1280px):** 12-column grid with a fixed collapsible 260px Midnight Navy navigation rail, `gutter-lg` (32px), and `margin-lg` (48px). Main content area caps comfortably at 1600px max width.
- **Tablet (768px - 1279px):** 8-column layout with compact rail (icon-only 64px), `gutter-md` (24px), and `margin-md` (32px).
- **Mobile (< 768px):** 4-column reflow with persistent top utility bar and sticky bottom quick-action sheet. Gutters drop to `gutter` (16px), margins to `margin` (16px).

### Spacing Philosophy
Internal component padding uses predictable geometric multiples: `space-xs` (4px) for badge and icon offsets, `space-sm` (8px) for input and button gaps, and `space-md` (16px) for card interiors.

## Elevation & Depth

Visual hierarchy prioritizes crisp perimeter definition over heavy drop shadows, achieving a technical, control-room aesthetic.

### Depth Architecture
- **Level 0 (Base Canvas):** `#f8fafc` flat background. No shadow.
- **Level 1 (Card & Module Shells):** `#ffffff` fill framed by a hairline `1px solid #e2e8f0` stroke. Layered with a feather-weight ambient shadow: `0 1px 3px 0 rgba(7, 22, 38, 0.04), 0 1px 2px -1px rgba(7, 22, 38, 0.02)`.
- **Level 2 (Interactive Flyouts & Hover Surfaces):** Active cards and elevated popovers maintain the hairline stroke, augmented by an operational navy-tinted lift: `0 8px 20px -4px rgba(7, 22, 38, 0.08), 0 4px 8px -2px rgba(7, 22, 38, 0.04)`.
- **Level 3 (Modal Overlays & Command Bars):** `0 20px 35px -10px rgba(7, 22, 38, 0.16)`. Accompanied by a 40% opacity navy backdrop blur (`backdrop-filter: blur(4px)` with background `rgba(7, 22, 38, 0.4)`).
- **Inverted Surfaces (Command & Nav Rails):** Deep Midnight Navy (`#071626`) using inner hairline separators (`1px solid #1e3a5f`) rather than drop shadows.

## Shapes

The design system standardizes on **Rounded (Level 2)** geometry, balancing professional software structure with modern ergonomic curves.

### Corner Radii Guidelines
- **Containers & Panels (`rounded-xl`):** All major content cards, metric tiles, and operational modules use `1rem` (16px) radii to soften large layout blocks.
- **Interactive Elements (`rounded-lg`):** Buttons, inputs, search dropdowns, and data drawers utilize `0.5rem` (8px) for clear, clickable affordances.
- **Micro Tags & Badges (`rounded-full`):** Identity tags, elite Asante ribbons, and operational status pills use a 9999px fully rounded stadium shape to contrast clearly against structural square containers.

## Components

### Buttons
- **Primary Pride:** Background `#c8102e`, text `#ffffff`, border 1px solid transparent. Hover `#a50d25`. Active scale `0.99`. Focus: 2px ring `#fecaca`.
- **Secondary Corporate:** Background `#ffffff`, text `#071626`, border `1px solid #e2e8f0`. Hover background `#f8fafc`, border `#cbd5e1`.
- **Command Navy:** Background `#071626`, text `#ffffff`. Hover `#0e2740`. Used for administrative overrides and export controls.

### Status Badges & Chips
Rendered in `label-sm` with `rounded-full` curvature, 6px padding horizontal, and 2px vertical:
- **Verified:** Background `#ecfdf5`, text `#047857`, border `1px solid #a7f3d0` with an active dot indicator.
- **Pending Review:** Background `#fffbeb`, text `#b45309`, border `1px solid #fde68a`.
- **Asante Elite:** Background `#fffbeb`, text `#b45309`, border `1px solid #f59e0b` accompanied by a micro star glyph.
- **Flight Crew:** Background `#f0f9ff`, text `#0369a1`, border `1px solid #bae6fd`.
- **Pride Centre Alumni:** Background `#fef2f2`, text `#c8102e`, border `1px solid #fecaca`.

### Form Inputs
- **Base Style:** Background `#ffffff`, border `1px solid #e2e8f0`, border-radius `0.5rem` (8px), height 40px, font `body-md`.
- **Focus State:** Border `#c8102e`, outer ring `3px solid #fef2f2`.
- **Trailing Metas:** Flight search fields support inline airport codes (`NBO`, `LHR`, `JNB`) formatted in `metric-mono` text color `#64748b`.

### Data Cards & Alumni Record Modules
- **Container Structure:** Crisp 1px border (`#e2e8f0`), `#ffffff` surface, padding 20px, `rounded-xl`.
- **Header Slot:** Left-aligned avatar (with verified status badge ring), accompanied by name and Pride Centre cohort metadata. Right-aligned Asante loyalty badge.
- **Footer Shelf:** Low-contrast background `#f8fafc`, top divider `1px solid #e2e8f0`, embedding operational contact actions and credential verification IDs.

### Specialized Aviation Modules
- **Operations Metric Cell:** High-density KPI tile pairing an uppercase micro-label (`label-sm`), large tabular numeral display, and dynamic trend indicator.
- **Route & Crew Timeline:** Horizontal segmented line linking route origins to destinations with flight durations and active alumni cockpit/cabin crew allocations.