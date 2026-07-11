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
- `colors_and_type.css` — drop-in runtime CSS variables; link it, do not read it to understand tokens when css.json exists
- resolved component sources — use `preview/component-{slug}.html` first, `components/{slug}.json` for intent/variants
- `preview/` — small HTML cards illustrating the foundations and components
- `library-consumption.json` — recommended downstream read order

## Essentials at a glance

- Brand primary `#336EE8`. Cool, technical, restrained — no warm accents, no default gradients. Only for logo / primary actions / send / selection accent.
- Radius at **4 / 6 / 8 / 12** (xs / sm / md / lg) — deliberate, never softer. Pill (`999px`) only for status chips and badges.
- Density first: **36px** control height, **32px** button height, **4px** base spacing unit. Table rows at 36px, sidebar at 264px width.
- Type: **Inter** for body and small text; **Inter Display** for headings >=20px; **JetBrains Mono** for code and numeric data. Fallback: Microsoft YaHei for Chinese contexts, then system-ui.
- Shadow: **flat at rest** — no shadow on cards, containers, or inputs. Shadow only on floating overlays: dropdown (`0 2px 8px rgba(20,20,20,0.05)`), popover (`0 3px 12px rgba(20,20,20,0.06)`), modal (`0 12px 36px rgba(20,20,20,0.10)`).
- Voice: bilingual (CN-first), professional, neutral. No emoji in product UI. Status communicated through 6px dot + text, never color alone.
- Selection is **flat gray** (`#E7E7E7`), never blue. One primary action per group. Cards have no border, no shadow at rest.
- States use **6px dot + label text** — never pill badges, colored icons, or traffic-light indicators for status. Disabled opacity at 0.4.
