# 0003 — Razor views reproduce the legacy page exactly

Status: accepted · 2026-11-11

## Context

The legacy page is one 2,318-line `index.html` holding every view of a single-page application; the client shows
one view at a time. The interface is frozen, and the client finds its elements by id, so the HTML the browser
receives must not change.

## Decision

- `Views/Shared/_Layout.cshtml` holds the document frame (head, headers, drawer, modals, footer, script tags);
  `Views/Home/Index.cshtml` holds the views. Both are composed of partial views, 43 in all, grouped by feature
  (`Landing/`, `Dashboard/`, `Training/`, `Coach/`, `Profile/`, `University/`, `Rooms/`, `Layout/`, `Modals/`).
- A partial view is a contiguous range of legacy lines, cut at element boundaries. A composing file holds legacy
  lines and one `@await Html.PartialAsync(...)` per line. **No view file ends with a line feed**: the line feed
  after each call is the one the legacy text had at that place, so the composed output equals the legacy text.
- No tag helpers are imported and no Razor expressions are used inside the legacy markup. The four `@` characters
  of the legacy page sit between word characters (e-mail addresses, a font URL), which Razor leaves alone.
- The split is recorded in `tools/migration/split-plan.json` and was performed by `tools/migration/split-legacy.mjs`.

## Consequences

- `The_page_is_the_legacy_page` compares the rendered page with the legacy file character for character.
- An editor that adds a final line feed to a partial view adds a blank line to the page and fails that test.
  `.editorconfig` tells editors not to.
- Views carry no logic yet. When a view starts to take data from the server, it becomes a registered difference
  like any other.
