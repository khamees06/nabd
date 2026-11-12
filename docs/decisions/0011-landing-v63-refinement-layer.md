# 0011 — V6.3: the landing is refined in its own stylesheet and layer; sign-in is restyled with CSS only

Status: proposed (awaiting the owner's visual review) · 2026-11-12 · builds on [0010](0010-public-landing-v62-with-the-shell-preserved.md)

## Context

The owner asked for a precise visual refinement of the V6.2 landing (brief "Nabd Landing Page – V6.3 Visual
Refinement"): a smaller laptop showing a real training screen, the «كيف تعمل نبض؟» steps with images and correct
right-to-left arrows, a clearer «عن نبض» section, a real Jordanian university photo in the partnership section,
«لماذا صممنا نبض؟» cards that explain real needs, no decorative English, and a more consistent sign-in and
registration modal. The hero, the header and the footer stay as they are. Nothing behind the page changes.

Two constraints shape the solution. `landing-v6.css` is generated from the V6.2 prototype and must stay
regenerable; and the legacy stylesheets force fonts (and, in the sign-in modal, nearly every property) with
`!important`, up to `html #auth-modal …`, while the legacy files must not be edited.

## Decision

- **A separate, hand-written stylesheet for the landing refinements**, `wwwroot/css/landing-v63.css`, loaded after
  the V6.2 files. Every selector starts from `#view-index.nl-index-view`: the ID outranks every class rule of the
  generated base without `!important`, and nothing can reach another page.
- **A refinement cascade layer.** The layer order declared in `landing-v6.css` becomes
  `nl-refine, nl-guard-own-important, nl-guard-shell, nl-guard, nl-guard-defaults`. For important declarations an
  earlier layer wins, and any layered important declaration wins over every unlayered one, so a declaration in
  `nl-refine` beats both the V6.2 guard and the legacy `!important` rules. `landing-v63.css` uses it only for
  fonts; `auth-v63.css` uses it for everything.
- **Redesigned components get new class names** (`nl-device`, `nl-flow`, `nl-pillar`, `nl-partner`, `nl-why`, …)
  checked against the prototype's 252 classes, so no generated rule applies to them; wrappers that keep their V6.2
  look keep their V6.2 classes.
- **Sign-in and registration: CSS only** (`wwwroot/css/auth-v63.css`, every selector from `#auth-modal`, every
  declaration `!important` in `nl-refine`). The modal's markup, ids and script are untouched, so the existing
  behaviour (validation, demo accounts, the two registration steps, error messages) is kept by construction.
  Because a layered important `display` would beat `.hidden` and the legacy script, the file never sets `display`
  except to hide one English subtitle (a test enforces this).
- **Product images are real screens.** The laptop and the four steps show screenshots of one real session of the
  ER room, driven by `tools/migration/landing-v6/capture-er-session.js` and cropped by `build-v63-images.mjs`.
  Photos come from images the application already ships, with the licences recorded in `img/CREDITS.txt` (CC0
  and public domain). The university photo's Commons record was checked during the review: own work of the
  uploader, CC0. A first university photo (Jordan University Hospital) was dropped because its Commons record
  shows it was copied from the hospital's website.
- **Tests**: the region snapshots are re-recorded for V6.3 (to be approved by the owner); `LandingV6Tests` gains
  checks for Arabic-only copy, the steps' structure, image credits and the sign-in stylesheet's `display` rule.

## Consequences

- The V6.2 base keeps rules that no longer match anything (the old laptop drawing). They go when the prototype's
  stylesheet is folded into one hand-maintained file (backlog).
- A change to the ER room's look makes the screenshots in the landing outdated; they are rebuilt with the two
  scripts above.
- The sign-in modal now uses the landing's font and palette while the signed-in application keeps its legacy
  look until it is redesigned.
