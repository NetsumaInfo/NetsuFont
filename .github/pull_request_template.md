## What changes

<!-- The problem, then the solution. If an issue exists: "Fixes #123". -->

## Why

<!-- What led to this choice, and the trade-offs if any. -->

## Checks actually run

<!-- Tick what you REALLY ran. A box ticked wrongly costs more than an empty one:
     it makes the layer look covered. -->

- [ ] `pnpm check` (types everywhere, same keys in every locale)
- [ ] `pnpm test` (core and MCP tools)
- [ ] Tried in the running app (`pnpm dev`)
- [ ] For a change to the guide or the skill: run by an agent that had only the skill and the tools

## What could not be tested

<!-- Be explicit. A font judged on single glyphs has not been tried as text;
     an export never installed has not been tried. Say so. -->

## Screenshots

<!-- Required for any visual change. For a font: the text you set, and in which app or browser. -->

---

- [ ] Code, comments, docs, commits and pull request title in English
- [ ] One change per pull request (refactor and behaviour change apart)
- [ ] A change to the format or to an operation updates `server/src/guide.ts` in this pull request
- [ ] No visible text hard-coded: keys added to every locale under `app/src/locales/`
- [ ] The example font changed through the tools only
