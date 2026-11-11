# index.html:1117–1887 — coach, profile, university (academic portal), respiratory room and ER room views

Scope: index.html lines 1117–1887, all read. Evidence: code (grep of index.html and all root `*.js`/`*.css`) and 2 probes of the running page at http://127.0.0.1:5180/ (demo user `med_student`). Line 1111–1116 (the comment header of the coach view) sits just before the range; line 1888 is `</main>`.

## Structure

All five blocks are sibling `<section>` elements inside `<main>`, each toggled by the class `hidden` (script.js `showOnlySection`, 2010–2014).

| Block | id | Lines | Notes |
|---|---|---|---|
| Coach view | `view-coach` | 1117–1218 | `coach-main-column` 1121–1167 (header 1123–1142, `coach-chat-messages` 1145, quick strip 1150–1158, input bar 1161–1166); backdrop `coach-weakness-backdrop` 1170; drawer `coach-weakness-panel` 1171–1215 (progress 1185–1196, `coach-weakness-queue` 1201, buttons 1207–1214) |
| Profile view | `view-profile` (comment 1220–1224) | 1225–1507 | header card 1228–1258; tab bar 1261–1280 (`data-ptab` buttons 1263–1275, `profile-quick-open-cert-btn` 1277); panes: `profile-pane-dash` 1283–1294, `-overview` 1297–1327, `-history` 1330–1353, `-settings` 1356–1388, `-certificate` 1391–1505 (action bar 1393–1404, `printable-certificate-area` 1407–1504) |
| University view | `view-university` (comment 1509–1512) | 1513–1761 | banner 1516–1533; `uni-student-content` 1536–1579 (`nb8-uni-stu` 1538, `.nb8-legacy` card 1540–1578); `uni-doctor-content` 1582–1759: note 1585, tab list 1589–1595, panes `nb8-pane-courses` 1598, `-assign` 1608–1675 (form 1613–1625, list 1629, `nb8-legacy-builder` details 1631–1674), `-reports` 1678–1741 (KPIs 1680–1701, cohort table 1704–1740), `-progress` 1744, `-advisor` 1752 |
| Respiratory room | `view-resp` (comment 1763–1765) | 1766–1831 | `rs-head` 1767–1777; `rs-wrap` 1778–1830: `rs-chat` 1779–1793, `rs-side` 1794–1829 (monitor 1795, tests 1807, bars 1811, `rs-body` 1815, question list 1816, about 1822–1828) |
| ER room | `view-er` (comment 1832–1834) | 1835–1886 | `er-top` 1837–1847; `er-grid` 1848–1882: side tabs 1851, monitor `aside.er-mon` 1855–1865, records `aside#er-records` 1867–1872, `er-stage` 1873–1881; `er-sheet` 1883; `er-debrief` 1884 |

## Which script owns what

Method: `grep -n "<id>" *.js`. The first hits are shown. "none" means no JS reference to the string.

| Ids | Reader / writer |
|---|---|
| `view-coach`, `view-profile`, `view-university`, `view-resp`, `view-er` | script.js `showOnlySection` 2011 (class `hidden`); `view-profile`/`view-university` also motion.js 49–50 (selectors); `view-er` also er.js 176–178, 3862, 4564, 4642 (`dataset.stage`, `dataset.rhythm`, visibility), motion.js 572, terms.js 82; `view-resp` resp.js 827, 868 |
| `coach-chat-messages`, `coach-quick-chips`, `coach-weakness-queue`, `coach-weakness-panel`, `coach-mastery-percent`, `toggle-coach-weakness-btn` | script.js 5683–5940 (section 7B "interactive AI clinical coach"); render entry `renderInteractiveCoachView()` called from `navigateTo` 1972 |
| `coach-api-url/-key/-on/-state/-save` | script.js 5869–5877 (writes `NB_COACH_API_KEY` in storage, key in `sessionStorage`) |
| `coach-main-column` | CSS only (style.css, theme.css) |
| `profile-*` stats, lists, `profile-history-tbody` | script.js 5325–5351 (`renderProfileView`, called from `showOnlySection` 2018) |
| `dash-level/-skills/-coach/-recent`, `path-mistakes`, `path-notes` | script.js 5444–5451, 2588; `dash-coach-go` is bound at 5448 but does not exist in this range |
| `data-ptab` buttons, `profile-pane-*` | script.js `switchProfileSubTab` 5456–5461 |
| `cert-serial-num`, `cert-issue-date`, `cert-trainee-name`, `cert-email-footer`, `cert-stat-*`, `cert-cases-tbody` | script.js 5378–5399; `print-certificate-btn` 6883 |
| `setting-tts-default`, `setting-tts-row` | no JS reference found in any `*.js`; CSS only (scope.css 41, 49). Not determined whether another file reads the checkbox |
| `settings-switch-demo-btn`, `uni-Explicit-role-switch-btn` (capital E), `uni-back-home-btn` | script.js (button handlers) |
| `nb8-uni-stu`, `nb8-courses`, `nb8-as-*`, `nb8-progress`, `nb8-advisor`, `nb8-advisor-sum`, `nb8-tab-*`/`nb8-pane-*` | script.js 6271–6454 (phase 8 academic code); tab switch 6415 |
| `uni-prof-kpi-*`, `uni-prof-cohort-tbody` | script.js 6261–6262 (`renderProfessorCohortTables`); `uni-prof-kpi-count` also motion.js 88 |
| `prof-cohort-filter`, `doc-export-csv-btn` | script.js 5502, 6902, 6922 |
| `doc-case-title`, `doc-case-dept`, `doc-patient-*`, `doc-save-case-btn` | script.js 6918 (click handler) |
| `uni-start-case-btn`/`data-uni-start`, `try-open-unpublished-btn` | script.js 6894–6899 |
| `rs-*` | resp.js only (mount/handlers 811–885) |
| `er-*` | er.js only (e.g. `er-who` 605, `er-clock` 146, `er-test` 3050, `er-end` 3736, `er-tab-labs` 4316, `er-rec-list` 4267); `er-feed` is `aria-live` |
| `nb8-legacy-builder` | no JS reference; CSS none. Plain `<details>` |

