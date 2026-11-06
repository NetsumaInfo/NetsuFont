# Status

## Decisions

- **A separate app, on the model of NetsuIcon.** A font is a set of glyphs that must agree, with spacing, kerning and a file format of its own: another trade than an animated icon. The architecture is the same: a pure `core`, small validated ops, a local MCP server, a read-only app that follows the files.
- **Our own JSON document, not UFO.** One `.nfont.json` per font, small enough for an agent to read in parts. Outlines are SVG path data in font units, y up: agents write SVG paths well. A UFO export can come later.
- **OTF with CFF outlines through opentype.js (MIT).** It runs in the browser too, so the app proofs text with the real compiled font. opentype.js writes no kerning: `core/src/sfnt.ts` adds a legacy `kern` table.
- **Components are flattened on export.** CFF has no components in opentype.js; the document keeps them so that accents follow their base letter.
- **Shapes, not only paths.** An agent builds a glyph from rect, ellipse, ring, arc, line and polygon; core turns them into a path, each contour the right way. The document still holds plain paths.
- **Languages are counted.** 62 languages in Latin, Greek, Cyrillic, Armenian, Georgian, Hebrew, Arabic, Devanagari, Thai and Lao script, each with its list of characters; an Arabic language also counts its joining forms and lam-alef, a Devanagari one its half forms, reph, ra below and two conjuncts. `compose` makes accented letters from base and marks, Greek and Cyrillic letters shaped as Latin ones, and Arabic letters from skeleton and dots with all their forms. Bengali, Tamil and the other Indic scripts, Khmer, Myanmar and CJK are said to be unsupported.
- **Features come from glyph names** (2026-11-06). `uni0628.init` is the initial form of beh, `f_i` a ligature, `a.ss01` a stylistic set, `g.alt` an alternate. `core/src/features.ts` reads the rules once; the export writes them as GSUB through opentype.js, and `proof` applies the same rules. No separate feature file for the agent to keep in step.
- **Marks are placed by anchors computed from the ink** (2026-11-06). A glyph that draws a combining character with advance 0 is a mark; `core/src/marks.ts` gives it an anchor (the bottom of an above mark, the top of a below one) and every letter one (the top and bottom of its ink). `core/src/gpos.ts` writes GDEF and GPOS (mark, mkmk) by hand: opentype.js writes neither. No anchor is drawn by the agent.
- **Devanagari features from names**: `.half`, `uni0930.rphf`, `uni0930.blwf`, conjuncts by their parts (akhn), under the `dev2` script tag. The browser reorders the syllable itself; `core/src/indic.ts` does the same for `proof`.
- **A model font for a script the agent does not know** (2026-11-06). The blind Hindi run showed that an agent draws Devanagari from memory badly. `import_font` reads .ttc collections (Nirmala UI on Windows), and `remove_font` takes the model out again (to `fonts/.trash`, git-ignored). The skill says to look at the model and never copy its paths.
- **Our own shaping for `proof`.** `core/src/shape.ts` does a simple bidi (levels, no explicit embeddings), Arabic joining, ligatures and the optional features; marks sit on the anchors the GPOS has. The app's text view is set by the browser with the real OTF.
- **The guide holds the format, the skill the method.** `server/src/guide.ts` is what every agent pays for; `skills/netsu-type-design` is loaded when a font is drawn.
- **No GPL tool.** FontForge and Fontra are GPL; fontTools (MIT) may later be called from the server for TTF, WOFF2 and GPOS.

## Verified

- `pnpm check` and `pnpm test` pass: 46 tests in core, 4 on the MCP tools.
- Every recipe in `skills/netsu-type-design/references/construction.md` was drawn and set in `proof` (2026-10-25).
- A blind run: a Sonnet agent with only the skill drew Galet (fr, pl complete; a–z, A–Z, figures, punctuation, 76 kerning pairs) and exported it, in about 95 calls. A second run on the corrected skill drew Rivet (en, ru, el complete, 230 glyphs, 90 kerning pairs) in about 61 calls. The findings of both runs were fixed; the text corrected after the second has not run blind. Details in NetsuSkills `docs/JOURNAL.md`.
- Netsu Pixel covers en, fr, es, de, nl, its accents placed by `compose`.
- An exported OTF reads back with its family, metrics, advances, outlines and kerning (test in `core/src/core.test.ts`).
- The example font was drawn through the tools (`seed`), exported (12 112 bytes), and set as text in the app by Chrome from the compiled OTF.

## Not verified

- That the exported OTF installs and works in Windows, macOS, Word or Figma. Not tried yet.
- That Chrome and the other engines apply the `kern` table of a CFF font. The proof picture of the tools applies the kerning itself; the app's text proof relies on the browser.
- Blind runs of 2026-11-06 (Sonnet, the skill alone, through the shell form of the tools):
  - Sahra, Kufi Arabic with Latin: ar 150/150, en 81/81, 249 glyphs, 63 pairs, 44 calls, no check left. Readable; the ع forms weakest.
  - Deva Sans, rounded Hindi with Latin: hi 111/111, en 81/81, 183 glyphs, 61 pairs, 56 calls. The Devanagari letters were guessed from memory and are hard to read: the skill now has the agent look at a model font first (`import_font`, then `remove_font`), with proportions measured in Nirmala UI and Noto Kufi Arabic.
  - Fixed after them: a round end was a disc of its own and the check took it for a filled hole; `list_fonts` printed every glyph of every font; `languages` did not name the skeletons `compose` needs; `proof` did not say how much of a cut line fits; a .ttc could not be imported.
- Hebrew, Vietnamese, Armenian, Georgian, Thai drawn by an agent with only the skill: no blind run yet. Greek and Cyrillic were drawn once (Rivet).
- Arabic, verified 2026-11-06 on a monoline test font drawn through the tools (35 skeleton glyphs, 9 letters composed with their forms): Chrome sets the exported OTF right to left with its joining forms, lam-alef and `ss01`; `proof` sets the same words in the same order. Not verified: Windows apps, Word, Persian and Urdu text, lam-alef with a harakat between (the ligature skips marks now; not tried in a browser).
- Kerning in right-to-left text: `proof` reads a pair in reading order; that browsers do the same with the `kern` table is not verified.
- Marks and Devanagari, verified 2026-11-06 on a test font drawn through the tools: Chrome sets कि क्ष र्क क्क क्र के कु कं, กิ่ ป่ กุ, שׁ בּ אַ and رَ رِ as `proof` does (reordered i, conjunct, reph, half form, ra below, tone on the vowel, dagesh, shin dot, patah, fatha, kasra). Not verified: Windows apps, Word, longer Hindi text, Lao, Marathi ळ.
- Armenian, Georgian and the new Latin and Cyrillic languages: counted only; no font draws them yet.

## Next

1. Install Galet and Rivet in Windows and try them in an app.
2. A blind run with Arabic in the brief, then one with Vietnamese or Hebrew.
3. Bengali and the other Indic scripts (split vowels, several pre-base signs), then Khmer and Myanmar.
4. Style rules for a font and a `lint` of the glyphs that depart from them (stem width, overshoot, side bearings).
5. TTF and WOFF2 export, GPOS kerning (fontTools from the server, or our own writer).
6. Weights and a family: one style per document, or masters and interpolation.
