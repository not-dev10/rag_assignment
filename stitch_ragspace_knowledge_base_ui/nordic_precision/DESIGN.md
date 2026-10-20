---
name: Nordic Precision
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
  on-surface-variant: '#46464b'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777b'
  outline-variant: '#c6c6cb'
  surface-tint: '#5d5e64'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1a1b21'
  on-primary-container: '#82838a'
  inverse-primary: '#c6c6cd'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00201d'
  on-tertiary-container: '#389189'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e9'
  primary-fixed-dim: '#c6c6cd'
  on-primary-fixed: '#1a1b21'
  on-primary-fixed-variant: '#45474c'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#9cf2e8'
  tertiary-fixed-dim: '#80d5cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#00504a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  canvas-bg: '#F4F5F7'
  surface-card: '#FFFFFF'
  border-subtle: '#EAECF0'
  border-strong: '#D0D5DD'
  accent-sky-bg: '#F0F9FF'
  accent-sky-border: '#BAE6FD'
  accent-sky-text: '#0369A1'
  status-indexing-bg: '#FEF3C7'
  status-indexing-text: '#92400E'
  status-processing-bg: '#EFF6FF'
  status-processing-text: '#1E40AF'
  status-indexed-bg: '#ECFDF5'
  status-indexed-text: '#065F46'
  status-failed-bg: '#FEF2F2'
  status-failed-text: '#991B1B'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a high-clarity, Scandinavian-minimal workspace engineered for advanced Retrieval-Augmented Generation workflows. The aesthetic merges technical rigor with architectural calm, eliminating cognitive fatigue during complex vector query composition, retrieval auditing, and pipeline tuning.

### Design Movement & Aesthetic
- **Architectural Minimalism with Soft Precision**: Characterized by expansive, low-saturation canvas grounds (`#F4F5F7`), floating pure white container islands with generous interior breathing room, and whisper-thin boundaries (`#EAECF0`).
- **Tactile High-Contrast Anchors**: Deep obsidian surfaces (`#111318`) anchor mission-critical telemetry and query inputs, contrasting directly against soft cerulean and slate utility zones.
- **Micro-Metric Legibility**: Clean horizontal structures, unembellished typography, and high-legibility data tagging inspired by technical telemetry and clinical clarity.

## Colors

The palette establishes hierarchy through light dominance and deliberate tonal contrasts rather than saturated surfaces.

### Hierarchy & Role Allocation
- **Canvas Base (`#F4F5F7`)**: An unyielding, neutral-cool backdrop providing uniform structural separation from nested surfaces.
- **Pure Surface (`#FFFFFF`)**: Floating component cards, ingestion lists, and document panels sit purely white on top of the base.
- **Deep Obsidian Primary (`#111318`)**: Reserved for primary action controls, selected navigation tabs, terminal analytics headers, and high-impact metadata readouts.
- **Cyan & Sky Secondary (`#0284C7`)**: Highlights vector match scores, citation references, active pipeline connectors, and hyper-focused interactive triggers.
- **Telemetry Indicators**: Distinct, non-distracting pastels allocated specifically for ingestion lifecycle states (Indexing, Processing, Indexed, Failed).

## Typography

The typographic hierarchy prioritizes technical legibility at small sizes. Numerical readouts, semantic tokens, and file extensions require strict horizontal alignment and optical balance.

### Implementation Rules
- **Display Weights**: Headlines leverage semibold weights (`600`) with tight letter-spacing to present a deliberate, modern tone.
- **Monospaced Integration**: Embeddings, chunk hashes, metadata keys, and vector metrics must render in `JetBrains Mono` (`code-sm`) to distinguish raw system state from synthesized textual output.
- **Casing**: Labels, micro-badges, and status tags apply sentence casing or pure capital tracking (`letterSpacing: 0.04em`) to maintain consistent visual density.

## Layout & Spacing

The layout is built upon an architectural grid with deliberate visual buffers that prevent data density from turning into clutter.