## Inline code

| Kind | Result |
|---|---|
| Inline `<script>` in range | none (searched `<script` in 1117–1886) |
| Inline `on*` handlers in range | none (0 matches of ` on[a-z]+=`). All behaviour is bound by id/class/`data-*` in the scripts |
| Inline `<style>` / `<link>` | none |
| `style=` attributes (4) | 1170 `z-index: 45` (backdrop); 1171 `z-index: 48` (drawer); 1191 `width: 0%` (progress bar, JS overwrites); 1367 `border:1px solid #DCE5E9;border-radius:.9rem;overflow:hidden` (API box, hidden by scope.css). Only the two z-index values carry layout. |
| `data-*` hooks the scripts depend on | `data-ptab` 1263–1273, `data-uni-start` 1551/1562, `data-nb8-tab` 1590–1594, `data-jump` 1782–1784, `data-who` 1841–1844, `data-side` 1848/1852–1853, `data-stage` 1835 |

## External resources

| Resource | URL | Line |
|---|---|---|
| Link (new tab, `rel="noopener"`) | https://figshare.com/articles/dataset/DDXPlus_Dataset/20043374 | 1827 |
| Link (new tab, `rel="noopener"`) | https://creativecommons.org/licenses/by/4.0/ | 1827 |
| Placeholder text only (not a request) | https://your-proxy.example.com/coach | 1371 |
| Fonts, CDN scripts, `<img>`, `url()` | none in range. Icons are inline `<svg>` (1138, 1400, 1412, 1797, 1857) |

Runtime fetches made by the views (outside the markup): er.js loads `data/er-act.json` (er.js ~4660); resp.js `load()` loads its model data. Not audited here.

## Text that needs care in Razor

| Item | Line | Action |
|---|---|---|
| `@` character | 1501 `rana.m@just.edu.jo` (only `@` in the range) | Razor treats a literal email as an implicit email and leaves it alone in most cases, but write `rana.m@@just.edu.jo` to be safe. The id `cert-email-footer` is overwritten by script.js 5397 anyway |
| `@media`, `@keyframes`, `@import` in inline style | none (no `<style>` in range) | none |
| Tailwind classes with `@`-like or arbitrary values | `h-[calc(100dvh-4.75rem)]` 1118, `bg-[#F8F6F2]` 1145, `w-[340px]` 1171 | no `@`; brackets are safe in Razor |
| `{` `}` in markup | none outside attributes | none |
| HTML comments that must be kept | 1146, 1152, 1202, 1304, 1314, 1324, 1349, 1478, 1736 `Populated by JS` are documentation only. 1736 names `renderProfessorCohortTables()` | may be dropped; keeping them has no effect on layout |
| Comments useful to keep (decisions) | 1292 (phase8 note), 1537, 1539 (legacy cards "kept, hidden by academic8.css"), 1849–1850 and 1866 (owner decision on ER side panel) | keep as Razor comments `@* ... *@` to preserve intent |
| Comment blocks with `====` banners | 1117 area (1111–1116), 1220–1224, 1509–1512, 1763–1765, 1832–1834 | may be dropped from rendered output if "same HTML" allows comment differences; keep if byte-identical output is required |
| `—` and `«»`, `←` | many (e.g. 1436, 1156, 1805) | UTF-8 file; ensure the `.cshtml` is saved UTF-8 |

