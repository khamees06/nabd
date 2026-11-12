# V6.2 landing: conversion tools

How the owner's prototype `Nabd-Index-Prototype-V6.2.html` became the application's public landing.
Background: `docs/ui-integration-audit.md`, `docs/ui-integration-map.md`, `docs/ui-design-system.md`, ADR 0010.

| Script | Input → output | Run again? |
|---|---|---|
| `extract-images.mjs` | prototype → its embedded images as files + the "stripped" prototype (`IMG(name)` placeholders) read by the two converters | For a new prototype version |
| `convert-css.mjs` | prototype (images replaced by `IMG(name)`) → `src/Nabd.Web/wwwroot/css/landing-v6.css` | **Yes**, whenever the prototype's styles or the guard list change. The output is not edited by hand |
| `convert-markup.mjs` | prototype → cut pieces (header, hero, …, footer, dialog) with `nl-` classes and WebP image paths | Only for a new prototype version |
| `build-partials.mjs` | cut pieces → the Razor partials | **No** for the current views: they were edited by hand afterwards (IDs, sign-in, honest wording). Use it to start from a new prototype version, then repeat the edits listed in `docs/ui-integration-map.md` |
| `ttf-to-woff2.mjs` | TrueType font → WOFF2 (tables unchanged, Brotli) | Only to refresh the font |
| `capture-er-session.js` (V6.3) | runs inside the page (browser-probe `--js-file`): drives one real session of the ER room and stops at a chosen moment | To refresh the product screenshots of the landing |
| `build-v63-images.mjs` (V6.3) | the screenshots + photos the app ships → `wwwroot/img/landing/v63/*.webp` (fixed crops; needs `sharp`) | After new screenshots |
| `approve-landing-baseline.mjs` | running host → `tests/Nabd.Tests/LandingBaseline/*.html` | After an accepted landing change, once it has been compared with the design |

Typical regeneration of the stylesheet (Node 20 or later, no packages):

```
node tools/migration/landing-v6/convert-css.mjs <stripped-prototype.html> src/Nabd.Web/wwwroot/css/landing-v6.css
node tools/legacy/landing-style-diff.mjs --proto <prototype.html> --app http://127.0.0.1:5199/ --width 1440
node tools/legacy/landing-visual-compare.mjs --proto <prototype.html> --app http://127.0.0.1:5199/
```

The stylesheets the page loads, in order: the nine legacy stylesheets (frozen), `landing-v6.css` (generated),
`landing-v6-shell.css` (hand-written integration rules; every selector starts from a landing root), then the V6.3
refinements `landing-v63.css` (from `#view-index.nl-index-view`) and `auth-v63.css` (from `#auth-modal`).
