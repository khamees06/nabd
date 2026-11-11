# terms.js — source fragments

The browser receives these files joined in the order below as `/js/terms.js`, between `_open.txt` (the file header and the opening of the wrapper function) and `_close.txt` (its closing line).
The code is the legacy `terms.js`, cut at statement boundaries and otherwise unchanged; `LegacySiteBaselineTests` fails if the joined text differs from the legacy file by anything not listed in `tests/Nabd.Tests/LegacyBaseline/seams.json`.

The "layer" column says where each responsibility belongs in the layered design; it is the map for moving code out of the browser, one fragment at a time.

| file | legacy lines | layer | responsibility |
|---|---|---|---|
| 010-vocabulary.js | 10–49 | domain | TERMS table |
| 020-translate.js | 50–110 | presentation | regex, skip list, translate, walk |
| 030-boot.js | 111–126 | browser | boot and body observer |
