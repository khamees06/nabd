# Visual baseline

Screenshots of the legacy site (commit `5f431d5` of `main`), taken by `tools/legacy/compare-hosts.mjs` in headless
Chrome with seeded random numbers, animations off and other hosts blocked (so the web fonts are the fallback
fonts, on purpose: the comparison then depends on the two hosts only). Eleven states, each at 1440×900 (`desktop`)
and 390×844 (`phone`).

The same tool takes the same screenshots from the ASP.NET Core host and compares them with these, together with
the live DOM and the page's errors. The table below is the last run of this phase (Release build, Development
settings, understanding services off on both sides).

| state | viewport | view | DOM | screenshot | errors (legacy / current) |
|---|---|---|---|---|---|
| landing | desktop | index | identical | identical | 0 / 0 |
| landing | phone | index | identical | identical | 0 / 0 |
| sign-in | desktop | index | identical | identical | 0 / 0 |
| sign-in | phone | index | identical | identical | 0 / 0 |
| register | desktop | index | identical | identical | 0 / 0 |
| register | phone | index | identical | identical | 0 / 0 |
| home-medical-student | desktop | home | identical | identical | 0 / 0 |
| home-medical-student | phone | home | identical | identical | 0 / 0 |
| home-nursing-student | desktop | home | identical | DIFFERENT | 0 / 0 |
| home-nursing-student | phone | home | identical | identical | 0 / 0 |
| home-professor | desktop | home | identical | identical | 0 / 0 |
| home-professor | phone | home | identical | DIFFERENT | 0 / 0 |
| university-professor | desktop | university | identical | identical | 0 / 0 |
| university-professor | phone | university | identical | identical | 0 / 0 |
| profile-student | desktop | profile | identical | identical | 0 / 0 |
| profile-student | phone | profile | identical | identical | 0 / 0 |
| coach-student | desktop | home | identical | identical | 0 / 0 |
| coach-student | phone | home | identical | identical | 0 / 0 |
| er-briefing-doctor | desktop | er | identical | identical | 0 / 0 |
| er-briefing-doctor | phone | er | identical | identical | 0 / 0 |
| er-briefing-nurse | desktop | er | identical | identical | 0 / 0 |
| er-briefing-nurse | phone | er | identical | identical | 0 / 0 |

Reading the table:

- **DOM**: `document.documentElement.outerHTML` after the steps, with the registered differences undone. Identical
  in all 22 pairs.
- **screenshot**: the PNG bytes. Identical in 20 of 22 pairs in this run. The pairs that differ are always
  signed-in home views, not the same ones from run to run, and the legacy site compared with itself
  (`--current http://127.0.0.1:5180`, signed-in home of the medical student, four runs at two viewports) differed
  in 2 of 8 screenshots. The cause was not determined; it is not a difference
  between the hosts.
- **errors**: uncaught exceptions and console errors on each host. None.

To repeat the comparison, see `docs/testing-strategy.md`, "Browser comparison".

## Since the V6.2 public landing (2026-11-12, branch `ui/landing-v6-integration`)

The public header, the landing view and the public footer are now the owner's V6.2 design
([decision 0010](../decisions/0010-public-landing-v62-with-the-shell-preserved.md)). The screenshots above of
`landing`, `sign-in` and `register` show the **old** landing behind; they remain the legacy baseline.

### The rest of the application against the legacy site

`compare-hosts.mjs` now takes the three regions out of both hosts (placeholder in the DOM, hidden before the
screenshot) and leaves comments and whitespace between tags out of the DOM comparison. Run of 2026-11-12 (Debug
build, Development settings):

| state | desktop DOM | desktop screenshot | phone DOM | phone screenshot | errors |
|---|---|---|---|---|---|
| landing | identical | 4,440 px differ by 1 level (of 255), left 21 px | identical | 4,166 px by 1 level, left 21 px | 0 / 0 |
| sign-in | identical | identical | identical | identical | 0 / 0 |
| register | identical | 1 px by 1 level | identical | identical | 0 / 0 |
| home-medical-student | identical | 589 px by ≤ 3 levels, bottom 4 rows | identical | identical | 0 / 0 |
| home-nursing-student | identical | identical | identical | identical | 0 / 0 |
| home-professor | identical | identical | identical | identical | 0 / 0 |
| university-professor | identical | identical | identical | identical | 0 / 0 |
| profile-student | identical | identical | identical | identical | 0 / 0 |
| coach-student | identical | 589 px by ≤ 3 levels, bottom 4 rows | identical | identical | 0 / 0 |
| er-briefing-doctor | different in the first run (a toast still showing), identical when run again | identical | identical | identical | 0 / 0 |
| er-briefing-nurse | identical | identical | identical | identical | 0 / 0 |

