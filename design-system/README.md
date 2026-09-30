# Aham Design System

A design system for **Aham** -- a family of AI tools and ToB business interfaces built with the temperament of a Claude desktop application. The system is purpose-built for building restrained, content-first interfaces across web (content pages and the business workbench), macOS app, Office document, and email surfaces.

The design philosophy can be summed up in four words: **极简、克制、留白优先、内容优先** -- minimal, restrained, white-space first, content first. Every decision flows from the principle that the default answer is *don't add*. Blue is a garnish, never a fill. Hierarchy comes from whitespace, not shadow. The surface is flat at rest.

## CONTENT FUNDAMENTALS

### Voice and tone

Aham speaks in short, functional, neutral Chinese. There is no marketing exuberance, no excitement punctuation, no emoji in product UI. The voice is that of a precise tool: it tells you what will happen and asks for confirmation when the cost is high. Button labels are single verbs or verb-object pairs. Dialog titles state the action plainly. Help text is one line, never a paragraph. The mood is not cold -- it is *quiet*. Like a well-made instrument, Aham communicates through clarity rather than decoration.

Where a product has code-facing surfaces, English UI copy appears there (terminal output, log lines, CLI flags) while Chinese governs the graphical interface. Mixed-language interfaces are acceptable only when a term has no natural Chinese equivalent in the developer lexicon (e.g., "API Key", "Webhook URL").

### When generating copy

- Labels are action verbs: use the shortest form that is unambiguous
- Dialog confirmations name the action in the title and state the consequence in the body, never as a question -- title "删除 3 条记录", body "删除后无法恢复"; not "确定要删除吗？" (DESIGN §1.9)
- Empty states explain what belongs there and provide a single next action
- Never use exclamation marks, catchphrases, or personality copy in product UI
- Status is reported with a 6px dot and a noun phrase, never a pill or colored block

## VISUAL FOUNDATIONS

### Color

The system operates on a deliberately narrow palette rooted in cool paper and restrained metal. The light-theme surface stack is a three-tier progression from bright to muted: `#FFFFFF` (app background, card surface), `#F3F3F3` (panel, hover fill, subtle distinction), `#E7E7E7` (borders, the structural line). This third tier is the workhorse -- it draws every border, marks every selected row, and anchors the flat aesthetic without ever calling attention to itself.

The ink scale runs from `#262626` (primary text, the darkest reading surface) through `#6E6E6E` (secondary, labels, metadata) to `#9B9B9B` (tertiary, placeholders, disabled hints) with a quaternary `#C4C4C4` reserved for the faintest decorative use only.

The accent is a single cool blue, `#336EE8`. It appears only on the logo mark, the primary action, the send/confirm action, the focus ring, the current-tab underline and text links. Selection is flat gray, never blue. The primary button fill uses the press stop `#164EC3` (white text 7.21:1) and lightens to `#336EE8` on hover, in light and dark themes alike. There is a companion tint family (`#C8D3EA` as a border tint, `#EDF0F7` as a surface tint) for subtle accent-backed areas, but these are secondary and never dominate a view. There is no accent scale beyond these stops -- blue does not graduate. It is a point, not a spectrum.

Semantic colors are deliberately desaturated to sit within the cool, restrained palette rather than screaming for attention. Success is a muted sage `#5A7A60` on a barely-there tint background. Warning is a subdued ochre `#8A7333`. Danger is a dusty red `#9E3D31`. None of these colors appears as a solid fill on a large surface -- they tint, they don't flood.

The dark theme (`[data-theme="dark"]`) inverts the surface stack to `#1C1C1C` / `#2A2A2A` / `#3A3A3A`, lifts the accent to `#5C8BED` to maintain visibility against dark backgrounds, and adjusts the semantic colors to `#8FB096` (success), `#C2A855` (warning), and `#D08070` (danger). Overlay darkens to `rgba(0,0,0,0.45)`. Fill hover/active become lighter-on-dark: `rgba(255,255,255,.06)` and `rgba(255,255,255,.10)`.

### Typography

