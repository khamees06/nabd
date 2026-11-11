# ui.js — source fragments

The browser receives these files joined in the order below as `/js/ui.js`, between `_open.txt` (the file header and the opening of the wrapper function) and `_close.txt` (its closing line).
The code is the legacy `ui.js`, cut at statement boundaries and otherwise unchanged; `ClientBundleBaselineTests` fails if the joined text differs from the legacy file by anything not listed in `tests/Nabd.Tests/LegacyBaseline/seams.json`.

The "layer" column says where each responsibility belongs in the layered design; it is the map for moving code out of the browser, one fragment at a time.

| file | legacy lines | layer | responsibility |
|---|---|---|---|
| 010-drawer-sync.js | 7–53 | presentation | whole ui.js: drawer user card and current-view mark |