### Spatial Strategy
- **Grid Architecture**: Standard 12-column layout on desktop with fluid column expansion, bounded by a maximal workspace width of `1680px`.
- **Island Encapsulation**: Data surfaces sit enclosed inside standalone containers flanked by minimum `margin` values on all sides; nested elements conform strictly to multiples of `0.25rem` (4px baseline).
- **Adaptive Breakpoints**:
  - **Desktop (≥ 1280px)**: 3-pane orchestration (Knowledge Tree / Vector Explorer / Real-time Inspector), 24px gutters.
  - **Tablet (768px - 1279px)**: Dual-pane collapsible drawer model; analytics collapse below active retrieval tables.
  - **Mobile (< 768px)**: Single-column linear stack, bottom-sheet inspector panels, margin reduced to `1rem`.

## Elevation & Depth

Visual plane differentiation is established primarily through tonal stratification and precise hairline contours, avoiding heavy or dark drop-shadows.

### Layer Tiers
- **Tier 0 (Substrate)**: Canvas background (`#F4F5F7`), zero elevation, structural bedrock.
- **Tier 1 (Surface Islands)**: White panels (`#FFFFFF`) with 1px border (`#EAECF0`) and an ambient, low-density shadow: `0 1px 3px 0 rgba(16, 24, 40, 0.04), 0 1px 2px -1px rgba(16, 24, 40, 0.02)`.
- **Tier 2 (Floating Overlays & Controls)**: Popovers, context menus, and active search bars: `0 12px 24px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)`, bordered with `#D0D5DD`.
- **Tier 3 (High-Contrast Anchors)**: Deep obsidian analytics sections (`#111318`) operate on an inverse luminance scale, elevated above canvas elements via absolute contrast rather than Z-axis blur.

## Shapes

The design system incorporates organic curvature with precise corners to yield a friendly yet technical interface.

### Curvature Geometry
- **Primary Panels & Large Cards**: Standardized at a sweeping `20px` to `24px` radius (`rounded-xl` to custom boundary), producing floating island units.
- **Interior Components & Inputs**: Standardized at `8px` to `10px` (`rounded-md`), retaining crisp internal structures within larger curved panels.
- **Interactive Pills & Badges**: Standardized at full-capsule (`rounded-full`), accentuating status chips, dynamic tags, and toggle switches.

## Components

### Buttons
- **Primary Button**: Deep charcoal solid (`#111318`), pure white label (`#FFFFFF`), `rounded-full` or `rounded-lg` (8px), height 40px, padding `0 18px`. Hover: `#222630`. Active: `#0A0B0E`.
- **Secondary Button**: Crisp white background (`#FFFFFF`), boundary stroke (`#D0D5DD`), text `#111318`. Hover: `#F9FAFB`.
- **Ghost / Action Trigger**: Zero background, text `#64748B`, hover background `#F4F5F7`.

### Knowledge & Lifecycle Chips
- **Geometry**: Height 24px, pill-curved (`rounded-full`), padding `0 10px`, typography `label-sm`.
- **State Variations**:
  - *Indexing*: Background `#FEF3C7`, text `#92400E`, subtle pulse dot indicator.
  - *Processing*: Background `#EFF6FF`, text `#1E40AF`, rotational loader indicator.
  - *Indexed*: Background `#ECFDF5`, text `#065F46`, static check indicator.
  - *Citation Chip*: Background `#F0F9FF`, border `1px solid #BAE6FD`, text `#0369A1`, monospace anchor index.

### Form Inputs & Search Fields
- **Container**: White background, 1px border (`#EAECF0`), `rounded-lg` (10px), height 44px, padding `0 14px`.
- **Focus State**: Hairline ring `2px solid #0284C7` with zero blur, inner border `#0284C7`.
- **Contextual Search**: Embedded forward slash (`/`) command shortcut chip in light neutral slate.

### Knowledge Cards
- **Structural Container**: Pure white base, `20px` corner radius, 1px perimeter border (`#EAECF0`), ambient soft shadow.
- **Sky Blue Variant (Retrieval Highlights)**: Background `#F0F9FF`, border `#BAE6FD`, inner telemetry displaying cosine similarity score and token usage metrics in deep cyan.

### High-Contrast Analytics Panel
- **Container**: Solid `#111318`, pure white headlines, muted slate captions (`#94A3B8`), subtle inner border (`rgba(255, 255, 255, 0.08)`).
- **Data Points**: Emerald green vector cluster status pills, white typography, micro-sparklines rendered in sky blue (`#0284C7`).