The font stacks follow Linear (`--font-regular` and `--font-monospace` in the `:root` of linear.app's stylesheet, checked 2026-09-30). Two families:

- **Inter Variable** -- all text: body, labels, captions, headings. Its optical-size axis moves from text to display shapes as the size grows (CSS `font-optical-sizing: auto` is the default), so there is no separate Inter Display. `--font-sans-display` is kept as an alias of `--font-sans`. Stack: `'Inter Variable', 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'Microsoft YaHei', 'SimHei', system-ui, sans-serif`. Weights 400, 500 and 600. Linear's variable weights 510 / 590 are not used: Microsoft YaHei ships only 300 / 400 / 700, and CSS font matching turns 510 into 700 for Chinese text.
- **Berkeley Mono** -- code and numeric data. It is a commercial face from U.S. Graphics; when the product has no commercial licence, **JetBrains Mono** (SIL OFL) takes over. Stack: `'Berkeley Mono', 'JetBrains Mono', ui-monospace, 'SF Mono', 'Menlo', monospace`. Tabular numbers use this stack.

Like Linear, the sans text turns on the Inter features `cv01` (alternate one) and `ss03` (round quotes and commas): `--font-features`, token `typography.fontFeatureSettings`. Mono text resets them to `normal`. The CSS `font` shorthand resets `font-feature-settings`, so a sans rule that uses the shorthand declares `--font-features` again.

Inter Variable 4.1 ships in `fonts/` (`InterVariable.woff2`, `InterVariable-Italic.woff2`, the SIL OFL `LICENSE.txt`), taken from tag v4.1 of github.com/rsms/inter. `fonts/inter.css` declares the faces; `aham-ui.css`, `workbench.css` and `colors_and_type.css` import it, so keep `fonts/` next to them when copying the package:

```css
@font-face { font-family: 'Inter Variable'; font-style: normal; font-weight: 100 900; font-display: swap; src: url('InterVariable.woff2') format('woff2'); }
@font-face { font-family: 'Inter Variable'; font-style: italic; font-weight: 100 900; font-display: swap; src: url('InterVariable-Italic.woff2') format('woff2'); }
```

The type scale is compact by modern web standards, expressed through 11 utility classes:

| Style | Size / Line-height | Weight | Face |
|---|---|---|---|
| text-display | 44px / 1.15 | 600 | sans |
| text-title | 32px / 1.2 | 600 | sans |
| text-heading | 24px / 1.25 | 600 | sans |
| text-subheading | 20px / 1.3 | 600 | sans |
| text-body-l | 17px / 1.5 | 400 | sans |
| text-body | 14px / 1.55 | 400 | sans (the workhorse · UI base) |
| text-callout | 15px / 1.45 | 400 | sans |
| text-subhead | 13px / 1.4 | 500 | sans |
| text-footnote | 13px / 1.45 | 400 | sans |
| text-caption | 12px / 1.4 | 400 | sans |
| text-mono | inherits size | 400 | mono |

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
- **999px** (`--radius-pill`) -- pill shape for neutral filter chips and toggle / segmented tracks only; never for buttons or inputs

The concentric-radius rule applies: child radius equals parent radius minus the spacing gap. This keeps nested surfaces visually coherent without designers having to calculate values by hand.

### Shadow / Elevation

Aham is flat at rest. There is no resting shadow on cards, panels, buttons, or inputs. Shadows exist only to express transient elevation:

1. **Dropdown** (`0 2px 8px rgba(20,20,20,0.05)`) -- menus, selects, autocomplete popovers. Whisper-quiet. Exists only to separate from the page, not to announce itself.
2. **Popover** (`0 3px 12px rgba(20,20,20,0.06)`) -- tooltips, hover cards, non-modal overlays. Slightly more presence than a dropdown but still subordinate.
3. **Modal** (`0 12px 36px rgba(20,20,20,0.10)`) -- the single elevation that draws real attention. Reserved for dialogs, alerts, and any overlay that blocks interaction with the page behind it. Even at its maximum, the shadow is gray and diffuse, never black or harsh.

Keyboard focus is a 2px solid accent outline with a 2px offset (4.63:1 on white). Text inputs additionally show a soft 3px tint halo (`0 0 0 3px rgba(51,110,232,0.20)`) around their blue border; the halo alone is never the focus indicator.

### Borders

Borders in Aham are uniformly `1px solid` using the border color (`#E7E7E7` for light theme, via `--ui-border`). There is one border colour; `tokens.json` has no lighter divider variant. Borders separate interactive surfaces (input fields, table cells, sidebar edges) but never decorate. No double borders, no colored borders (the focus ring handles that), no gradient borders.

### Animation

Motion is restrained and functional. The standard easing curve is `cubic-bezier(.2,0,0,1)` -- a gentle deceleration with no bounce. Duration comes only from the three `motion.duration` tokens: 120ms (`fast`) for hover, selection, switches and caret rotation; 180ms (`base`) for panels and width changes; 280ms (`slow`) for entry/exit of larger surfaces. No transition runs longer than 280ms and nothing bounces. The only loops are loading feedback -- spinner, skeleton and the indeterminate progress bar (DESIGN §1.7).

### Iconography

The concrete icon set is **Lucide (ISC)** — linear, monochrome, round cap+join, on a 24 grid. Sizes are 16 / 20 / 24 (`--icon-sm/md/lg`); native stroke is 2px at the 24 grid, so effective stroke scales down with size (16px ≈ 1.3). Icons use `currentColor` and inherit the ink token — never colored, never filled with accent blue, never emoji, never the sole carrier of meaning without an accessible name. Status icons are always paired with text. They are referenced from a sprite: `<svg class="icon"><use href="icons/aham-icons.svg#i-search"/></svg>`. 53 semantic icons ship in `icons/`; the semantic name (`i-success`) is stable while the underlying Lucide name lives in `icons/icons.json`. Per-track sources: web / Office / email use Lucide; the macOS app track uses SF Symbols by name (not yet landed). See `components/icon.json` and `preview/component-icon.html`.

## COMPONENT PATTERNS

| Component | Preview | Contract | Key Facts | Key Insight |
|---|---|---|---|---|
| Button | `preview/component-button.html` | `components/button.json` | 4 variants (primary/secondary/ghost/danger), 3 sizes (sm 28px / md 32px / lg 40px), 4 states. Radius md (8px). Primary `#164EC3`, hover `#336EE8`. | One primary per group. Primary fill `#164EC3` with white text; secondary is white with a 1px `#E7E7E7` line; danger is red text on white. |
| Input | `preview/component-input.html` | `components/input.json` | 4 types (text/textarea/select/search), 5 states. Height 36px, border 1px --ui-border, radius md (8px). Focus ring 3px accent at 20% opacity. | Always outlined (never filled/contained). Label above, error below. Placeholder uses ink-tertiary -- it is a hint, not a label. |
| Card | `preview/component-card.html` | `components/card.json` | Anatomy: header + body + footer. Width 280px, radius lg (12px). 3 types (default/interactive/selected). | The defining Aham card pattern: no border, no shadow, flat white. Selected state is flat gray, never blue. |
| Dialog | `preview/component-dialog.html` | `components/dialog.json` | 3 types (confirm/form/alert), 3 widths (380px / 480px / 640px). Overlay rgba(20,20,20,0.28). Cancel left, confirm right. Return binds to confirm. | The button-order rule is strict and non-negotiable: cancel leads, confirm trails. Destructive buttons never get blue or Return binding. |
| Table | `preview/component-table.html` | `components/table.json` | Horizontal rules only, no vertical lines, no zebra stripes. Headers: 13px/500, ink-secondary. Data: 14px/400, ink-primary. Numeric right-aligned, mono. 3 densities (44px/36px/32px). | Status is always a 6px dot + text. Never a pill, never a colored block, never a stoplight pattern. |
| Navigation | `preview/component-nav.html` | `components/nav.json` | 3 patterns: sidebar (264px), rail (60px), tabs. Active = flat gray, not blue. Tab underline = 2px accent blue (the one blue exception in nav). | Sidebar active state is monochrome gray -- the blue accent appears only in the tab underline. Navigation is infrastructure, not decoration. |
| Checkbox | `preview/component-checkbox.html` | `components/checkbox.json` | 4 states (unchecked, checked, mixed, disabled). 16px box, 1.5px border. Compact form selection. Checked = ink-primary fill with white checkmark. Mixed = ink-primary minus line. | The checked fill uses ink-primary, never blue. This is the defining restraint: even selected state stays monochrome. |
| Radio Button | `preview/component-radio-button.html` | `components/radio-button.json` | 3 states (unselected, selected, disabled). 16px outer ring, 6px inner dot. Circular selection indicator. Selected = ink-primary dot. | The selected indicator is a solid ink-primary dot, never blue. The outer ring stays border-color even when selected. |
| Toggle | `preview/component-toggle.html` | `components/toggle.json` | 4 states (off, on, disabled-off, disabled-on). Pill shape, 40x22px (md) / 32x18px (sm). ON = ink track, white knob. | ON is ink, like the checked checkbox and radio. Blue appears only as the focus ring. |
| Segmented Control | `preview/component-segmented-control.html` | `components/segmented-control.json` | 3 variants (2/3/4 segments). Container = panel gray (#F3F3F3), 32px height, 2px gap. Selected = flat gray (`#E7E7E7`) with ink text and weight 500, no shadow. Radius 8px. | The selected segment is flat gray, not a white chip and not blue. Concentric radius: container 8px, selected segment 6px. |
| Progress Indicator | `preview/component-progress-indicator.html` | `components/progress-indicator.json` | 4 variants (linear/circular x determinate/indeterminate). Linear track 4px tall, circular track 3px stroke. Fill = ink. | The fill is ink on the tier3-gray track, as in `aham-ui.css`. The indeterminate loop is one of the three loading exceptions to the no-loop rule. Circular size: 20px (sm) or 32px (md). |
| Slider | `preview/component-slider.html` | `components/slider.json` | 3 states (default, active, disabled). 4px track, ink fill before knob, 16px flat circular knob with 1.5px border. | The fill behind the knob is ink, like the progress bar. Flat knob, no shadow. |
| Search Field | `preview/component-search-field.html` | `components/search-field.json` | 4 states (default, focused, value, disabled), 2 sizes (md 36px / sm 28px). Magnifier icon at left, clear button at right on value. | The search icon is ink-tertiary, never accent blue. Clear button appears only when value is present. On focus the border turns blue with the 3px tint halo; keyboard focus adds the 2px outline. |
| Tooltip | `preview/component-tooltip.html` | `components/tooltip.json` | 4 positions (top, bottom, left, right). Ink-primary background (#262626), white text, 6px radius. 4px arrow. Shows after 500ms hover, immediately on keyboard focus. | The only component with a fully filled dark background. The tooltip is ink-primary filled with white text -- the inverse of the normal surface relationship. |
| Popover | `preview/component-popover.html` | `components/popover.json` | 2 variants (bottom, top). White panel, 12px radius (workbench popovers use 8px plus a 1px line, WORKBENCH §10), popover shadow only. 8px padding. Min-width 200px, max-width 360px. Non-modal. | Unlike tooltips, popovers use the popover shadow level (0 3px 12px) and are explicitly non-modal. They close on outside click or Esc. |
| Menu | `preview/component-menu.html` | `components/menu.json` | 2 variants (dropdown, context). Dropdown: top 8px / bottom 12px radius. Context: all 12px radius. 28px items, 4px vertical padding. Hover = rgba(20,20,20,0.04) fill. Danger item turns red on hover. | Menu items are exactly 28px tall -- the only 28px control in the system. Keyboard shortcut labels use 11px mono. Separator is 1px ui-border with 4px horizontal margin. |
| Icon | `preview/component-icon.html` | `components/icon.json` | Lucide (ISC), linear monochrome, 24 grid. Sizes 16/20/24 (`--icon-sm/md/lg`). `currentColor` inherits ink. 53 semantic icons + sprite in `icons/`. | Never colored, never accent-blue-filled, never emoji, never the sole carrier of meaning. Status icons pair with text. Sprite: `<use href="icons/aham-icons.svg#i-search">`. Track sources: web/Office/email = Lucide, macOS = SF Symbols (deferred). |

## INDEX

- `README.md` -- this file, the comprehensive brand narrative
- `tokens.json` -- **single source of truth** for all token values (light + dark, text styles, layout, sizes, icon); everything else derives from it
- `DESIGN.md` -- the full eight-layer specification (principles → foundations → components → composition → patterns → media → inputs → support → page layout)
- `colors_and_type.css` -- compatibility CSS custom properties for the component previews; values mirror tokens.json and are checked by `scripts/lint-design.mjs`
- `components.css` -- aggregated component CSS (includes `.icon`)
- `css.json` -- compatibility JSON mirror for older tooling; values follow tokens.json but it is not a source
- `components/` -- component contracts (`{slug}.json`): anatomy, variant dimensions, patterns, usage hints, exclusions (17 = 16 core + icon)
- `preview/` -- self-contained HTML preview cards (17: button, card, checkbox, dialog, input, menu, nav, popover, progress-indicator, radio-button, search-field, segmented-control, slider, table, toggle, tooltip, icon)
- `icons/` -- Lucide (ISC) sprite `aham-icons.svg`, manifest `icons.json`, raw sources `lucide/`, ISC `LICENSE`
- `fonts/` -- Inter Variable 4.1 (`InterVariable.woff2`, `InterVariable-Italic.woff2`), `inter.css` with the `@font-face` rules, SIL OFL `LICENSE.txt`
- `aham-ui.css` / `aham-ui.js` -- fuller reference implementation + behavior
- `aham-ui-office.md` -- Office (Word / Excel / PPT) landing: HEX + font mapping
- `ui_kits/dashboard/` -- a worked dashboard assembled from the components
- `AGENTS.md` / `SKILL.md` / `library-consumption.json` -- AI consumption entry points + reading order

## CAVEATS / KNOWN SUBSTITUTIONS

1. **Microsoft YaHei / SimHei** are the CJK fallback faces at the end of the sans stack. These are system fonts on Windows; on macOS the stack falls through to the system-ui CJK face (PingFang SC). On Linux, the stack degrades to the system sans-serif default for CJK. The CJK rendering will differ from the Latin rendering in weight and x-height -- this is a known limitation of cross-platform web typography and not a design decision.
2. **Fonts are not fetched from third-party servers** (DESIGN §1.11, local-first). Inter Variable comes from `fonts/`; if that folder is not deployed with the CSS, the sans stack falls back to the system face (SF on macOS, Segoe UI on Windows). Without Berkeley Mono or JetBrains Mono, the mono stack falls back to `ui-monospace, SF Mono, Menlo, monospace`; tabular alignment is kept, the glyphs differ.
3. **No brand copy examples from source material** -- the content fundamentals section derives its voice and tone guidance from the stated design philosophy (极简、克制、留白优先、内容优先) and observed component label patterns, not from a brand copy deck or UI string audit. Specific copy examples should be validated against the product's actual UI strings when available.
4. **Component variants** listed in component contracts represent the known, specified set. Additional states (loading spinners within buttons, password visibility toggles, character counts on inputs) are marked as `unknowns` in their respective contracts. These should not be invented without explicit design approval.
5. **Dark theme** values are chosen separately in `tokens.json` (`color.dark`), not inverted from the light theme (DESIGN §1.2). `scripts/lint-design.mjs` checks the common text and control pairs against WCAG minimums. They have not been checked on real devices or against the full component set in a dark-mode rendering pass (DESIGN, honest statement 2).
6. **Single source of truth is `tokens.json`.** `components.css` is generated from the previews by `scripts/extract-components-css.mjs`; `colors_and_type.css` is hand-synced and checked by `scripts/lint-design.mjs`; `css.json` is a compatibility mirror. If a value ever disagrees, `tokens.json` wins — regenerate the mirrors from it, not the other way around.
7. **Berkeley Mono licence.** U.S. Graphics restricts commercial use to UI elements and says its commercial licences are not compatible with open-source apps. This repository therefore ships no Berkeley Mono files; its previews render JetBrains Mono or the system mono.

## Workbench profile (7.2)
See [WORKBENCH.md](WORKBENCH.md). Component states: [filter](preview/workbench-filter.html), [detail](preview/workbench-detail.html), [actions](preview/workbench-actions.html), [AI](preview/workbench-ai.html). Page samples: [shell](examples/workbench-shell.html), [list](examples/customer-list.html), [record detail](examples/record-detail.html), [document](examples/crm-quotation.html), [settings](examples/settings.html). The 17 primitive previews remain; the workbench adds 23 composition contracts in `components/`. `tokens.json` is authoritative; `workbench-tokens.css` is generated from it. Load `workbench.css` and import behaviour from `workbench.js` (zero dependencies). Legacy `css.json` is a compatibility mirror, not a canonical input.