No difference is visible: the largest is 3 colour levels out of 255. The landing-state strip is the shadow of the
closed signed-in sidebar at the left edge (the legacy site compared with itself on that state: identical, so this
1-level difference is between the hosts; its cause was not determined). The signed-in home rows are the same
kind of difference the legacy site shows against itself (above).

### The landing against the prototype

`tools/legacy/landing-visual-compare.mjs` screenshots the prototype file and the application's page at six widths
(full page, animations off) and compares them pixel by pixel (a channel difference above 24 counts); the footer is
compared from its own top edge because the application's footer is about 26 px taller (it adds the credits).
`tools/legacy/landing-style-diff.mjs` compares the computed styles of every element, `::before` and `::after`
included. Run of 2026-11-12 ([`landing-v62/visual-compare-report.json`](landing-v62/visual-compare-report.json)):

| width | header + landing: pixels that differ | footer | computed-style differences in the landing content |
|---|---|---|---|
| 1536 | 0.009 % (676 px) | 0.197 % | none |
| 1440 | 0.010 % (676 px) | 0.211 % | none |
| 1024 | 0.064 % (3,174 px) | 0.295 % | none |
| 768 | 0.013 % (675 px) | 0.275 % | none |
| 390 | 0.018 % (538 px) | 0.555 % | none |
| 320 | 0.033 % (842 px) | 0.645 % | none |

Every differing pixel is explained:

- the brand line «أكاديمية المحاكاة السريرية» replaces «الأكاديمية الوطنية للمحاكاة السريرية» (header and footer);
  at 1024 px the shorter brand also lets the nav sit a little further right;
- the footer's credits line (added by the application) starts where the prototype's footer ends;
- at 320 px, a 1-pixel column at the left edge is the closed signed-in sidebar of the legacy shell (hiding it
  removes the difference: 0 rows).

No horizontal overflow at any of the six widths (`scrollWidth` equals the viewport width).

Screenshots in [`landing-v62/`](landing-v62/): the first screen of the application at each width
(`app-<width>-top.png`) and `compare-1440-top.png` (prototype | application | differing pixels in red).

## V6.3 visual refinement (2026-11-12, local, awaiting the owner's review)

V6.3 deliberately changes four sections of the landing and the look of the sign-in modal
([decision 0011](../decisions/0011-landing-v63-refinement-layer.md)), so the landing no longer matches the V6.2
prototype there; the parts it did not touch were compared with the V6.2 screenshots above:

| Part | Check | Result |
|---|---|---|
| Header, hero, value strip, specialties (page top down to the showcase) | Pixel comparison with the V6.2 screenshot | 0 differing pixels at 1440 and at 390 |
| Final call to action and footer (aligned at the call to action) | Same | Visually identical; about 0.3 % of pixels differ by text anti-aliasing because the section now starts at a different fractional offset |
| The rest of the application against the legacy site (`compare-hosts.mjs`) | DOM, screenshot, errors in 11 states × 2 viewports | DOM identical in all 22: the ER briefing (doctor, desktop) differed in the full runs because a toast was still showing, and was identical in four separate runs of that state (two old-vs-new, two old-vs-old). Screenshots: ER room and every signed-in view identical, except two signed-in home pairs in the last run (589 px by ≤ 3 levels; and the home photo, visually identical, up to 32 levels in the photo only), the same flicker the legacy site shows against itself (above). Sign-in and register differ on purpose (V6.3 restyle); landing state 1 colour level at the left edge, as before. No page errors |

Screenshots of the result in [`landing-v63/`](landing-v63/): each changed section at 1440 px, the same sections on
a 390 px phone, and the sign-in and registration modal.

The result was reviewed twice by independent reviewers (RTL and arrows, responsive layout, the brief item by item,
accessibility, isolation and honesty); every finding of medium or high severity was reproduced by a second
reviewer before it was fixed. Measured after the fixes: no horizontal overflow from the landing at 320–1536 px
(the header's own overflow between 821 and 962 px predates V6.3); every checked text at 4.5:1 or more; focus
indicators at 3:1 or more; registration fits a 1366 × 768 screen.
