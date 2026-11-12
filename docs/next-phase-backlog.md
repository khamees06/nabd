# Next-phase backlog: the V6.2 landing

What the integration on `ui/landing-v6-integration` leaves open, most important first. Nothing here is done.

## Owner decisions

| # | Item | Why it matters |
|---|---|---|
| B1 | **«تواصل معنا»** leads to the footer, which has no contact method. Give a real contact (e-mail, form, phone) or remove the link. Also confirm the institutions heading «شراكة في التعليم السريري» is not read as an existing partnership | The spec forbids invented contact details; a link to nothing is not honest either |
| B2 | **Six of the seven photos have no documented source or licence** (hero, four specialty cards, final CTA; see `wwwroot/img/landing/CREDITS.md`). Provide the source and licence or replace them | The landing must not be published as cleared until this is done |
| B3 | Keep or remove the dialog's note «هذه نسخة عرض أولي…» (from the prototype) | It is accurate today; it will not be after launch |

## Quality

| # | Item | Detail |
|---|---|---|
| B4 | Higher-resolution photos | The photos are the prototype's embedded sizes (hero 790 × 349 px, shown about 680 px wide on desktop): soft on high-density screens. Add larger originals and `srcset` |
| B5 | Auth modal in the V6.2 style | The sign-in/registration modal keeps its legacy look. A CSS-only restyle is possible without touching its behaviour (it sits outside the landing regions, so markup changes would need registered differences) |
| B6 | Signed-in shell consistency | After sign-in the footer is the V6.2 footer while the application header is the legacy one |
| B7 | Laptop showcase | Replace the drawn mock-up with a real screenshot of the ER room when the room's design is final |
| B8 | Accessibility measurement | Contrast and automated checks (axe or Lighthouse) were not run; keyboard behaviour was checked by script, not with a screen reader (NVDA/VoiceOver) |
| B9 | Other browsers | Checked in headless Chrome only; Firefox and Safari (iOS) not tested |
| B10 | Font size | The two WOFF2 files are complete fonts (83 + 89 KB). Subsetting to Arabic + basic Latin would make them smaller |
| B11 | One clean stylesheet | `landing-v6.css` keeps the prototype's successive refinement blocks (and repeats some declarations in the guard): 136 KB. Once the design is final, fold the blocks into one stylesheet with the same computed result (the style diff proves it) |

## Legacy clean-up (with the legacy CSS retirement)

| # | Item | Detail |
|---|---|---|
| B12 | Old landing CSS | `landing8.css`, `landing9.css` and the `#view-index …` rules of `style.css`/`theme.css` no longer match anything; remove them with the legacy CSS, then most of the guard becomes unnecessary |
| B13 | 320 px sidebar edge | The closed signed-in sidebar (`#app-sidebar`, `translateX(-281.59px)`) shows one pixel at the left edge at 320 px. Legacy code; fix it when the sidebar is moved |
| B14 | «المدرب السريري» footer link | Goes to the home view because `coach` is a removed view in the legacy client. Remove the link or reopen the coach |

## Delivery

| # | Item | Detail |
|---|---|---|
| B15 | Not deployed | The branch is pushed, not merged and not deployed; the public links (Vercel, GitHub Pages) still serve `main` |
| B16 | Merge order | `ui/landing-v6-integration` is based on `refactor/clean-architecture`, which is itself not merged to `main` |
