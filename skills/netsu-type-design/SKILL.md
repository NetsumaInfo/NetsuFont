---
name: netsu-type-design
description: Use when the user asks to create, draw, design or redesign a font, typeface, alphabet or set of letters in NetsuFont (the netsufont MCP server), from a style brief or from an imported TTF or OTF — including spacing, kerning, accents and other languages (French, Polish, Vietnamese, Greek, Cyrillic, Hebrew…) and exporting the .otf. Do NOT use for choosing or pairing existing fonts for a site, for logos and wordmarks (netsu-app-icon), or for animated icons (netsu-icon-motion).
---

# NetsuTypeDesign

Turn a brief into numbers, prove them on four letters, let the user choose, then build the
font family by family, space it, cover its languages, kern it and export it.

## Requirements

- The `netsufont` MCP server. Call `list_fonts` first; if it fails, stop and say so (NetsuFont
  starts with `pnpm dev` in its folder). With a shell and no MCP connection, the same tools:
  `pnpm -s --filter @netsufont/server mcp <tool> '@args.json' [image.png]`, from that folder.
  Always write the arguments to a file first: inline JSON breaks on quotes, `&` and newlines.
- Its `guide` holds the format, the ops and the shapes. Read it once. This page does not repeat it.

## Procedure

1. **Brief.** Name, use (text at 9–16 px, or display), languages, 3 to 5 adjectives, what to
   avoid. Missing: ask at most five questions in one message, or none and write your
   assumptions. Languages unsaid: the user's own and English. Write it with the template below.
   Changing a font: `import_font`, then the brief says what changes and what stays.

2. **Style sheet in numbers**, before any glyph. Load `references/construction.md`: it turns
   the adjectives into stems, contrast, widths, x-height and terminals. Write the sheet with the
   template; every later glyph takes its numbers from it, never new ones.

3. **Control glyphs.** One `edit_font` that draws H, O, n, o and v with `shapes` from the
   recipes of `construction.md`, scaled to the sheet. Then `look_glyphs {chars:"HOnov"}` and
   `proof {text:"HOHOHOH nonnonon vovovo"}`. Fix until:
   1. O looks as heavy as H, o as n: round strokes a little thicker than straight ones.
   2. o and n look the same height: o overshoots above and below.
   3. The rhythm of "nonnonon" is even: no pair looks closer than another.
   4. `edit_font` reports no check.

4. **Checkpoint.** The user watches the app. Say what to look at (font id, the five glyphs),
   the style in one line, the risk you see. Stop and wait for "go" or a change. Go on without
   asking only when the user said not to check in ("choose for me" counts).

