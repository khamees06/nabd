# UI integration audit: the V6.2 landing prototype

Branch `ui/landing-v6-integration` (from `refactor/clean-architecture`), 2026-11-12.
Input: the owner's file `Nabd-Index-Prototype-V6.2.html` (575,579 bytes), the visual source of truth for `/`.
This document records what the prototype contains, what in it could not go into the application as it was, and
what was decided. The mapping, file by file, is in [ui-integration-map.md](ui-integration-map.md); the design
tokens and rules in [ui-design-system.md](ui-design-system.md); the decision in
[decisions/0010-public-landing-v62-with-the-shell-preserved.md](decisions/0010-public-landing-v62-with-the-shell-preserved.md).

## 1. What the prototype is

One self-contained HTML file:

| Part | Content |
|---|---|
| Markup | Header (brand, 6 links, sign-in and register buttons, mobile menu), hero, value strip, overview (4 specialty cards + the laptop simulation showcase), training method (4 steps), vision / mission / goal, institutions + audience, final call to action, footer, an information dialog, and two demonstration sign-in screens |
| Styles | One `<style>` block, 215,650 characters, 252 class names, written in successive refinement blocks (later blocks override earlier ones on purpose) |
| Script | 9,110 characters: mobile menu, smooth scrolling, the information dialog, and the demonstration sign-in/registration screens (form validation, a fake submission, a password toggle, an "institution" field) |
| Images | 7 JPEG photos embedded as `data:` URIs (231,684 bytes decoded) |
| Fonts | None loaded: the stack names "Noto Sans Arabic" first and falls back to Segoe UI / Tahoma / Arial |

## 2. Conflicts with the application

