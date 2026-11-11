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
