# style.css and theme.css

Audit of `style.css` (2,382 lines) and `theme.css` (644 lines) in `C:/Users/ss/nabd-refactor`. Read-only; line numbers refer to the checkout.

## Purpose and load order (index.html `<head>`)

| Order | Line | Resource |
|---|---|---|
| 1 | 11-13 | Google Fonts: two preconnects, then `css2?family=Readex+Pro:wght@160..700&family=IBM+Plex+Mono:wght@300;400;500` (external) |
| 2 | 19 | `style.css` |
| 3 | 20 | `theme.css` |
| 4-10 | 21-29 | `resp.css`, `er.css`, `scope.css`, `home9.css`, `landing8.css`, `landing9.css`, `academic8.css`. Lines 25 and 28 were not printed (the grep matched only link and script lines); not determined what they hold |
| - | 30 | inline script defining `window.nbImgFail` |
| - | 2311-2316 | deferred scripts: script.js, motion.js, terms.js, ui.js, resp.js, er.js |

- `style.css` is the base: a hand-written utility layer, the "Nabd Jordan" phase CSS, then three theme layers appended later in the same file.
- `theme.css` (header, lines 1-7) is "NABD v7, calm medical theme", "loaded after style.css; it only restyles". It reverses the square/flat geometry that `style.css` 1804-2222 (v6) sets.
- There is no Tailwind build or CDN. The Tailwind-looking class names are plain rules written by hand into `style.css`.
- No `*.js` file mentions `style.css` or `theme.css` (grep: no hits).

## How the styles are organised

### style.css

| Lines | Content | Prefix / style |
|---|---|---|
| 1-~695 | Tailwind-like utility layer: reset (1), `.hidden{display:none!important}` (4), display/flex/grid, sizing `w-N h-N`, spacing, colour, `hover\:` variants, breakpoint blocks `@media (min-width: 640/768/1024/1280px)` (303, 332, 342, 370, 496, 512, 518), `@media print` (570), `@keyframes pulse` (464), `ecgSweep` (688). Arbitrary values are escaped, e.g. `.max-h-\[180px\]` (400) | none |
| 697-1009 | "Nabd Jordan visual identity", Phase 1 (697), 1b (772), 1c (865): logo, hero, slides, quiz, roles, path, auth modal, track cards. One rule per line. Redefines teal utilities with `!important` (704-706) | `nb-` |
| 1010-1062 | Phase 1e "calm polish"; extra `:root` at 1011 | `nb-` |
| 1063-1198 | Nurse room chat (1063), nurse room v2 (1129); keyframes `nrIn` (1070), `nrPulse` (1176) | `nr-`, `nr2-` |
| 1199-1628 | "NABD calm, light clinical theme": `:root` (1200), colour-utility remap (1254), landing (1330), auth (1524-1627) | `--text-*`, `--accent*`, `--nb-*` |
| 1629-1803 | "Quiet Apple-inspired finish": coach view; second token `:root` (1630); keyframes `coach-message-in` (1786) | `coach-`, `#view-coach` |
| 1804-2222 | "NABD v6 identity layer": warm paper + ink, square, no glass. `:root` (1810), buttons, headers, drawer, hero, ticker, tracks, entrance motion (2065), reduced motion (2114), phone widths (2131), demo entry (2143), account menu (2198) | `nb-`, `--paper`, `--ink`, `--signal` |
| 2223-2246 | Font override `:root` (2227) and `!important` font-family / weight rules | |
| 2247-2291 | Motion layer "driven by motion.js": hero word reveal (2250), pointer follow (2256), scroll progress/sweep (2260), `.nb-io` reveals (2272); `@supports (animation-timeline: view())` at 2097 | `nb-` |
| 2292-2315 | Patient monitor widget `.nb-mon-*`; keyframes `nb-alarm`, `nb-beat`, `nb-dot` | `nb-mon-` |
| 2316-2382 | Late patches: ticker (2316), nursing room height fit (2333), monitor readings (2346), terms-switch note (2356), mobile audit fixes dated 2026-11-07/08 (2374, 2378) | mixed |

Counts: 54 `@media` in style.css, 15 in theme.css. 17 `@keyframes` in style.css (grep list), 0 in theme.css.

### theme.css