## Accessibility and RTL notes

- Direction comes from the document (`<html dir="rtl">` is outside the range; not re-checked here). Forced LTR spots: `dir="ltr"` on `coach-api-url` and `coach-api-key` 1371–1372 and on `<small dir="ltr">°C</small>` 1802, 1862.
- Tabs: university portal has proper `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby` (1589–1608, 1678, 1744, 1752); panes use the `hidden` attribute (1608, 1678, 1744, 1752) with `academic8.css:141` forcing `display:none`. The profile tab bar has `role="tablist"` (1261) but its buttons have no `role="tab"` or `aria-selected` and the panes have no `tabpanel` role.
- `aria-live="polite"` on `coach-chat-messages` 1145, `rs-feed` 1786, `er-feed` 1874, `nb8-as-status` 1622.
- Weakness drawer toggle has `aria-expanded="false"` 1137 (script.js must update it); the drawer is `<aside aria-label>` 1171; the backdrop is a bare `div`.
- Several buttons lack accessible names beyond text: `coach-send-btn` fine (text); `rs-send` and `er-send` have text. `coach-chat-input` 1162 has a placeholder but no `aria-label` or `<label>` (`rs-input` and `er-input` do).
- `rs-mode` select has a `<label for>` 1773. Case builder fields have `<label for>` 1640–1666.
- Tables: `th` without `scope` in 1341–1345, 1470–1474, 1726–1732.
- ER room: `er-top` is `<header>` inside a section; `er-p` indicators are decorative `<i>`; `er-rec-x` has `aria-label` 1868.
- English labels (`Vitals`, `Labs`, `HR`, `SpO2`, `NIBP`) inside an Arabic UI: 1852–1853, 1859–1863, 1878.

## Features and reachability

Probe 2026-11 (demo `med_student`): after `nbOpenResp()` the visible set was still the home view (`resp:false`); after `navigateTo('coach')` also `coach:false`; `navigateTo('profile')` gave `profile:true`; `navigateTo('university')` gave `university:true`.

| Block | Status | Evidence |
|---|---|---|
| ER room `view-er` | live | opened by `nbOpenER()` (er.js 4695; callers script.js 6084–6095, 6602, 6625) |
| Profile view | live | `navigateTo('profile')` shows it (probe). Footer link `data-foot-app="profile"` 2291 |
| Profile dashboard pane + tabs + history + certificate pane | live | not hidden by scope.css. `profile-tab-cert-btn` 1270 and `profile-quick-open-cert-btn` 1277 are visible |
| Cert grid cell with `cert-stat-spec` and profile cell with `profile-stat-spec` | dormant (hidden) | scope.css 47–48 `display:none !important` via `:has(> #...)`; probe: computed `display:none` for the parent of `profile-stat-spec` |
| Setting row `setting-tts-row` (checkbox `setting-tts-default`) | dormant | scope.css 41 and 49 |
| `coach-api-box` (API pane) | dormant | scope.css 41; probe: `display:none`. Its handlers script.js 5869–5877 still run |
| Coach view `view-coach` | dormant | `REMOVED_VIEWS` script.js 1678 contains `'coach'`; `navigateTo` 1949 rewrites it to `home`. Entry points also hidden by scope.css 40: `#home-coach-banner`, `#open-coach-view-btn`, `#dash-coach-go`, `[data-foot-app="coach"]`. The footer button 2290 and the 5448/6698 bindings remain in code |
| Respiratory room `view-resp` | dormant | `REMOVED_VIEWS` contains `'resp'` (1678), so `navigateTo('resp')` shows home and returns true; resp.js `open()` (resp.js 862–885) does not show the section itself. `window.nbOpenResp` has no caller in index.html or any script (searched `nbOpenResp`). Probe: stays hidden. Not determined whether a deployment-only path exists |
| University view, professor tabs, assign form, reports, progress, advisor | live | `'university'` is not in `REMOVED_VIEWS` (comment 1676); scope.css 30 says it was re-enabled; probe `university:true` |
| `nb8-uni-stu` (student side) | live | rendered by `nb8RenderAcademic` (script.js 1970, 6271+) |
| `.nb8-legacy` card 1540–1578 (`uni-start-case-btn`, `try-open-unpublished-btn`) | dormant | academic8.css 268 `display:none !important` (scoped to `#uni-student-content`); probe: `display:none`. Handlers script.js 6894–6899 still bind |
| `nb8-legacy-builder` details with `doc-*` form 1631–1674 | live | visible inside the assign pane; handler script.js 6918 saves a custom case. Its own text (1633) says the specialty rooms are closed so the case is not shown to students |
| ER `er-side-tabs`, `er-records` | live | er.js 3050, 4316, 4392; the tabs are hidden on a phone by er.css (not re-read here) |

