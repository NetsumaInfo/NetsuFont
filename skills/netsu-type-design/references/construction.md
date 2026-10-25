# Construction

Numbers for an em of 1000. Every recipe below was drawn with `edit_font` and set in `proof`
on 2026-10-25; the advances and side bearings given are what `edit_font` answered.

## 1. From adjectives to the style sheet

Start from the Regular sans column, then move the numbers the adjectives ask for.

| Measure | Regular sans | Moves |
|---|---|---|
| H stem | 90 | light 40–60 · bold 140–180 · black 200+ |
| n stem | 0.95 × H stem | — |
| Horizontals (H bar, E arms, o top) | 0.9 × stem | high contrast 0.3–0.6 × stem (didone, elegant) |
| O sides / top | 1.07 × stem / 0.92 × stem | geometric: equal; humanist: as given |
| x-height | 500 (0.71 of caps) | readable at small sizes 520–560 · elegant, old-style 430–470 |
| H advance | 700 | condensed 520–600 · extended 820–900 |
| n advance | 580 | follows H in the same ratio |
| Overshoot | caps 12, lowercase 10 | bold: 15 |
| Terminals | flat | soft, friendly: round (§3) · technical: flat, cut level |
| Serifs | none | classic, literary: bracket-less slab §3 · strong, typewriter: slab as thick as the stem |

- calm, quiet → low contrast, open c e s, even widths.
- warm, human → humanist: o a little narrower than a circle, s and c open, slight contrast.
- precise, technical → geometric or grotesque: equal round sides, flat terminals, tighter spacing.
- playful → larger x-height, round terminals, bowls a little wider than the stems suggest.
- monospaced → every advance 600 (letters, figures, signs); i l j get serifs or slabs to fill the cell.

## 2. Recipes (shapes, Regular sans of the table)

Paste, then scale to your sheet: change the stems, keep the structure.

```json
{"op":"set_glyph","glyph":"H","unicode":72,"advance":700,"shapes":[
  {"type":"rect","x":80,"y":0,"w":90,"h":700},{"type":"rect","x":530,"y":0,"w":90,"h":700},
  {"type":"rect","x":170,"y":310,"w":360,"h":80}]}
{"op":"set_glyph","glyph":"O","unicode":79,"advance":760,"shapes":[
  {"type":"ring","cx":380,"cy":350,"rx":320,"ry":362,"stroke":96,"strokeY":82}]}
{"op":"set_glyph","glyph":"n","unicode":110,"advance":580,"shapes":[
  {"type":"rect","x":75,"y":0,"w":86,"h":500},{"type":"rect","x":419,"y":0,"w":86,"h":290},
  {"type":"arc","cx":290,"cy":290,"rx":215,"ry":220,"stroke":86,"strokeY":76,"from":0,"to":180}]}
{"op":"set_glyph","glyph":"o","unicode":111,"advance":580,"shapes":[
  {"type":"ring","cx":290,"cy":250,"rx":240,"ry":260,"stroke":92,"strokeY":78}]}
{"op":"set_glyph","glyph":"v","unicode":118,"advance":560,"shapes":[
  {"type":"line","x1":80,"y1":500,"x2":280,"y2":0,"width":86,"ends":"flat"},
  {"type":"line","x1":480,"y1":500,"x2":280,"y2":0,"width":86,"ends":"flat"}]}
```

Answered: H 700 [80 80], O 760 [60 60], n 580 [75 75], o 580 [50 50], v 560 [34 34].

The others, same numbers:

| Glyph | Shapes |
|---|---|
| c 540 | arc of the o ring, `from` 45 `to` 315 |
| e 580 | arc of the o ring, 0 to 325, + rect x 60 y 215 w 460 h 72 (the bar) |
| a 580 | ring cx 270 rx 220 (else as o) + rect x 410 w 86 h 500 (a single-storey a) |
| b / d 580 | ring cx 310 / 270, rx 220 + rect x 84 / 410, w 86, h 750 (to the ascender) |
| p / q | b / d with the stem from y −200 to 500 |
| u 580 | rect x 75 y 210 h 290 + rect x 419 h 500 + arc cy 210, 180 to 360 (the n turned) |
| m 880 | rects x 75 (h 500), 397 and 719 (h 330) + two arcs cx 279 and 601, rx 204 ry 180, 0 to 180 |
| s 500 | arc cx 250 cy 362, 20 to 270 + arc cx 250 cy 138, 200 to 450; both rx 175 ry 148, stroke 86 strokeY 74. The spine is smooth only when the bottom band of the upper arc is the top band of the lower: ry = (x-height + 2 × overshoot + strokeY) / 4, cy = top − ry and bottom + ry. S, 3, з, ε the same way |
| t 360 | rect x 90 y 120 w 86 h 530 + bar rect x 20 y 424 w 300 h 76 + arc cx 226 cy 120 rx 136 ry 130, 180 to 290 |
| i 260 | rect x 87 w 86 h 500 + ellipse cx 130 cy 640 r 52 (the dot, a little wider than the stem) |
| A 700 | lines (350,700)→(75,0) and (350,700)→(625,0), width 92, flat + bar rect x 170 y 180 w 360 h 76 |
| E 600 | stem rect x 80 w 90 + arms y 0 (w 370), y 620 (w 350), middle y 320 (w 310): the bottom arm longest, the middle shortest |