5. **Families.** Build in this order, one `edit_font` per family, each from glyphs already
   drawn (`copy_glyph`, then change the copy; or the same shapes with the sheet's numbers):

   | Family | From |
   |---|---|
   | n h m u r i j l | n stem and arch; m = two arches; u = n turned |
   | o c e | o ring; c and e are arcs of the same ring |
   | b d p q | o bowl + n stem, up to the ascender or down to the descender |
   | a g s t f | o bowl; s and the hooks of f t take the curve of c |
   | v w y x k z | v strokes, same angle and width |
   | H I L E F T | H stems and bar |
   | O C G Q D | O ring |
   | B P R | H stem + bowls of half the cap height |
   | A V W X Y K M N Z | the strokes of v at cap height |
   | J U S | U = H stems + the bottom of O |
   | 0–9 | the width of n, the height of caps or a little less |
   | . , : ; ! ? ' " - ( ) / & @ | dots as wide as the stem |

   After each family: `look_glyphs` of the family with H, n, o beside it. Fix in the same
   family before the next one.

6. **Spacing.** Set H, O, n, o from `construction.md` §Spacing, then every glyph by its sides:
   a straight side takes the H (or n) value, a round side the O (or o) value, an open or
   diagonal side a quarter of the straight one. One `edit_font` of `set_spacing` per family,
   then one `proof` per family (or several families in one) with a line per glyph x: `"nnxnn ooxoo
nnynn ooyoo"`. Each x
   sits in the rhythm, not in a hole. Figures: `center` them all in one advance.

7. **Languages.** `languages {languages:[...the brief's codes]}`. Load
   `references/languages.md` before drawing marks or letters of another script. Draw the marks,
   then one `compose` with every letter it can make, then draw what is left. Check with one
   `proof` of the brief's pangrams, a line each, sizes `[48, 18]`.

8. **Kerning.** `proof` the pairs of `construction.md` §Kerning. Kern only what looks wrong
   after spacing; a first release needs 40 to 150 pairs, never a pair for every combination.

9. **Deliver.** `list_fonts`: no check left unexplained. `proof` a paragraph at 48, 18 and 12.
   `export_font`, give the path, say how to install it (Windows: right click, Install), and
   what was not verified (an app the font was not tried in).

## Budget

Control glyphs: 1 create, 1 to 3 edits, 2 looks. Each of the 12 families: 1 edit, 1 look, 1 fix
at most. Spacing: one edit and one proof per family. Languages: 1 call, 2 to 4 edits, 1 proof.
Each new script (Greek, Cyrillic): 3 to 5 edits and 2 proofs more. Kerning: 2 proofs, 2 edits.
About 90 calls for a Latin font with two languages; past 110, say why.

## Brief template

```
Font:       Brume — a quiet humanist sans for reading on screens
Use:        text, 12–18 px; titles too
Languages:  fr, en, es, pl
Adjectives: calm, open, warm, legible
Avoid:      geometric circles (Futura look); tight apertures
Assumed:    one weight, Regular; no italic yet
```

## Style sheet template

```
Genre:      humanist sans          Width: H advance 700, n 580
x-height:   500 (0.71 of caps)     Caps: 700   Ascender: 750   Descender: -200
Stems:      H 90, n 86             Horizontals: 80 (H bar, E arms)   Round: O 96/82, o 92/78
Contrast:   low (horizontals 0.9 of verticals)
Terminals:  flat, cut at 0°        Corners: sharp      Overshoot: caps 12, lowercase 10
Spacing:    H 80/80  O 60/60  n 75/75  o 50/50
```

## Example

Brief: Brume, above. Control glyphs from the recipes, measured after one `edit_font`
(2026-10-25): H 700 [80 80], O 760 [60 60], n 580 [75 75], o 580 [50 50], v 560 [34 34], no
check. `proof` "HOnocevasbA Hanson Abbe seven": even colour, the s a touch light — its
strokes were set to 84/72, under the sheet's 86/76; raised in the s family step.

Two blind runs (Sonnet, the skill alone, 2026-10-25). Galet, a soft round sans for fr and pl:
fr 113/113, pl 101/101, 76 kerning pairs, about 95 calls. Rivet, a condensed grotesque for en, ru
and el: 230 glyphs, en 82/82, ru 93/93, el 91/91, 90 pairs, about 61 calls. Both even in colour
and legible at 12 px; the weakest were & 2 @ and the Greek ζ ξ ς.

## Anti-patterns

| ❌ Default behaviour | ✅ What we want |
|---|---|
| Glyphs drawn one by one, each with new numbers | A style sheet first; every glyph takes its numbers |
| Paths typed point by point for every curve | `shapes` from the recipes, `copy_glyph` within a family |
| O as thick as H by the numbers, so it looks light | Round strokes 5 to 8% thicker than straight ones |
| o exactly from 0 to the x-height, so it looks short | Overshoot: 10 to 12 units above and below |
| Spacing judged on one glyph in `look_glyphs` | Spacing judged in words with `proof` |
| Every pair kerned "just in case" | Space first, kern the few pairs still wrong |
| Accented letters drawn whole, each a little different | Marks drawn once, letters made with `compose` |
| "Supports Polish" because ą ę exist | `languages` reports the language complete, and its pangram is proofed |
| Arabic or Hindi promised | Said plainly: not possible yet (the guide's languages answer says why) |
| The imported font kept under its own name | `set_info` with a new family name: OFL fonts reserve theirs |

## References

- `references/construction.md` — steps 2, 3, 6 and 8: from adjectives to numbers, verified
  shape recipes, optical corrections, spacing values, pairs to kern.
- `references/languages.md` — step 7: drawing marks, letters of each language and script,
  pangrams for proof.