| # | Conflict | Effect if pasted as is | Resolution |
|---|---|---|---|
| C1 | **Class names shared with the legacy stylesheets** (`.btn`, `.container`, `.hero`, `.modal`, `.section`, `.card` …) | Legacy rules restyle the landing and the landing's rules restyle the signed-in application | Every prototype class gets the prefix `nl-` (`tools/migration/landing-v6/convert-css.mjs`, `convert-markup.mjs`). No legacy stylesheet uses `nl-` (tested) |
| C2 | **Global selectors** (`:root`, `body`, `html`, `*`, `a`, `button`, `img`, `h1`–`h4`, `:focus-visible`) | Would change every page of the application | `:root`/`body` → `.nabd-landing` (the class of each landing root); element selectors wrapped in `:where(.nabd-landing)`, which adds no specificity, so the prototype's own cascade is unchanged; `html` scroll rules dropped. Every selector is checked by `LandingV6Tests.Every_landing_rule_starts_from_a_landing_root` |
| C3 | **IDs the legacy client binds** (`public-header`, `public-brand-btn`, `public-login-btn`, `public-register-btn`, `view-index`, `site-footer`, `footer-guest-links`, `footer-app-links`, `foot-er-btn`, `nb-quiz-main`) | The prototype has its own IDs (`mainNav`, `about`, `contact` …); without the legacy IDs, sign-in, the signed-in/guest switch and the footer links stop working | The legacy IDs are kept on the matching V6.2 elements; the prototype's own IDs get the prefix `nl-` (`#about` → `#nl-about`) so none can meet an application ID. Tested: each required ID exactly once, every ID on the page unique |
| C4 | **Legacy rules on those IDs and on every element** (found with `tools/legacy/landing-style-diff.mjs`) | The new header kept the old header's white background, 67.5 px height, padding and frosted backdrop; buttons got weight 500, other padding and the old colours; headings and `b`/`strong` got weight 500 and other sizes; `#view-index` was padded and laid out as a flex column; the nav was hidden below 1,100 px; pseudo-elements were sized as border-box | The generated **guard** (end of `landing-v6.css`) repeats the prototype's own declarations of exactly those properties as `!important` inside cascade layers: a layered important declaration beats every unlayered one, so the legacy rules lose without the landing raising its specificity. The rest is in `landing-v6-shell.css` (see [ui-design-system.md](ui-design-system.md#how-the-stylesheets-are-built)) |
| C5 | **Root font size**: the application sets `html { font-size: 15px }`; the prototype was designed at 16 px | Every `rem` length 6 % smaller | `rem` lengths converted to the pixel lengths they had in the prototype; media queries keep `rem` (they always use the browser's 16 px) |
| C6 | **Demonstration sign-in screens** with a fake submission | A second sign-in system that accepts anything and stores nothing | Not ported. Every sign-in/registration action opens the application's existing sign-in (`openAuthModal`), which keeps the demo accounts and registration. Tested: no `<form>`/`<input>` in the landing, `data-nl-auth` only `login`/`register` |
| C7 | **Embedded images** (base64 inside the page) | 230 KB of images in every HTML response, no caching, no lazy loading | Extracted to `wwwroot/img/landing/*.webp` (144 KB total, same pixel sizes), with `width`/`height`, eager hero, lazy elsewhere |
| C8 | **The font is not loaded** | The design shows Noto Sans Arabic only where it happens to be installed | Self-hosted WOFF2 (Regular, Bold), SIL OFL 1.1, preloaded; `LICENSE.md` beside the files |
| C9 | **Skip link** pointed at the prototype's `#mainContent` | Broken target | Points at the application's `#main-container`; it sits inside the public header, so it disappears with it after sign-in |
| C10 | The old landing's **mobile header button opened the signed-in sidebar** (`public-open-sidebar-btn`) | A guest saw an empty application drawer | The V6.2 header has its own menu (`#public-menu-toggle` → `#public-main-nav`). It never touches `#app-sidebar` (checked in the browser) |

## 3. Honesty review

The spec forbids invented contact information, partnerships, certifications and affiliations.

| Prototype content | Problem | Decision |
|---|---|---|
| Brand line «الأكاديمية الوطنية للمحاكاة السريرية» | "National" implies an official national body | Changed to «أكاديمية المحاكاة السريرية» in the header and footer (the only wording change). It is the cause of the remaining header/footer pixel difference |
| Nav link «تواصل معنا» → `#contact` | The page has no contact method | Kept (owner's design) but it leads to the footer, which still has no contact method. **Owner decision needed**: give a real contact or remove the link (backlog B1) |
| Button «اكتشف حلول نبض للمؤسسات» and «للمؤسسات التعليمية» | No institutional programme exists to sign up for | The first opens an information dialog that says what Nabd aims to offer institutions, without a form; the second scrolls to the institutions section |
| Institutions heading «شراكة في التعليم السريري» | Reads as an offer to universities; names no partner | Kept: it describes what Nabd offers and claims no existing partnership. Flagged for the owner in case it is read as one (backlog B1) |
| Campus photo in the institutions section | Could read as a partnership with that university | It is a CC0 Wikimedia photo of JUST; the credit says it is a generic campus picture and implies no partnership |
| Laptop "simulation showcase" | Mock screens could be read as the real product | Kept as drawn (the spec asks to keep the mockup honest): it shows the ER room's real parts (chat, monitor, orders) and no invented figures were added. Its labels are illustrative; noted in the backlog (B6) to replace with a real screenshot later |
| Six photos with no documented source | Unknown licence | Kept as supplied by the owner, marked in `img/landing/CREDITS.md` and in the footer credits as "source and licence pending". **Not cleared for public release** until documented (backlog B2) |
| Footer credits | The legacy footer credited the photos and the DDXPlus dataset (CC BY 4.0) | Both credits kept, in two collapsible sections of the V6.2 footer |

## 4. Accessibility review (as integrated)

| Check | Result |
|---|---|
| Skip link | First focusable element of the public header, targets `#main-container` |
| Landmarks | One `header`, `main` (the application's), one `footer`; sections labelled with `aria-labelledby` or `aria-label` |
| Mobile menu | `aria-controls`, `aria-expanded` and `aria-label` kept in step; Escape closes and returns focus to the toggle; an outside click and choosing a link close it; it closes when the window widens past 820 px |
| Dialog | `role="dialog"`, `aria-modal`, labelled and described; focus moves in, Tab stays in, Escape and the backdrop close it, focus returns to the button that opened it |
| In-page links | Scroll below the sticky header (8 px gap) and move focus to the section; smooth only without `prefers-reduced-motion` |
| Images | Arabic `alt` on every photo; decorative SVGs carry no text |
| Reduced motion | The prototype's reduced-motion rules are kept; the legacy reveal animation no longer reaches the landing |
| Contrast | Not measured with a tool in this phase (backlog B8) |

## 5. Pre-existing issues found, not changed

- **320 px left edge**: the signed-in sidebar (`#app-sidebar`, closed) is moved off-screen by `translateX(-281.59px)`;
  the fraction leaves a 1-pixel column of it visible at the left edge at 320 px. Hiding the sidebar removes the
  difference completely (checked). The sidebar is legacy code outside the landing; left as is (backlog B7).
- **«المدرب السريري» in the signed-in footer** goes to the home view: `coach` is in the legacy `REMOVED_VIEWS`. The
  link and its behaviour are kept exactly as they were.
- The old landing's stylesheets (`landing8.css`, `landing9.css`) and the old landing rules in `style.css` still
  load; they no longer match anything on the landing. They are frozen legacy files (baseline tests) and are left
  for the phase that retires the legacy CSS (backlog B9).
