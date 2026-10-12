---
name: Ziyo LMS
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
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#4e45d5'
  on-secondary: '#ffffff'
  secondary-container: '#6860ef'
  on-secondary-container: '#fffbff'
  tertiary: '#005338'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#100069'
  on-secondary-fixed-variant: '#372abf'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

The design system establishes a focused, encouraging, and distraction-free mobile learning environment tailored for modern students. The personality is disciplined yet approachable, intelligent, and motivating. The interface evokes a sense of structured clarity, academic progress, and technological competence. 

Drawing from modern iOS and Android interface paradigms with soft tactile cards and subtle atmospheric backdrops, the style blends clean minimalism with soft frosted translucency. Key traits include:
- **Calm, High-Readability Surfaces**: Pure white raised cards against a soft cool-neutral backdrop reduce eye fatigue during extended study sessions.
- **Micro-Atmospheric Gradients**: Subtle, low-opacity violet-indigo ambient glows emphasize active lesson cards and hero elements without visual noise.
- **Cultured Localization**: Explicitly crafted for the Latin script Uzbek language (`O‘zbekcha`), balancing typographic rhythms for distinctive diacritical marks (apostrophes, okina-like modifiers such as `o‘`, `g‘`, `sh`, `ch`) with high legibility across mobile touch targets.

## Colors

The palette balances deep intellectual indigo with crisp functional neutrals and vibrant pedagogical feedback tones:

- **Primary Canvas & Surfaces**:
  - Background: `#F4F6F9` (cool, low-saturation neutral canvas).
  - Card Surface: `#FFFFFF` (elevated crisp card container).
  - Surface Glass: `rgba(255, 255, 255, 0.85)` with a `16px` backdrop blur for floating headers and sticky bottom navigations.

- **Brand Accents**:
  - Primary (`#4F46E5`): Used for primary action buttons, selected days/tabs, and core progress metrics.
  - Primary Hover / Pressed (`#4338CA`): Deeper indigo for interactive active states and high-contrast text accents.
  - Soft Brand Tint (`#EEF2FF`): Subtle lavender container background for badges, inactive calendar tags, and secondary containers.

- **Status & Pedagogical Accents**:
  - Emerald Green (`#10B981` / surface `#ECFDF5`): Attendance success (`Davomat`), completed lessons, and positive achievements.
  - Amber Gold (`#F59E0B` / surface `#FEF3C7`): Reminders, warning notices, rating stars (`Reyting`), and streak tracking.
  - Coral Rose (`#EF4444` / surface `#FEF2F2`): Absences, missed assignments, and deadline warnings.

- **Text & Borders**:
  - Text Primary: `#0F172A` (deep slate for titles and active figures).
  - Text Secondary: `#64748B` (slate for dates, subtitles, inactive days).
  - Subtle Border: `#E2E8F0` for fine divider lines, input frames, and quiet card edges.

## Typography

`Plus Jakarta Sans` is chosen for its geometric foundation, open counters, and high vertical proportion, providing effortless legibility on high-density mobile screens. 

### Typographic Hierarchy & Uzbek Language Notes
- **Diacritic Treatment**: The Latin script for Uzbek utilizes apostrophes and modifier letters (`O‘zbekiston`, `Toshkent`, `to‘garak`). The line-height ratios are generously padded to prevent vertical clipping of ascending marks.
- **Greeting & Hero Headers**: User salutations (`Salom, Javohir! 👋`) use `headline-lg-mobile` in 700 weight for immediate warmth and presence upon app entry.
- **Class Titles & Schedule**: `headline-md` provides strong optical grounding inside schedule cards, while body and metadata items (`18:00–20:00`, `Mentor: Javohir`) rely on `body-sm` and `label-md` for distinct contrast.

## Layout & Spacing

The layout model is anchored to a mobile-first fluid grid optimized for one-handed ergonomic thumb reach:

- **Mobile Canvas**: A single-column vertical flow bounded by a `1rem` (16px) margin. Touch boundaries adhere to minimum 44px tap targets for iOS/Android compliance.
- **Component Padding Rhythm**:
  - Cards leverage `space-lg` (20px) inner padding for airy separation.
  - Interactive pill chips (such as day-of-week toggles: `Du`, `Se`, `Cho`, `Pay`, `Ju`, `Sha`, `Ya`) maintain `space-sm` gaps to form a clean horizontal strip.
