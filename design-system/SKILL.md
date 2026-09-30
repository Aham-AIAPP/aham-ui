---
name: aham-design
description: Use this skill to generate well-branded interfaces and assets for Aham — a developer-tool dashboard design system. Contains essential design guidelines, colors, type, fonts, and UI kit components for prototyping dashboard UIs.
user-invocable: true
---

# Aham Design Skill

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out
and create static HTML files for the user to view. If working on production code, you can
copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build
or design, ask some questions, and act as an expert designer who outputs HTML artifacts
_or_ production code, depending on the need.

## Quick map

- `README.md` — brand context, content fundamentals, visual foundations (read first)
- `css.json` — structured token understanding source
- `colors_and_type.css` — compatibility runtime for the component previews only; product pages use `aham-ui.css` (base) or `workbench.css` (workbench). Reading order: `library-consumption.json`
- resolved component sources — use `components/{slug}.json` first for intent, variants and do-not-invent rules; `preview/component-{slug}.html` is the visual reference
- `preview/` — small HTML cards illustrating the foundations and components
- `library-consumption.json` — recommended downstream read order

## Essentials at a glance

- Brand primary `#336EE8`. Cool, technical, restrained — no warm accents, no default gradients. Only for logo / primary action / send / focus ring / current-tab underline / text links. The primary button fill uses the deeper `#164EC3` (white text 7.21:1). Selection is flat gray, never blue.
- Radius at **4 / 6 / 8 / 12** (xs / sm / md / lg) — deliberate, never softer. Pill (`999px`) only for neutral filter chips and toggle tracks; never for status.
- Density first: **36px** control height, **32px** button height, **4px** base spacing unit. Table rows at 36px, sidebar at 264px width.
- Type: **Inter** for body and small text; **Inter Display** for headings >=20px; **JetBrains Mono** for code and numeric data. Fallback: Microsoft YaHei for Chinese contexts, then system-ui.
- Shadow: **flat at rest** — no shadow on cards, containers, or inputs. Shadow only on floating overlays: dropdown (`0 2px 8px rgba(20,20,20,0.05)`), popover (`0 3px 12px rgba(20,20,20,0.06)`), modal (`0 12px 36px rgba(20,20,20,0.10)`).
- Voice: bilingual (CN-first), professional, neutral. No emoji in product UI. Status communicated through 6px dot + text, never color alone.
- Selection is **flat gray** (`#E7E7E7`), never blue. One primary action per group. Cards have no border, no shadow at rest.
- States use **6px dot + label text** — a status icon may be added only together with the label; never pill badges or traffic-light indicators for status. Disabled opacity at 0.4.

## Web workbench (7.2)
For ToB admin UIs (lists, record detail, documents, settings) use WORKBENCH.md with workbench.css and workbench.js; content websites keep the centred layout. Aham supplies colours, type, radius and status syntax; layout and interaction follow Circle / Linear.
- Shell: 52px icon rail / 240px nav on the panel tier, white content card, one or two 40px header rows with 28px controls, side panels at 240px or 400px.
- Lists (§9–10): 36px rows, sticky header and group rows, outline 筛选 button → command menu with quick search → four-part chips under the header (state in the URL), display options with property chips, bulk bar replacing header row 2, pager.
- Detail (§11): ↑↓ current row, Space preview, Enter open, x select; one header row with position and prev/next, 720px centred main, 240px label + value properties, activity feed with a ⌘/Ctrl+Enter composer.
- Quick actions (§12): ⌘K palette with record context and in-place sub-lists; one shortcut registry limited to components/shortcuts.json; context menu without cascading submenus; cell pickers with toast undo; quick-create dialog with 继续新建.
- Settings (§13): grouped settings nav, 720px centred content, line-separated rows that apply immediately.
Read order: WORKBENCH.md → tokens.json (workbench) → components/*.json → workbench.css / workbench.js → preview/workbench-*.html → examples/*.html.
