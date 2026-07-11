# Aham Design System

A design system for **Aham** -- a developer tool built with the temperament of a Claude desktop application. The system is purpose-built for building restrained, content-first interfaces across web, macOS app, Office document, and email surfaces.

The design philosophy can be summed up in four words: **极简、克制、留白优先、内容优先** -- minimal, restrained, white-space first, content first. Every decision flows from the principle that the default answer is *don't add*. Blue is a garnish, never a fill. Hierarchy comes from whitespace, not shadow. The surface is flat at rest.

## CONTENT FUNDAMENTALS

### Voice and tone

Aham speaks in short, functional, neutral Chinese. There is no marketing exuberance, no excitement punctuation, no emoji in product UI. The voice is that of a precise tool: it tells you what will happen and asks for confirmation when the cost is high. Button labels are single verbs or verb-object pairs. Dialog titles state the action plainly. Help text is one line, never a paragraph. The mood is not cold -- it is *quiet*. Like a well-made instrument, Aham communicates through clarity rather than decoration.

Given the developer-tool context, English UI copy appears in code-facing surfaces (terminal output, log lines, CLI flags) while Chinese governs the graphical interface. Mixed-language interfaces are acceptable only when a term has no natural Chinese equivalent in the developer lexicon (e.g., "API Key", "Webhook URL").

### When generating copy

- Labels are action verbs: use the shortest form that is unambiguous
- Dialog confirmations state the consequence, not the question -- "删除此项目" not "确定要删除吗？"
- Empty states explain what belongs there and provide a single next action
- Never use exclamation marks, catchphrases, or personality copy in product UI
- Status is reported with a 6px dot and a noun phrase, never a pill or colored block

## VISUAL FOUNDATIONS

### Color

The system operates on a deliberately narrow palette rooted in cool paper and restrained metal. The light-theme surface stack is a three-tier progression from bright to muted: `#FFFFFF` (app background, card surface), `#F3F3F3` (panel, hover fill, subtle distinction), `#E7E7E7` (borders, the structural line). This third tier is the workhorse -- it draws every border, marks every selected row, and anchors the flat aesthetic without ever calling attention to itself.

The ink scale runs from `#262626` (primary text, the darkest reading surface) through `#6E6E6E` (secondary, labels, metadata) to `#9B9B9B` (tertiary, placeholders, disabled hints) with a quaternary `#C4C4C4` reserved for the faintest decorative use only.

The accent is a single cool blue, `#336EE8`. It appears in exactly four places: the logo mark, the primary button, the send/confirm action, and the focus ring. On hover it lightens to `#5C8BED`; on press it deepens to `#164EC3`. There is a companion tint family (`#C8D3EA` as a border tint, `#EDF0F7` as a surface tint) for subtle accent-backed areas, but these are secondary and never dominate a view. There is no accent scale beyond these stops -- blue does not graduate. It is a point, not a spectrum.

Semantic colors are deliberately desaturated to sit within the cool, restrained palette rather than screaming for attention. Success is a muted sage `#5A7A60` on a barely-there tint background. Warning is a subdued ochre `#8A7333`. Danger is a dusty red `#9E3D31`. None of these colors appears as a solid fill on a large surface -- they tint, they don't flood.

The dark theme (`[data-theme="dark"]`) inverts the surface stack to `#1C1C1C` / `#2A2A2A` / `#3A3A3A`, lifts the accent to `#5C8BED` to maintain visibility against dark backgrounds, and adjusts the semantic colors to `#8FB096` (success), `#C2A855` (warning), and `#D08070` (danger). Overlay darkens to `rgba(0,0,0,0.45)`. Fill hover/active become lighter-on-dark: `rgba(255,255,255,.06)` and `rgba(255,255,255,.10)`.

### Typography

The system uses exactly three font families:

- **Inter** / **Inter Display** -- the primary workhorse for body text, labels, captions, and all interface copy. The two optical variants share a single `--font-sans` stack: `'Inter', 'Inter Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`. Inter Display is optically tuned for sizes at and above 20px, giving Aham its crisp, architectural headline character. Weights at 400 (regular), 500 (medium), and 600 (semibold).
- **JetBrains Mono** -- the monospace face for code, numeric data, tables, and any surface where alignment and scanability matter. Weights at 400 and 500. The stack falls back through `SF Mono, Menlo, monospace`. Tabular numbers are always rendered with this face.

The type scale is compact by modern web standards, expressed through 11 utility classes:

