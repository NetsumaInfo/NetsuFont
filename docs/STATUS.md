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
- **An imported font keeps its forms by name** (2026-11-08). `core/src/featureNames.ts` reads the GSUB of the file (extension lookups included) and renames the glyphs it makes to the names features are read from: `uni0628.init`, `uni0915.half`, `uni0930.rphf`, `uni0915_uni094D_uni0937`; the letters first get their usual names. Verified on Nirmala UI: half forms, reph, क्ष and ज्ञ found; its ra below was not. `look_glyphs {glyphs, model}` shows a model's conjunct even before the agent draws one.
- **The accents of the Bible** (2026-11-08). `hbo` counts the letters, the points, the te'amim U+0591–U+05AF, maqaf, paseq and sof pasuq. Most accents sit above or below their letter; pashta, zarqa and telisha qetana go past its left edge, telisha gedola past its right, yetiv and dehi below and right (`aboveLeft`, `aboveRight`, `belowRight` in `core/src/marks.ts`). Drawn on a test font: `proof` sets Genesis 1:1 with its points and accents. In Chrome the side accents fall back to centred (above).
- **Japanese from strokes** (2026-11-10). Kanji are too many to draw one by one: `draw_kanji` reads KanjiVG (the centre line of every stroke of 6,703 characters) and draws each stroke with a pen of the font (width, ends, contrast along an angle), one outline per stroke (`core/src/kanji.ts`). KanjiVG is CC BY-SA 3.0: it is downloaded by `pnpm --filter @netsufont/server kanjivg` into `~/.netsufont/kanjivg`, never into the repository, and a font made with it is CC BY-SA. The lists of kanji come from Unihan (kJoyoKanji, kJinmeiyoKanji; Unicode License). `ja` counts the kana, the punctuation and the 2,136 jōyō (2,140 code points). Verified: the 2,140 jōyō and 176 kana drawn in one call each (7 s), a font file of 3.7 MB and an OTF of 1.7 MB; `proof` and Chrome set Japanese text with it. Not verified: an agent with only the skill, vertical writing, Windows apps. The app is slow with a font this size: it compiles the whole OTF at every change.
- **Our own shaping for `proof`.** `core/src/shape.ts` does a simple bidi (levels, no explicit embeddings), Arabic joining, ligatures and the optional features; marks sit on the anchors the GPOS has. The app's text view is set by the browser with the real OTF.
- **The guide holds the format, the skill the method.** `server/src/guide.ts` is what every agent pays for; `skills/netsu-type-design` is loaded when a font is drawn.
- **No GPL tool.** FontForge and Fontra are GPL; fontTools (MIT) may later be called from the server for TTF, WOFF2 and GPOS.

## Verified

- `pnpm check` and `pnpm test` pass: 53 tests in core, 5 on the MCP tools.
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
- Three more Hindi blind runs (2026-11-06 to 2026-11-08), each with the skill corrected after the one before:
  - Kiran, with a model looked at twice: hi complete, the Devanagari still unreadable.
  - Prakash, with the model under its glyphs: unreadable; the agent's dark strokes hid the model.
  - Usha, with the model outlined over its glyphs, Devanagari metrics and two passes per family asked: 68 calls; most consonants right (ग च द र व ब ट ठ ड ढ ह प ण), words read from context; the conjuncts क्ष ज्ञ श्र wrong, because the model had lost them. Since then `import_font` keeps them (below). No run has been made since that change.
  - Varsha (2026-11-08), with the conjuncts and half forms traced by name on the model: about 118 calls, past the budget. Most consonants right; reph and ra below right (सर्वनाश, श्रीराम); common words read (के, रावण का, हिंदी, भगवान). Still weak: ज स श भ ल and the conjunct क्ष; not comfortable to read yet. The skill now gives the stem's place, the model's units and the half forms of क ख फ.
- Hebrew, Vietnamese, Armenian, Georgian, Thai drawn by an agent with only the skill: no blind run yet. Greek and Cyrillic were drawn once (Rivet).
- Arabic, verified 2026-11-06 on a monoline test font drawn through the tools (35 skeleton glyphs, 9 letters composed with their forms): Chrome sets the exported OTF right to left with its joining forms, lam-alef and `ss01`; `proof` sets the same words in the same order. Not verified: Windows apps, Word, Persian and Urdu text, lam-alef with a harakat between (the ligature skips marks now; not tried in a browser).
- Kerning in right-to-left text: `proof` reads a pair in reading order; that browsers do the same with the `kern` table is not verified.
- Devanagari in Chrome, verified 2026-11-06 on a test font drawn through the tools: the reordered i, the conjunct, the reph, the half form and the ra below come out as in `proof` (GSUB).
- **Marks and the Hebrew shaper** (found and fixed 2026-11-08). HarfBuzz (Chrome, Android) reads GPOS for Hebrew only under the `hebr` script; our GPOS had DFLT alone, so HarfBuzz set the marks by its own fallback, and the earlier pictures that matched `proof` matched only because the fallback also centres marks. `gpos.ts` now writes a script record for DFLT and every script the font draws (`scriptTags`). Verified with uharfbuzz on the Hebrew test font (`zz-hebrew`): with the GPOS the points, dagesh, shin dot, holam, pashta (past the left edge) and the accents below (stacked under the point) move as the anchors say, and moving an anchor moves the mark; without it they fall back to the centre. No mark touches another in Bereshit 1:1. Not tried: Chrome after the fix, Windows apps. The other scripts' shapers read DFLT already; they get their own record too.
- Armenian, Georgian and the new Latin and Cyrillic languages: counted only; no font draws them yet.

## Next

1. Install Galet and Rivet in Windows and try them in an app.
2. A blind run with Arabic in the brief, then one with Vietnamese or Hebrew.
3. Bengali and the other Indic scripts (split vowels, several pre-base signs), then Khmer and Myanmar.
4. Style rules for a font and a `lint` of the glyphs that depart from them (stem width, overshoot, side bearings).
5. TTF and WOFF2 export, GPOS kerning (fontTools from the server, or our own writer).
6. Weights and a family: one style per document, or masters and interpolation.
