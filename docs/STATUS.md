# Status

## Decisions

- **A separate app, on the model of NetsuIcon.** A font is a set of glyphs that must agree, with spacing, kerning and a file format of its own: another trade than an animated icon. The architecture is the same: a pure `core`, small validated ops, a local MCP server, a read-only app that follows the files.
- **Our own JSON document, not UFO.** One `.nfont.json` per font, small enough for an agent to read in parts. Outlines are SVG path data in font units, y up: agents write SVG paths well. A UFO export can come later.
- **OTF with CFF outlines through opentype.js (MIT).** It runs in the browser too, so the app proofs text with the real compiled font. opentype.js writes no kerning: `core/src/sfnt.ts` adds a legacy `kern` table.
- **Components are flattened on export.** CFF has no components in opentype.js; the document keeps them so that accents follow their base letter.
- **Shapes, not only paths.** An agent builds a glyph from rect, ellipse, ring, arc, line and polygon; core turns them into a path, each contour the right way. The document still holds plain paths.
- **Languages are counted.** 23 languages, each with its list of characters. `compose` makes accented letters from base and marks, and Greek and Cyrillic letters shaped as Latin ones. Scripts that need GSUB (Arabic, Indic, Thai) are said to be unsupported.
- **The guide holds the format, the skill the method.** `server/src/guide.ts` is what every agent pays for; `skills/netsu-type-design` is loaded when a font is drawn.
- **No GPL tool.** FontForge and Fontra are GPL; fontTools (MIT) may later be called from the server for TTF, WOFF2 and GPOS.

## Verified

- `pnpm check` and `pnpm test` pass: 32 tests in core, 3 on the MCP tools.
- Every recipe in `skills/netsu-type-design/references/construction.md` was drawn and set in `proof` (2026-10-25).
- A blind run: a Sonnet agent with only the skill drew Galet (fr, pl complete; a–z, A–Z, figures, punctuation, 76 kerning pairs) and exported it, in about 95 calls. A second run on the corrected skill drew Rivet (en, ru, el complete, 230 glyphs, 90 kerning pairs) in about 61 calls. The findings of both runs were fixed; the text corrected after the second has not run blind. Details in NetsuSkills `docs/JOURNAL.md`.
- Netsu Pixel covers en, fr, es, de, nl, its accents placed by `compose`.
- An exported OTF reads back with its family, metrics, advances, outlines and kerning (test in `core/src/core.test.ts`).
- The example font was drawn through the tools (`seed`), exported (12 112 bytes), and set as text in the app by Chrome from the compiled OTF.

## Not verified

- That the exported OTF installs and works in Windows, macOS, Word or Figma. Not tried yet.
- That Chrome and the other engines apply the `kern` table of a CFF font. The proof picture of the tools applies the kerning itself; the app's text proof relies on the browser.
- Hebrew and Vietnamese drawn by an agent: no run has drawn them. Greek and Cyrillic were drawn once (Rivet).
- Hebrew in the app's text view (right to left): not looked at.

## Next

1. Install Galet and Rivet in Windows and try them in an app.
2. A blind run with Vietnamese or Hebrew in the brief.
3. Style rules for a font and a `lint` of the glyphs that depart from them (stem width, overshoot, side bearings).
4. TTF and WOFF2 export, GPOS kerning (fontTools from the server, or our own writer).
5. Weights and a family: one style per document, or masters and interpolation.