A ring's `strokeY` thinner than `stroke` gives the slight contrast of the table. An arc whose
end meets a stem (n, m, u) overlaps it: overlaps add, they are never a problem.

## 3. Variants

- **Round terminals**: `"ends":"round"` on a line or an arc puts a half disc past each end
  (c: the arc of the table with round ends, answered c 540 [50 67]; x: two lines (110,40)→(430,460)
  and (430,40)→(110,460), width 84, round, answered x 540 [68 68]). A stem drawn as a rect ends
  with an ellipse as wide as the stem, the rect shortened by its radius: l = rect x 87 y 43 w 86
  h 664 + ellipses cx 130, cy 43 and 707, r 43, answered l 260 [87 87].
- **Flat ends** on a slanted line are wider than `width` (by 1/cos of the slant): for a stroke
  that must look as thick as the stems, give the diagonal `width` 0.95 × stem and check in `look_glyphs`.
- **Slab serifs**: rects as wide as 3 stems, as high as 0.55 stem, at the foot and the top. I:
  stem x 135 w 90 + rects x 40 w 280 h 50 at y 0 and y 650. Answered I 360 [40 40].
- **Italic**: draw upright, then `transform {slant: 10–12}` on every glyph; o and e of a true
  italic are narrower: `scale [0.95, 1]` before. Space again after.
- **Pixel**: one rect per run of pixels in a row; pixel 100; spacing half a pixel each side.

## 4. Optical corrections (check each family)

1. Round and pointed letters overshoot: O C G Q S above and below by 12, o c e s by 10; the apex
   of A and the vertex of V by 15 to 20 past the line.
2. Horizontals 10% thinner than verticals, or they look heavier.
3. The bar of H sits at the middle; of A lower (a quarter of the height); of E and F the middle
   arm a little above the middle and shorter than the others.
4. The top half of B S 8 3 smaller than the bottom: it looks equal.
5. Where a bowl meets a stem (b d p q n), the joint is thinner than the stem. With shapes the
   overlap keeps it full: on a bold, cut it with a `hole` triangle or narrow the arc there.
6. Diagonals are 5% thinner than stems (A V W X Y K): they cover more area.
7. A counter narrower than 0.6 × the stem fills in at text sizes (б в ь ы β at stem 128 did).
   On a heavy weight make the bowl's horizontals thinner (`strokeY`) and the letter wider.

## 5. Spacing

Start values for the sheet of §1, then judge in `proof`:

| Glyph | Left | Right |
|---|---|---|
| H, straight capitals | 80 | 80 |
| O, round capitals | 60 | 60 |
| n | 75 | 75 (the arch side 70 if it looks open) |
| o | 50 | 50 |
| diagonal or open side (v, A, T top, L right) | 20–35 | 20–35 |
| figures | `center` all ten in the advance of zero | |

A side that is half straight, half round (b d p q, D, P, B) takes the straight value on the
straight side and the round value on the round side. `set_spacing {glyph, left, right}` moves
the drawing; never move points to space.

Test strings: `HHxHH OOxOO nnxnn ooxoo` for each x; then `Hamburgefonstiv`, `minimum`, `noon`.

## 6. Kerning

Pairs to proof after spacing, in this order; kern only those that look wrong:

```
AV AW AY AT AC AO AQ AG Av Aw Ay
LT LV LW LY L’  PA P. P, TA T. T, Ta Tc Te To Tr Ts Tu Tw Ty
VA V. V, Va Ve Vo WA Wa We Wo YA Y. Y, Ya Ye Yo
FA F. F, RT RV RW RY
f. f, r. r, v. v, w. w, y. y,  “A A”  ‘A A’
```

Values for this sheet: AV −60 to −80, T o −60 to −90, L T −70, V . −80. A mark of a good
value: the pair looks as spaced as "nn" in the same word.