| Style | Size / Line-height | Weight | Face |
|---|---|---|---|
| text-display | 44px / 1.15 | 600 | Inter Display |
| text-title | 32px / 1.2 | 600 | Inter Display |
| text-heading | 24px / 1.25 | 600 | Inter Display |
| text-subheading | 20px / 1.3 | 600 | Inter Display |
| text-body-l | 17px / 1.5 | 400 | Inter |
| text-body | 14px / 1.55 | 400 | Inter (the workhorse · UI base) |
| text-callout | 15px / 1.45 | 400 | Inter |
| text-subhead | 13px / 1.4 | 500 | Inter |
| text-footnote | 13px / 1.45 | 400 | Inter |
| text-caption | 12px / 1.4 | 400 | Inter |
| text-mono | inherits size | 400 | JetBrains Mono |

Line-heights follow a deliberate curve: display and headline lines are tight (1.25--1.3) to preserve the architectural presence of large text; body lines relax to 1.5 for comfortable reading; caption and footnote settle at 1.4. There is no letter-spacing manipulation beyond specific uppercase labels (`text-label` uses `0.01em` letter-spacing) -- the typeface itself carries the rhythm.

### Spacing

The spacing scale is 4-based: **0, 4, 8, 12, 16, 24, 32, 48, 64, 96** (`--space-0` through `--space-9`). Whitespace is the primary separator — reach for a bigger gap before a border. The most-used stops are 8px (interior gap, icon-to-label), 12/16px (control and section padding), and 24px (section rhythm). Values come only from the scale, never ad-hoc pixels.

Control dimensions are fixed and deliberate: input fields are 36px tall (via `--layout-control-height` in component CSS), buttons are 32px tall (`--layout-btn-height`). These heights are not adjustable per instance.

### Radius

Aham applies radius sparingly and deliberately. There are seven stop values:

- **4px** (`--radius-xs`) -- tightest inner corners
- **6px** (`--radius-sm`) -- small controls
- **8px** (`--radius-md`) -- buttons and inputs; the default "everything" radius
- **12px** (`--radius-lg`) -- cards, dialog panels
- **16px** (`--radius-xl`) -- larger panels where visual softness is warranted
- **20px** (`--radius-2xl`) -- oversized surfaces
- **999px** (`--radius-pill`) -- pill shape for status chips and toggle / segmented tracks only; never for buttons or inputs

The concentric-radius rule applies: child radius equals parent radius minus the spacing gap. This keeps nested surfaces visually coherent without designers having to calculate values by hand.

### Shadow / Elevation

Aham is flat at rest. There is no resting shadow on cards, panels, buttons, or inputs. Shadows exist only to express transient elevation:

1. **Dropdown** (`0 2px 8px rgba(20,20,20,0.05)`) -- menus, selects, autocomplete popovers. Whisper-quiet. Exists only to separate from the page, not to announce itself.
2. **Popover** (`0 3px 12px rgba(20,20,20,0.06)`) -- tooltips, hover cards, non-modal overlays. Slightly more presence than a dropdown but still subordinate.
3. **Modal** (`0 12px 36px rgba(20,20,20,0.10)`) -- the single elevation that draws real attention. Reserved for dialogs, alerts, and any overlay that blocks interaction with the page behind it. Even at its maximum, the shadow is gray and diffuse, never black or harsh.

The focus ring (`0 0 0 3px rgba(51,110,232,0.20)`) is technically a shadow but lives in its own category: it is the only place where the accent blue bleeds into the shadow system, and it is the only "shadow" that appears at rest (when an element is focused).

### Borders

Borders in Aham are uniformly `1px solid` using the border color (`#E7E7E7` for light theme, via `--ui-border`). There is a lighter variant `--ui-border-light` (`#F0F0F2`) for subtle dividers. Borders separate interactive surfaces (input fields, table cells, sidebar edges) but never decorate. No double borders, no colored borders (the focus ring handles that), no gradient borders.

### Animation

Motion is restrained and functional. The standard easing curve is `cubic-bezier(.2,0,0,1)` -- a gentle deceleration with no bounce. Duration is kept tight: 120ms for micro-interactions (border color change on focus), 150ms for standard transitions (hover states, selection feedback), 280ms for entry/exit of larger surfaces. Nothing animates for longer than 280ms. Nothing bounces.

### Iconography

The concrete icon set is **Lucide (ISC)** — linear, monochrome, round cap+join, on a 24 grid. Sizes are 16 / 20 / 24 (`--icon-sm/md/lg`); native stroke is 2px at the 24 grid, so effective stroke scales down with size (16px ≈ 1.3). Icons use `currentColor` and inherit the ink token — never colored, never filled with accent blue, never emoji, never the sole carrier of meaning without an accessible name. Status icons are always paired with text. They are referenced from a sprite: `<svg class="icon"><use href="icons/aham-icons.svg#i-search"/></svg>`. 51 starter semantic icons ship in `icons/`; the semantic name (`i-success`) is stable while the underlying Lucide name lives in `icons/icons.json`. Per-track sources: web / Office / email use Lucide; the macOS app track uses SF Symbols by name (not yet landed). See `components/icon.json` and `preview/component-icon.html`.