| Lines | Content |
|---|---|
| 8-30 | `:root` tokens |
| 32-93 | base: `html, body{background:var(--bg)!important}`, heading weights, `.rounded*` overrides (43-48), pills, controls, surfaces |
| 94-190 | headers (white), side drawer, toast, dialogs |
| 192-316 | Landing: hero, journey band, tracks, specialties, level quiz, split blocks, closing band, footer |
| 317-405 | Signed-in home: room card, cases, path, filters, coach banner |
| 406-513 | Nursing room (406), simulation room (471), phones and tablets (478) |
| 514-644 | "v7.1 fixes from the visual review" and later patches: anchors, photos, toast, operating-room section (610), surgical checklist (622), mobile audit 2026-11-07 (638) |

### Naming conventions

| Pattern | Meaning | Where defined |
|---|---|---|
| Tailwind-style (`flex`, `w-4`, `text-xs`, `bg-teal-700`, `hover\:bg-teal-600`, `rounded-xl`, `-translate-x-full`) | Used in index.html and script-built markup; defined by hand | style.css 1-695, remapped at 704-706 and 1254, `.rounded*` at theme.css 43-48 |
| `nb-` | Nabd components | both files |
| `nr-`, `nr2-` | Nurse room | style.css 1063-1198 |
| `v7-` | v7 landing blocks (e.g. `.v7-checks`, theme.css 232) | theme.css |
| `nb8-`, `nb9-` | e.g. `nb8-auth-side` on index.html:1970 | defined in later CSS files, not audited here |
| `#view-*`, `#side-pane-*`, `#public-header`, `#app-header`, `#auth-modal` | ID-scoped overrides | 103 lines in style.css and 53 in theme.css contain `#view-` (grep -c) |

## Design tokens

Six `:root` blocks in style.css and one in theme.css. When the same name is redeclared, the later declaration wins, and theme.css loads after style.css.

| Block | Tokens (value) |
|---|---|
| style.css 698-701 | `--nb-ink #193B4A`, `--nb-teal #16838A`, `--nb-teal-dark #0F6A70`, `--nb-sky #E6F2F4`, `--nb-mist #EDF3F6`, `--nb-line #DCE7EB`, `--nb-jo-black #191815`, `--nb-jo-green #094F2C`, `--nb-jo-red #D72720` |
| style.css 1011 | `--nb-text #193B4A`, `--nb-muted #3E5864` (both redeclared in the 1200 block, which wins) |
| style.css 1200-1228 | `color-scheme: light`; `--bg-main #F4F8FA`, `--bg-secondary #F2F7F9`, `--surface #FFFFFF`, `--surface-muted #F1F6F8`, `--surface-elevated #E5EDF0`, `--text-primary #193B4A`, `--text-secondary #38525E`, `--text-muted #5A7582`, `--accent #16838A`, `--accent-dark #0F6A70`, `--accent-soft #E6F2F4`, `--accent-blue #5B7683`, `--border-standard #DCE7EB`, `--success #0D6D3B`, `--warning #955E00`, `--error #DC312B`, `--info #4C6774`; aliases `--nb-ink/teal/teal-dark/sky/mist/line/text/muted` mapped onto those |
| style.css 1630-1642 | re-declares `--bg-main`, `--bg-secondary #F1F6F8`, `--surface-muted #EDF3F6`, `--surface-elevated #E2EBEE`, `--text-secondary #39535F`, `--text-muted #56727F`, plus same-value accent and border tokens; later in file, so these win over 1200 |
| style.css 1810-1832 | `--paper #F4F8FA`, `--paper-2 #EAF1F4`, `--paper-3 #DCE7EB`, `--white #FFFFFF`, `--ink #193B4A`, `--ink-2 #425D69`, `--ink-3 #758E9A`, `--signal #16838A`, `--signal-strong #0F6A70`, `--signal-light #6CC9CE`, `--tint #E6F2F4`, `--line #DCE7EB`, `--gold #F2B01E`, `--moss #0F7F45`, `--danger #C62828`, `--danger-light #FF6B63`, `--ease-out cubic-bezier(.2,.7,.2,1)`, `--ease-snap cubic-bezier(.7,0,.2,1)`, `--font-ar`, `--font-mono` |
| style.css 2227-2231 | `--font-ar 'Readex Pro','Noto Sans Arabic',Tahoma,system-ui,sans-serif`; `--font-mono 'IBM Plex Mono','Readex Pro',ui-monospace,Consolas,monospace` (overrides the 1810 `--font-mono`) |
| theme.css 8-30 | `--bg #F4F8FA`, `--surface #FFFFFF`, `--ink #193B4A`, `--ink-2 #4F6A77`, `--ink-3 #587180`, `--line #DCE7EB`, `--line-2 #E8EFF2`, `--tint #E6F2F4`, `--tint-2 #F0F7F8`, `--signal #16838A`, `--signal-strong #0F6A70`, `--signal-light #6CC9CE`, `--navy #193B4A`, `--navy-2 #12303C`, `--r-sm 10px`, `--r 14px`, `--r-lg 20px`, `--r-xl 28px`, `--sh-1`, `--sh-2` (box shadows), `--gap-section clamp(3.5rem, 8vw, 6rem)` |

