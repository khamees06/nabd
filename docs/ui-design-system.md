# UI design system: the V6.2 public landing

The visual language of the public landing (public header, landing view, public footer, landing dialog), taken
from the owner's prototype V6.2. The signed-in application keeps its own legacy styles; this system applies only
inside an element with the class `nabd-landing`.

## Tokens

Defined on `.nabd-landing` in `wwwroot/css/landing-v6.css` (generated; values are the prototype's, later
refinement blocks override earlier ones, the table shows the value in effect).

| Group | Token | Value | Use |
|---|---|---|---|
| Navy | `--navy` / `--navy-2` / `--navy-3` | `#082f3d` / `#0b3a49` / `#123f4e` | Header, hero, dark sections, headings |
| Copper | `--copper` / `--copper-light` / `--copper-dark` | `#c98768` / `#e5ad8e` / `#a96d51` | Accents, rules, icons on dark |
| Action | `--copper-action` / `--copper-action-hover` | `#9b6247` / `#89543d` | Primary buttons (the prototype's darker copper for white text) |
| Text | `--ink` / `--copy` / `--muted` / `--text-muted` | `#102f40` / `#536875` / `#788b95` / `#647680` | Body text, secondary text |
| Surface | `--paper` / `--surface` / `--surface-soft` / `--surface-warm` | `#f3f6f7` / `#fff` / `#f3f7f7` / `#faf7f5` | Page and card backgrounds |
| Lines | `--line` / `--line-strong` / `--card-border` | `#d9e1e5` / `#cbd7dc` / `#dce6e9` | Borders |
| Teal | `--teal` / `--teal-soft` | `#176a72` / `#e8f0f1` | Secondary accents |
| Shape | `--radius` / `--radius-card` | `12px` / `12px` | Cards (buttons use 7 px) |
| Shadow | `--shadow-card` / `--shadow-card-hover` | `0 8px 24px rgba(8,47,61,.065)` / `0 16px 34px rgba(8,47,61,.12)` | Cards |
| Layout | `--content` | `1320px` | Width of `.nl-container` (minus a gutter) |
| Rhythm | `--v6-section-space` | `clamp(76px, 8vw, 112px)` | Vertical space between sections |
| Font | `--font-ar` | `"Noto Sans Arabic", "Segoe UI Variable", "Segoe UI", Tahoma, Arial, sans-serif` | All landing text |

The prototype also defines a `--brand-*` scale (spacing 4–48 px, radii 6/10/16 px, status colours) and a
`--nabd-*` set used by its last refinement blocks; they are kept as they are.

## Typography

- **Font**: Noto Sans Arabic 2.010, Regular (100–599) and Bold (600–900), self-hosted as WOFF2
  (`wwwroot/fonts/noto-sans-arabic/`, SIL OFL 1.1), preloaded, `font-display: swap`.
- **Base**: 16 px, line height 1.65 (the landing root sets 16 px; the application's own root is 15 px).
- **Scale** (desktop → phone): hero title from `clamp(32.8px, 3.05vw, 47.2px)` on wide screens down to 33.28 px on
  phones; section titles `clamp(26.4px, 2.8vw, 37.6px)` and up, weight 700–800; card titles 15.7–18.9 px; body
  14–16 px; small print 11–12.5 px. Arabic text always has `letter-spacing: 0`. (Several refinement blocks of
  the prototype set these; the computed values are the prototype's, checked by `landing-style-diff.mjs`.)
- Latin labels inside the laptop mock-up use Arial, as in the prototype.

## Components

| Component | Classes | Notes |
|---|---|---|
| Container | `.nl-container` | `min(1320px, 100% − gutter)`; gutter 64 → 44 → 34 → 30 px as the screen narrows |
| Section head | `.nl-section-head`, `.nl-eyebrow` | Eyebrow with a copper rule, title, lead paragraph |
| Buttons | `.nl-btn` + `.nl-btn-copper` / `.nl-btn-navy` / `.nl-btn-outline-light` / `.nl-btn-outline-navy` | 45 px high, 7 px radius, weight 650 |
| Header | `.nl-site-header`, `.nl-header-inner`, `.nl-brand`, `.nl-main-nav`, `.nl-header-actions`, `.nl-menu-toggle` | Sticky; the nav becomes a drop-down panel at ≤ 820 px |
| Cards | `.nl-specialty-card`, `.nl-premium-about-card`, `.nl-audience-card`, `.nl-step` | Photo cards, glass cards on navy, audience rows, method steps |
| Showcase (V6.3) | `.nl-showcase`, `.nl-showcase-text`, `.nl-device…` | A laptop drawn in CSS (dark lid, aluminium trapezoid deck, keys in slight perspective, front lip) around a real screenshot of the ER room, with two of its messages enlarged in a strip on its lower edge (`.nl-device-thread`); at most 440 px wide on desktop |
| Steps (V6.3) | `.nl-flow`, `.nl-flow-step`, `.nl-flow-shot`, `.nl-flow-num`, `.nl-flow-arrow` | An ordered list of four cards with a real 4:3 screen, a navy number badge and an arrow in the gap toward the next step (left on rows, down when stacked) |
| About (V6.3) | `.nl-about-head`, `.nl-pillars`, `.nl-pillar…` | Title and lead side by side on the navy section; three light solid cards with a copper top rule and a navy icon tile |
| Partnership (V6.3) | `.nl-partner`, `.nl-partner-points`, `.nl-partner-visual` | Text with three checked points on the right; a 16:10 photo with a navy/copper grade and a caption on the left |
| Why (V6.3) | `.nl-why-grid`, `.nl-why-card`, `.nl-why-media`, `.nl-why-tag`, `.nl-why-body`, `.nl-why-answer` | Photo with a "who benefits" tag, the need, and a tinted «في نبض:» answer box |
| Footer | `.nl-site-footer`, `.nl-footer-main`, `.nl-footer-col`, `.nl-footer-bottom` | Three columns → two → one; the application adds `.nl-footer-links` (guest / signed-in groups) and `.nl-footer-credits` |
| Dialog | `.nl-modal-backdrop`, `.nl-modal` | Information only; no form |

## Breakpoints

From the prototype, unchanged: 1250, 1100, 900, 820 (header menu), 640/620/600, 520, 390, 350 px, plus
`(min-width: 821px)` and `(max-width: 1100px) and (min-width: 821px)` refinements, and
`prefers-reduced-motion: reduce`. Checked at 1536, 1440, 1024, 768, 390 and 320 px.

## How the stylesheets are built

| File | Written by | Content |
|---|---|---|
| `wwwroot/css/landing-v6.css` | `tools/migration/landing-v6/convert-css.mjs` from the prototype; **do not edit by hand** | The font faces; the prototype's rules with every class prefixed `nl-`, `:root`/`body` mapped to `.nabd-landing`, element selectors inside `:where(.nabd-landing)`, `rem` turned into the prototype's pixels; then the **guard** |
| `wwwroot/css/landing-v6-shell.css` | By hand | What the prototype could not know: the wrapper `#view-index`, legacy rules on properties the prototype never sets, the footer's signed-in links and credits |
| `wwwroot/css/landing-v63.css` | By hand (V6.3) | The refined sections. Every selector starts from `#view-index.nl-index-view`; fonts in `@layer nl-refine` as `!important` |
| `wwwroot/css/auth-v63.css` | By hand (V6.3) | The sign-in and registration modal. Every selector starts from `#auth-modal`; every declaration `!important` in `@layer nl-refine`; never sets `display` on what the legacy script toggles (tested) |

**The guard.** The legacy stylesheets force some properties on the landing with `!important` or with ID
selectors (fonts on every button/heading/`b`/`strong`; paint, padding and display on `#public-header`, its nav and
buttons, `#site-footer` and `[role="dialog"]`). An ordinary rule cannot win against them. The guard repeats the
prototype's own declarations of exactly those properties as `!important` inside cascade layers: a layered important
declaration beats every unlayered one regardless of specificity, while among themselves the guard's declarations
keep the prototype's specificity and order. Layer order (earlier wins for important declarations):

0. `nl-refine` — the V6.3 refinements (`landing-v63.css`, `auth-v63.css`); above everything, so a refinement wins
   over the prototype and over the legacy `!important` rules ([decision 0011](decisions/0011-landing-v63-refinement-layer.md));
1. `nl-guard-own-important` — the prototype's own `!important` declarations;
2. `nl-guard-shell` — fonts of elements the application adds (filled in the shell file);
3. `nl-guard` — the prototype's declarations of the guarded properties;
4. `nl-guard-defaults` — browser defaults the prototype relied on (`b`/`strong`/heading weight and size; filled
   in the shell file).

The guarded properties and the classes they apply to are listed in `convert-css.mjs` (`FONT`, `PAINT`,
`GUARD_BY_SUBJECT`); a class that appears together with a guarded class on an element gets the same guard.

## Rules for changing the landing

1. Change the design in the prototype, regenerate with `convert-css.mjs` and `convert-markup.mjs`, and port the
   markup change into the Razor partial by hand (the partials carry integration edits; see
   [ui-integration-map.md](ui-integration-map.md)).
2. A rule for something the application adds goes into `landing-v6-shell.css`, starting from a landing root.
3. Every selector must start from `.nabd-landing`, `:where(.nabd-landing)`, an `nl-` class, or one of
   `#public-header`, `#view-index.nl-index-view`, `#site-footer`, `#nl-dialog` (tested).
4. Compare with the prototype at the six widths (`landing-style-diff.mjs`, `landing-visual-compare.mjs`), then
   approve the new region snapshots (`approve-landing-baseline.mjs`) in the same commit.
5. Since V6.3, a refinement that is not a prototype change goes into `landing-v63.css` (or `auth-v63.css` for the
   sign-in modal): new components get new `nl-` class names that the prototype does not use (check
   `classes.json` from `convert-css.mjs`); fonts go into `@layer nl-refine`.

## The sign-in and registration modal (V6.3)

Same tokens as the landing, defined on `#auth-modal` (`--nl-a-navy`, `--nl-a-teal`, `--nl-a-copper-action`, …):
Noto Sans Arabic everywhere; the photo panel graded to navy, with the English subtitle hidden; fields 48 px high
(50 px and 16 px text on phones, so phones do not zoom), 10 px radius, a teal border and ring on focus; the main
button navy, the back button white, text links copper; demo accounts and role cards as white cards with a teal
selected state; a copper focus outline on every button.
