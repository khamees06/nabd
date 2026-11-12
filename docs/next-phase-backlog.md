# Next-phase backlog: the public landing (V6.2, refined in V6.3)

What the work on `ui/landing-v6-integration` leaves open, most important first. Updated 2026-11-12 after the V6.3
refinement; items V6.3 closed are listed at the end.

## Owner decisions

| # | Item | Why it matters |
|---|---|---|
| B0 | **Review and approve V6.3** (local preview). Until then the V6.3 work is a local commit, not pushed, and its region snapshots are candidates | The brief makes the owner's visual review the gate for the next phase |
| B1 | **«تواصل معنا»** leads to the footer, which has no contact method. Give a real contact (e-mail, form, phone) or remove the link | A link to nothing is not honest; the spec forbids invented contact details |
| B2 | **Six photos have no documented source or licence** (hero, four specialty cards, final CTA background; `wwwroot/img/landing/CREDITS.md`). Provide the source and licence or replace them | The landing must not be published as cleared until this is done |
| B3 | Keep or remove the dialog's note «هذه نسخة عرض أولي…» (from the prototype) | It is accurate today; it will not be after launch |
| B4 | **A larger photo for the partnership section.** The JUST campus photo (CC0) is 640 × 400 as the app ships it; the original on Wikimedia Commons is 8160 × 6120. Fetching it needs the owner's go-ahead. The legacy `img/v9/jordan.jpg` (Jordan University Hospital) should not be reused: its Commons page shows it was copied from the hospital's website, so its CC BY-SA tag is only the uploader's claim | Sharper on high-density screens; a photo whose licence is certain |

## Quality

| # | Item | Detail |
|---|---|---|
| B5 | Higher-resolution photos | The hero and specialty photos are the prototype's embedded sizes (hero 790 × 349 px): soft on high-density screens. Add larger originals and `srcset` |
| B6 | Signed-in shell consistency | After sign-in the footer is the V6.2 footer and the sign-in modal has the V6.3 look, while the application header and views keep the legacy look |
| B7 | Product screenshots go out of date | The laptop and step images are screenshots of the ER room; when the room's look changes, rebuild them (`capture-er-session.js`, `build-v63-images.mjs`) |
| B8 | Accessibility measurement | Contrast was measured by script in V6.3's review; an automated audit (axe or Lighthouse) and a screen-reader pass (NVDA/VoiceOver) were not done |
| B9 | Other browsers | Checked in headless Chrome only; Firefox and Safari (iOS) not tested. The `:dir(ltr)` rule (mirroring arrows in a left-to-right page) needs Chrome 120+, Safari 16.4+, Firefox 49+ |
| B10 | Font size | The two WOFF2 files are complete fonts (83 + 89 KB). Subsetting to Arabic + basic Latin would make them smaller |
| B11 | One clean stylesheet | `landing-v6.css` keeps the prototype's successive refinement blocks, rules for parts V6.3 replaced (the old laptop, the old step cards, the old audience cards) and the guard: about 136 KB. Once the design is final, fold it with `landing-v63.css` into one hand-maintained stylesheet with the same computed result (the style diff proves it) |

## Found by the V6.3 review, outside its scope

| # | Item | Detail |
|---|---|---|
| B17 | Header overflow between 821 and 962 px | The V6.2 header's buttons stick out to the left and the page scrolls sideways at those widths (inherited from the prototype). A small fix in `landing-v6-shell.css` (hide the outline sign-in button or narrow the nav gap in that range) needs the owner's OK, since the header was to stay unchanged |
| B18 | Keyboard focus can leave the sign-in modal | Tab moves to page links behind the overlay (legacy behaviour). Trapping focus as the landing dialog does is a small behaviour change |
| B19 | English terms in the sign-in photo panel | «Vitals», «Labs», «Handover» come from the legacy terms script (it converts some Arabic terms into their English clinical names everywhere). Exempting the modal needs a markup change |
| B20 | `img/CREDITS.txt` lists `v9/aud-uni.jpg` twice | Two different sources for one file (a doctor photo and the JUST photo); the file is the JUST photo. Legacy file, to correct when the legacy credits are revised |

## Legacy clean-up (with the legacy CSS retirement)

| # | Item | Detail |
|---|---|---|
| B12 | Old landing CSS | `landing8.css`, `landing9.css` and the `#view-index …` rules of `style.css`/`theme.css` no longer match anything; remove them with the legacy CSS, then most of the guard and of `auth-v63.css`'s `!important` become unnecessary |
| B13 | 320 px sidebar edge | The closed signed-in sidebar (`#app-sidebar`, `translateX(-281.59px)`) shows one pixel at the left edge at 320 px. Legacy code; fix it when the sidebar is moved |
| B14 | «المدرب السريري» footer link | Goes to the home view because `coach` is a removed view in the legacy client. Remove the link or reopen the coach |

## Delivery

| # | Item | Detail |
|---|---|---|
| B15 | Not deployed | V6.2 is pushed on the branch; V6.3 is a local commit only (the owner asked for no push, merge or deployment before his review). The public links (Vercel, GitHub Pages) still serve `main` |
| B16 | Merge order | `ui/landing-v6-integration` is based on `refactor/clean-architecture`, which is itself not merged to `main` |

## Closed by V6.3

- The sign-in/registration modal now has the landing's identity (CSS only, behaviour unchanged).
- The laptop shows a real screenshot of the ER room instead of a drawn mock-up.
- The institutions heading no longer reads as an existing partnership («نحو شراكة…», and the photo caption says so).
- The decorative English text is gone from the landing.