- **Vertical Rhythm**: Section titles, schedule banners, warning alert boxes, and attendance heatmaps are spaced with consistent `space-md` (16px) vertical margins, avoiding visual clutter while preserving modular card groupings.

## Elevation & Depth

Visual hierarchy uses layered ambient diffusion and subtle glassmorphic tiers rather than stark, heavy drop shadows:

- **Canvas Base (Level 0)**: Flat `#F4F6F9` background.
- **Standard Cards (Level 1)**: Pure white background with a soft ambient shadow: `box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)`. Fine outline of `1px solid rgba(226, 232, 240, 0.6)`.
- **Hero Lesson Card (Special Elevated)**: Multi-layered background with a soft gradient glow (`linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(255, 255, 255, 1) 50%, rgba(250, 245, 255, 0.8) 100%)`) accompanied by an indigo-tinted shadow: `box-shadow: 0 10px 25px -4px rgba(79, 70, 229, 0.08), 0 4px 10px -2px rgba(79, 70, 229, 0.04)`.
- **Top Bar & Bottom Navigation Dock (Level 2 Floating)**: Translucent white surface (`rgba(255, 255, 255, 0.88)`) with `backdrop-filter: blur(20px)` and an ambient upward shadow `0 -4px 20px rgba(15, 23, 42, 0.05)`.

## Shapes

The design uses balanced, modern curves (`roundedness: 2` with standard radii of 16px–24px) to create an inviting, student-friendly touch interface:

- **Main Content Cards**: `rounded-xl` (24px) for outer lesson cards, student alert blocks, and calendar modules.
- **Floating Controls & Search / Selectors**: Pill-shaped (`9999px` / `rounded-full`) for context switchers (e.g., `Backend Node.js 14-guruh`) and floating actions.
- **Weekly Schedule Chips**: Squircular or full-pill (`12px` to `9999px`) to maintain equal touch area across day abbreviations.
- **Avatar Elements & Attendance Markers**: Perfect circles (`rounded-full`) for attendance matrix dots and mentor circular portraits.

## Components

### Buttons & Interactive Pills
- **Primary CTA**: Background `#4F46E5`, foreground `#FFFFFF`, `height: 48px`, font weight 600, border radius `16px` or full pill. Active state deepens to `#4338CA`.
- **Day Selector Pills**: Inactive state is transparent with `#64748B` typography; active/selected state uses an indigo background (`#4F46E5`), crisp `#FFFFFF` text, and subtle elevation.

### Metric & Status Chips (`Stats Badges`)
- White background card with a hairline border (`#E2E8F0`), housing an emoji or SVG icon alongside a metric label (e.g., `#3 o'rin (450 Like)`, `92% Davomat`). Uses `label-md` with `12px` padding and rounded-full boundary.

### Cards & Lesson Banners
- **Active Lesson Banner (`Bugungi Dars`)**: Features an ambient top-gradient wash, active status indicator dot (pulsing indigo/violet dot), schedule time-stamp in bold monospace/sans-serif numerals, prominent course title, and mentor badge with avatar chip.
- **Notification & Warning Callouts**: Soft warning surface (`#FEF3C7` / `#FFFBEB`) with amber icon (`#F59E0B`), hairline amber border, and `body-sm` text for announcements and makeup sessions (`Qo‘shimcha dars`).

### Attendance Matrix (`Davomat Jadvali`)
- 7-column calendar grid matching the weekdays (`Du` through `Ya`).
- Status dots (`8px`–`10px` diameter) colored systematically:
  - Present: Emerald Green (`#10B981`)
  - Excused/Partial/Warning: Amber (`#F59E0B`)
  - Absent: Rose (`#EF4444`)
  - Scheduled/Future: Slate Neutral (`#E2E8F0`)

### Bottom Navigation Bar
- Docked or floating pill dock with frosted blur (`backdrop-filter: blur(20px)`).
- 4 primary tabs: **Home** (`Bosh sahifa`), **Reyting** (`Reyting`), **Do'kon** (`Do‘kon` / Coin Store), **Profil** (`Profil`).
- Active item uses primary indigo tint `#4F46E5` with an icon scale bounce; inactive icons remain muted slate `#94A3B8`.