## COMPONENT PATTERNS

| Component | Preview | Contract | Key Facts | Key Insight |
|---|---|---|---|---|
| Button | `preview/component-button.html` | `components/button.json` | 4 variants (primary/secondary/ghost/danger), 3 sizes (sm 28px / md 32px / lg 40px), 4 states. Radius md (8px). | One primary per view. Ghost is the default secondary action -- no outline variant exists. |
| Input | `preview/component-input.html` | `components/input.json` | 4 types (text/textarea/select/search), 5 states. Height 36px, border 1px --ui-border, radius md (8px). Focus ring 3px accent at 20% opacity. | Always outlined (never filled/contained). Label above, error below. Placeholder uses ink-tertiary -- it is a hint, not a label. |
| Card | `preview/component-card.html` | `components/card.json` | Anatomy: header + body + footer. Width 280px, radius lg (12px). 3 types (default/interactive/selected). | The defining Aham card pattern: no border, no shadow, flat white. Selected state is flat gray, never blue. |
| Dialog | `preview/component-dialog.html` | `components/dialog.json` | 3 types (confirm/form/alert), 3 widths (380px / 480px / 640px). Overlay rgba(20,20,20,0.28). Cancel left, confirm right. Return binds to confirm. | The button-order rule is strict and non-negotiable: cancel leads, confirm trails. Destructive buttons never get blue or Return binding. |
| Table | `preview/component-table.html` | `components/table.json` | Horizontal rules only, no vertical lines, no zebra stripes. Headers: 13px/500, ink-secondary. Data: 14px/400, ink-primary. Numeric right-aligned, mono. 3 densities (44px/36px/28px). | Status is always a 6px dot + text. Never a pill, never a colored block, never a stoplight pattern. |
| Navigation | `preview/component-nav.html` | `components/nav.json` | 3 patterns: sidebar (264px), rail (60px), tabs. Active = flat gray, not blue. Tab underline = 2px accent blue (the one blue exception in nav). | Sidebar active state is monochrome gray -- the blue accent appears only in the tab underline. Navigation is infrastructure, not decoration. |
| Checkbox | `preview/component-checkbox.html` | `components/checkbox.json` | 4 states (unchecked, checked, mixed, disabled). 16px box, 1.5px border. Compact form selection. Checked = ink-primary fill with white checkmark. Mixed = ink-primary minus line. | The checked fill uses ink-primary, never blue. This is the defining restraint: even selected state stays monochrome. |
| Radio Button | `preview/component-radio-button.html` | `components/radio-button.json` | 3 states (unselected, selected, disabled). 16px outer ring, 6px inner dot. Circular selection indicator. Selected = ink-primary dot. | The selected indicator is a solid ink-primary dot, never blue. The outer ring stays border-color even when selected. |
| Toggle | `preview/component-toggle.html` | `components/toggle.json` | 4 states (off, on, disabled-off, disabled-on). Pill shape, 40x22px (md) / 32x18px (sm). ON = blue track, white knob. | This is the only component where blue appears as a solid fill. The ON state uses accent-blue track -- an intentional exception to the no-blue-fill rule. |
| Segmented Control | `preview/component-segmented-control.html` | `components/segmented-control.json` | 3 variants (2/3/4 segments). Container = panel gray (#F3F3F3), 32px height, 2px gap. Selected = white card with subtle shadow. Radius 8px. | The selected segment is a white card floating above the gray container, not a blue highlight. This is the concentric-radius rule in action: container 8px, selected segment 6px. |
| Progress Indicator | `preview/component-progress-indicator.html` | `components/progress-indicator.json` | 4 variants (linear/circular x determinate/indeterminate). Linear track 4px tall, circular track 3px stroke. Fill = accent blue. | The fill is always accent blue on tier3-gray track. Indeterminate uses CSS-only animation. Circular size: 20px (sm) or 32px (md). |
| Slider | `preview/component-slider.html` | `components/slider.json` | 3 states (default, active, disabled). 4px track, blue fill before knob, 16px flat circular knob with 1.5px border. | The slider fills the track behind the knob with accent blue -- one of the few components where blue fills a continuous area. Flat knob, no shadow. |
| Search Field | `preview/component-search-field.html` | `components/search-field.json` | 4 states (default, focused, value, disabled), 2 sizes (md 36px / sm 28px). Magnifier icon at left, clear button at right on value. | The search icon is ink-tertiary, never accent blue. Clear button appears only when value is present. Focus ring uses the standard 3px accent blue ring. |
| Tooltip | `preview/component-tooltip.html` | `components/tooltip.json` | 4 positions (top, bottom, left, right). Ink-primary background (#262626), white text, 6px radius. 4px arrow. Hover trigger, 200ms fade. | The only component with a fully filled dark background. The tooltip is ink-primary filled with white text -- the inverse of the normal surface relationship. |
| Popover | `preview/component-popover.html` | `components/popover.json` | 2 variants (bottom, top). White panel, 12px radius, popover shadow only. 8px padding. Min-width 200px, max-width 360px. Non-modal. | Unlike tooltips, popovers use the popover shadow level (0 3px 12px) and are explicitly non-modal. They close on outside click or Esc. |
| Menu | `preview/component-menu.html` | `components/menu.json` | 2 variants (dropdown, context). Dropdown: top 8px / bottom 12px radius. Context: all 12px radius. 28px items, 4px vertical padding. Hover = rgba(20,20,20,0.04) fill. Danger item turns red on hover. | Menu items are exactly 28px tall -- the only 28px control in the system. Keyboard shortcut labels use 11px mono. Separator is 1px ui-border with 4px horizontal margin. |
| Icon | `preview/component-icon.html` | `components/icon.json` | Lucide (ISC), linear monochrome, 24 grid. Sizes 16/20/24 (`--icon-sm/md/lg`). `currentColor` inherits ink. 51 starter semantic icons + sprite in `icons/`. | Never colored, never accent-blue-filled, never emoji, never the sole carrier of meaning. Status icons pair with text. Sprite: `<use href="icons/aham-icons.svg#i-search">`. Track sources: web/Office/email = Lucide, macOS = SF Symbols (deferred). |

## INDEX

- `README.md` -- this file, the comprehensive brand narrative
- `tokens.json` -- **single source of truth** for all token values (light + dark, text styles, layout, sizes, icon); everything else derives from it
- `DESIGN.md` -- the full eight-layer specification (principles → foundations → components → composition → patterns → media → inputs → support → page layout)
- `colors_and_type.css` -- drop-in runtime CSS custom properties, generated from tokens.json
- `components.css` -- aggregated component CSS (includes `.icon`)
- `css.json` -- structured JSON token representation for programmatic consumption
- `components/` -- component contracts (`{slug}.json`): anatomy, variant dimensions, patterns, usage hints, exclusions (17 = 16 core + icon)
- `preview/` -- self-contained HTML preview cards (17: button, card, checkbox, dialog, input, menu, nav, popover, progress-indicator, radio-button, search-field, segmented-control, slider, table, toggle, tooltip, icon)
- `icons/` -- Lucide (ISC) sprite `aham-icons.svg`, manifest `icons.json`, raw sources `lucide/`, ISC `LICENSE`
- `aham-ui.css` / `aham-ui.js` -- fuller reference implementation + behavior
- `aham-ui-office.md` -- Office (Word / Excel / PPT) landing: HEX + font mapping
- `ui_kits/dashboard/` -- a worked dashboard assembled from the components
- `AGENTS.md` / `SKILL.md` / `library-consumption.json` -- AI consumption entry points + reading order

## CAVEATS / KNOWN SUBSTITUTIONS

1. **Microsoft YaHei / SimHei** are the CJK fallback faces in the `font-family` stack for Inter and Inter Display. These are system fonts on Windows; on macOS the stack falls through to the system-ui CJK face (PingFang SC). On Linux, the stack degrades to the system sans-serif default for CJK. The CJK rendering will differ from the Latin rendering in weight and x-height -- this is a known limitation of cross-platform web typography and not a design decision.
2. **JetBrains Mono** requires a Google Fonts CDN import. In fully offline environments, the monospace stack falls back to `SF Mono, Menlo, monospace`. Tabular number alignment is preserved by the browser's monospace fallback, but the character design will differ visibly from JetBrains Mono.
3. **No brand copy examples from source material** -- the content fundamentals section derives its voice and tone guidance from the stated design philosophy (极简、克制、留白优先、内容优先) and observed component label patterns, not from a brand copy deck or UI string audit. Specific copy examples should be validated against the product's actual UI strings when available.
4. **Component variants** listed in component contracts represent the known, specified set. Additional states (loading spinners within buttons, password visibility toggles, character counts on inputs) are marked as `unknowns` in their respective contracts. These should not be invented without explicit design approval.
5. **Dark theme** color values are algorithmic inversions of the light theme, validated against the design system specification. They have not been tested against the full component set in a dark-mode rendering pass. Subtle contrast adjustments may be needed for tertiary ink on dark panel backgrounds.
6. **Single source of truth is `tokens.json`.** `colors_and_type.css`, `css.json`, and `components.css` are generated mirrors for runtime and programmatic use. If a value ever disagrees, `tokens.json` wins — regenerate the mirrors from it, not the other way around.
7. **Inter Display** is loaded as a separate font file from Google Fonts with optical sizing. Browsers that do not support the `opsz` axis will render Inter Display at its default optical size, which may appear slightly heavier than intended at small sizes or slightly lighter at display sizes.
