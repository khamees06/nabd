# 0013 — V6.5: the signed-in application takes the landing's identity, with one scoped stylesheet

Status: proposed (awaiting the owner's visual review) · 2026-11-13 · builds on [0011](0011-landing-v63-refinement-layer.md), [0012](0012-sign-in-and-registration-pages.md)

## Context

The owner approved the public landing and the sign-in pages (V6.4) and asked that every screen after sign-in look
like them: the same navy, copper and teal, the same cards and type, with the ER room first, and without any change
that could cause an error anywhere. Those screens are the legacy client's: their markup is rendered by the Razor
partials and changed by the legacy scripts, and their nine stylesheets are byte-compared with the frozen legacy
site by the baseline tests.

## Decision

- **One new stylesheet, `wwwroot/css/app-v65.css`, loaded last; CSS only.** No markup, no script and no legacy
  stylesheet changes. The head gets one link (registered difference 19).
- **Scoped to signed-in screens.** Every selector starts from the flag `html:has(> body > #app-header:not(.hidden))`
  (the application header is shown only to a signed-in user) or from the ID of a signed-in part (header, drawer,
  toast, the four application dialogs, the home, profile, university, empty-report, ER and respiratory views).
  The landing, the sign-in screen and the public footer are never selected (tested).
- **Through the legacy colour variables first.** The legacy styles paint mostly through variables (`--signal`,
  `--ink`, `--line`, `--tint`, `--navy`, …). They are redefined on the flag (which is `:root`, so their aliases
  follow) and per part where a part needs other values (the header turns navy, the account menu inside it stays
  light). A rule is written only where a value is hard-coded.
- **`@layer nl-refine` only against legacy `!important`**, and every state the legacy CSS shows through such a rule
  (pressed, done, out of indication, critical) is declared again after the override.
- **Paint only.** The file never sets display, visibility, opacity, transform, position, z-index, heights or
  offsets (tested): the scripts show and hide these parts, and the ER room's height depends on the header's.
- **Clinical colours keep their meaning:** alarm red, urgent amber, the yellow of a test out of indication (the
  briefing calls it yellow), the monitor (its near-black screen, its traces drawn in script, its reading colours:
  the variables it uses are pinned back inside it), success green and warning amber.
- **Roles of the colours, as on the landing:** copper for the main action of a screen (send, start, enter the
  room), navy for the other filled actions and the selected state, teal for links, focus of fields and "good",
  copper text for eyebrows. In the ER chat: the trainee navy-teal with white text, the patient grey, the nurse
  teal tint, the relative copper tint, the supervisor white with a navy rule.

## Consequences

- `compare-hosts.mjs` still proves the signed-in screens' markup and behaviour are the legacy ones (the DOM is
  compared with the new link taken out); their screenshots now differ on purpose.
- The signed-in screens use Noto Sans Arabic like the landing (the font variable is redefined); the ER clock and
  monitor keep their monospaced figures.
- The respiratory room (closed) only follows the variables; the training views that cannot be opened are not
  restyled.
