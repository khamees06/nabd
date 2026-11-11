# motion.js — source fragments

The browser receives these files joined in the order below as `/js/motion.js`, between `_open.txt` (the file header and the opening of the wrapper function) and `_close.txt` (its closing line).
The code is the legacy `motion.js`, cut at statement boundaries and otherwise unchanged; `LegacySiteBaselineTests` fails if the joined text differs from the legacy file by anything not listed in `tests/Nabd.Tests/LegacyBaseline/seams.json`.

The "layer" column says where each responsibility belongs in the layered design; it is the map for moving code out of the browser, one fragment at a time.

| file | legacy lines | layer | responsibility |
|---|---|---|---|
| 010-prefs-reveal-count.js | 7–128 | presentation | media queries, hero split, scroll reveals, count-up |
| 020-view-chrome.js | 129–193 | presentation | progress bar, sweep, view change, nursing chat fit, parallax |
| 030-ecg-model.js | 194–233 | domain | RANGES, helpers, ecgBeat, plethBeat, gauss |
| 040-audio.js | 234–279 | browser | shared AudioContext, wake-up, beep |
| 050-monitor.js | 280–550 | application | makeMonitor: canvas loop, HR rewrite, alarms, tile help |
| 060-monitor-adapters.js | 551–610 | application | enhanceMonitors adapters for four rooms |
| 070-boot.js | 611–650 | presentation | boot and main MutationObserver |