## Problems

| # | Severity | Problem | Line |
|---|---|---|---|
| 1 | high | `view-resp` and `view-coach` are in `REMOVED_VIEWS` but kept in markup and wired; `resp.js open()` assumes `navigateTo('resp')` shows the view. It does not, so `nbOpenResp()` mounts into a hidden section. The project notes call the respiratory room live; the code does not support that on this build. Decide before migrating | 1766; script.js 1678, 1949; resp.js 862 |
| 2 | high | Visibility is spread over four mechanisms (class `hidden`, `REMOVED_VIEWS`, scope.css `!important` rules incl. `:has()`, academic8.css). Moving a block to a partial does not change this, but a Razor server-side rule would have to reproduce it exactly | scope.css 40–49; academic8.css 268 |
| 3 | medium | ~3 Populated-by-JS shells depend on exact ids and sibling structure (`:has(> #profile-stat-spec)`): a partial that wraps those cells in another element would silently un-hide them | 1245–1256, 1449–1452 |
| 4 | medium | Dead or hidden markup kept: legacy student cards (1540–1578), certificate stat cells, TTS row, API box | 1540, 1367, 1359 |
| 5 | medium | Id with capital letter `uni-Explicit-role-switch-btn` (HTML ids are case-sensitive; a rename breaks script.js and style.css) | 1526 |
| 6 | medium | Hard-coded demo data in markup: certificate serial, date, name, email, "8 جلسات", 86%, 81% (JS overwrites them), `(7)` count in the cohort filter, course codes in the heading | 1424–1455, 1501, 1707, 1712 |
| 7 | low | `profile-pane-overview` has both `hidden` and `grid` classes; display depends on CSS order (Tailwind `hidden` vs `grid`) | 1297 |
| 8 | low | Profile tab buttons lack `role="tab"`/`aria-selected`; `coach-chat-input` lacks a label; `th` without `scope` | 1263, 1162, 1341 |
| 9 | low | `setting-tts-default` has no JS reader in any script, so the setting cannot persist (hidden today) | 1364 |
| 10 | low | Mixed content styles: Tailwind utility classes (coach, profile) next to BEM-like `nb8-*`, `rs-*`, `er-*` classes; three CSS systems for one page | whole range |

## Proposed Razor split

Contiguous, covers 1117–1887, cuts only between sibling `<section>` elements. Each partial starts with its own banner comment (the coach banner at 1111–1116 belongs to the previous cut and is outside this range: move that comment into `_CoachView`). Blank lines 1219, 1508, 1762, 1831 stay with the preceding partial.

| Order | Partial | From–to | What it holds |
|---|---|---|---|
| 1 | `_CoachView.cshtml` | 1117–1219 | `section#view-coach`: header, chat feed, quick strip, input, weakness drawer and backdrop |
| 2 | `_ProfileView.cshtml` | 1220–1508 | `section#view-profile`: header card, tab bar, dashboard, overview, history, settings and certificate panes |
| 3 | `_UniversityView.cshtml` | 1509–1762 | `section#view-university`: banner, student content, professor tabs and five panes |
| 4 | `_RespiratoryRoomView.cshtml` | 1763–1831 | `section#view-resp`: header tools, chat, side cards, about text |
| 5 | `_ErRoomView.cshtml` | 1832–1887 | `section#view-er`: top bar, grid with monitor, records, stage, sheet, debrief mount |

Optional nested partials (element boundaries inside a section, safe if the parent keeps the same wrapper): `_ProfileCertificate.cshtml` 1390–1505 (the `profile-pane-certificate` div; keep `printable-certificate-area` and print classes), `_UniversityProfessorPanes.cshtml` 1582–1759 (`uni-doctor-content`), `_UniversityLegacyStudentCards.cshtml` 1539–1578.

## Open questions

1. Should `view-resp` and `view-coach` stay in the page (dormant) or be dropped in the Razor version? Today they are unreachable and the notes describe resp as live.
2. Is a byte-identical HTML needed, including comments and CRLF line endings, or only the same DOM?
3. Does any file outside the repo (the two serverless functions, deployment scripts) open the respiratory room or read `setting-tts-default`? Not determined from the checkout.
4. Are the Populated-by-JS shells (e.g. `coach-chat-messages`, `nb8-*` panes) to be rendered server-side later, or stay JS-rendered? This decides whether the demo values in 1424–1455 stay in markup.
5. Which parts of er.css and resp.css hide `er-side-tabs` on phones and `.rs-new-tag`? Not read in this part.
6. Is the ID `uni-Explicit-role-switch-btn` allowed to be renamed (needs the script.js and style.css change in the same step)?