Observations: three naming families (`--nb-*`, `--text-*`/`--accent*`, `--ink`/`--signal`/`--paper`) cover one palette (navy #193B4A, teal #16838A, line #DCE7EB). `--ink-2` and `--ink-3` differ between the two files (style 1810: #425D69 / #758E9A; theme: #4F6A77 / #587180); theme.css wins. `--surface` is declared in both files with the same value. There is no dark-mode block.

## Relative url() references and @import / @font-face

| File:line | Reference | Notes |
|---|---|---|
| both files | `@import`: none. `@font-face`: none | Fonts come only from the Google Fonts link (index.html:13) |
| style.css:719 | `url('https://commons.wikimedia.org/wiki/Special:FilePath/Sunset_over_citadel_in_Amman,_Jordan.jpg?width=1000')` | Absolute external URL. The declaration is `background:rgba(...),url(...) center/cover,#2C4956`; a colour is not allowed in a non-final layer, so by the CSS grammar the declaration is invalid and dropped (reasoned, not rendered). style.css:1374 sets `background:#E1EAED!important` on the same selector regardless |
| style.css:883 | `url("data:image/svg+xml;utf8,<svg ...>")` on `.nb-hero::before` | inline data URI |
| theme.css:232 | `url("data:image/svg+xml,%3Csvg ...")` on `.v7-checks li::before` | inline data URI |

No relative `url()` exists in either file, so moving the files breaks no asset path. What does break on a move: `href="style.css"` and `href="theme.css"` (index.html:19-20), and the external Google Fonts and Wikimedia hosts. `Noto Kufi Arabic` (703) and `Noto Sans Arabic` (774, 1810, 2227) are named but not loaded by any link.

## Reliance on !important and on selector order between files

| Metric | style.css | theme.css |
|---|---|---|
| lines containing `!important` (grep -c) | 339 | 282 |
| of which in non-comment-led lines | 320 | 282 |
| `@media` | 54 | 15 |

Patterns later layers depend on:

| Pattern | Example (line) | Dependency |
|---|---|---|
| Colour remap by `!important` on utility classes | `.bg-teal-700`, `.text-teal-700` (704-706); remap section at 1254; `body{color/background ...!important}` (1235ff) | index.html keeps old colour utilities; the theme recolours them |
| ID-scoped `!important` to beat earlier phase CSS | comment at 1936: "The phase CSS scopes the hero with #view-index, so the identity rules below use the same scope (plus !important) to win the cascade"; `#view-index .nb-hero h1{font-size...!important}` (2238) | specificity race documented in the code |
| Later layer reverses an earlier one | v6 square geometry, e.g. `.nb-quiz{border-radius:0 !important}` (900); v7 `.rounded*{border-radius:...!important}` (theme 43-48) | theme.css must load after style.css |
| Font and weight forcing | style.css 2233: `body, button, input, select, textarea{font-family:var(--font-ar)!important}`; `h1{font-weight:200!important}` (style 2236) vs `h1{font-weight:500!important}` (theme 35) | both `!important`, same specificity, theme.css loads later, so theme.css should win (not rendered) |
| Same selector repeated across layers | `h1,h2,h3,.nb-display` font-family at 703, 774, 1842 | last one wins; 703 names a font that is not loaded |
| Token redeclaration | `--ink-2`, `--ink-3` | later file wins |
| Files after theme.css | resp.css, er.css, scope.css, home9.css, landing8.css, landing9.css, academic8.css | not audited here; they can override both |

## Rules tied to JavaScript state

Classes that scripts add, remove or toggle (grep of `classList.add|remove|toggle("name"` across script.js, ui.js, motion.js, er.js, resp.js, terms.js; number = call sites) and the rule in these two files:

| Class / attribute | Call sites | Rule in style.css / theme.css | Effect |
|---|---|---|---|
| `hidden` | 106 | style.css:4 `display:none!important` | show/hide of views, panels, dialogs |
| `flex` | 11 | display utility | paired with `hidden` |
| `is-on` | 10 | 12 matches in style.css, 4 in theme.css (e.g. `.nb-stage.is-paused .nb-rail button.is-on::after` at 792) | selected slide/rail/tab |
| `on` | 9 | theme.css:630-631 `.nb-chk-b button[data-v="1"].on` / `[data-v="0"].on` | surgical checklist yes/no |
| `data-v` (`dataset.v`, 3 uses) | | theme.css:630-631 only | checklist value |
| `is-sel` | 4 | style.css (2 matches) | selected option |
| `nb-auth-open` | 2 | style.css:1589 `html.nb-auth-open, html.nb-auth-open body{overflow:hidden!important}` | page scroll lock behind auth box |
| `is-paused` | 2 | style.css:792 | pauses hero progress animation |
| `is-split` | 1 | style.css:2251 `#view-index .nb-hero h1.is-split{animation:none!important}` | hero word reveal (motion.js) |
| `nb-io`, `is-in` | 1 each | style.css:2274-2276 | scroll reveal (motion.js) |
| `nb-mon`, `nb-mon-host`, `nb-mon-tile`, `is-picked`, `nb-alarm`, `nb-beat`, `nb-dot-beat` | 1-2 each | style.css:2295-2312 | patient monitor widget |
| `nb-locked` | 1 | style.css:879 | locked case card image |
| `is-current` | 1 | theme.css (2 matches) | current step |
| `-translate-x-full` | 2 | style.css:277 | drawer off-screen state |
| `is-coach`, `is-student` | in markup | style.css:1678-1679, 1696 | coach bubble alignment |
| `is-open`, `is-loading`, `er-flash`, `is-off`, `is-live`, `is-bad`, `active` | 1-3 each | no match found in these two files | styled elsewhere or not determined |

`data-stage` and `data-terms`: no selector in style.css or theme.css (grep returned nothing). JS has `dataset.stage` twice. The comment at style.css:2356 says the medical-terms switch is gone and terms are always English. Other JS `data-*` hooks (`sound`, `tile`, `rhythm`, `ready`, `ord`, `badge`, `role`, `room`, `side`, `split`, `rc`, `out`) have no attribute selector here; the monitor uses `.nb-mon-sound[aria-pressed="true"]` (2302) and `.nb-mon-info[hidden]` (2314).

## Problems

| # | Kind | Detail |
|---|---|---|
| 1 | Layer stacking | Phase 1, calm light (1199), Apple finish (1629), v6 (1804) and v7 (theme.css) are all active; each restyles the previous mostly with `!important`. The look is the cascade result, not any single file |
| 2 | Contradiction | v6 square/flat (style) vs v7 rounded/soft (theme); `h1` weight 200 vs 500. Winner depends on file order; computed values were not probed |
| 3 | `!important` volume | 339 + 282 lines, many ID-led; a move to scoped CSS must keep specificity |
| 4 | Token duplication | three token families, seven `:root` blocks, `--ink-2`, `--ink-3`, `--font-mono` redeclared with different values |
| 5 | Invalid declaration | style.css:719 background list is invalid; image never paints; 1374 overrides the background anyway; dead external dependency on Wikimedia |
| 6 | Unreferenced rules | `.nb-flagline` (709-710) and `.nb-slide`/`.nb-slides` (about 12 mentions from ~800): `grep -l` over `*.css *.js index.html` finds them only in style.css; none in index.html, JS or other CSS. Markup built by string concatenation is not excluded |
| 7 | Unloaded fonts | `Noto Kufi Arabic` (703) and `Noto Sans Arabic` are not in the Google Fonts link; rule 703 is superseded by 774 and 1842 |
| 8 | Hand-written utility layer | about 700 lines imitate Tailwind; a class is only provably dead after scanning all generated markup. `hover\:bg-teal-800` is used 18 times in index.html and redefined at 705 |
| 9 | External dependencies | Google Fonts and Wikimedia; fallback is the system stack |
| 10 | Late patches far from their targets | dated "mobile audit 2026-11-07/08" blocks at file ends (style 2374-2382, theme 638-644) |

## Open questions

1. Computed winner for `h1` weight and `.rounded*` radius at runtime (not probed; resp.css, er.css, scope.css, home9.css, landing8.css, landing9.css, academic8.css load later).
2. Whether `.nb-slide` and `.nb-flagline` are produced by script-built markup (searched: none in index.html or JS strings).
3. Where `is-open`, `is-loading`, `er-flash`, `is-off`, `is-live`, `is-bad` are styled (other CSS files not searched).
4. Whether `Noto Kufi Arabic` and `Noto Sans Arabic` are meant to be loaded.
5. What index.html lines 25 and 28 contain (between the stylesheet links).
6. Whether anything relies on the `@media print` block at style.css:570.
