# Japanese

Load for a brief with `ja`. Kana and kanji are drawn from their strokes with `draw_kanji`, in the
pen of the font; punctuation by hand. Every glyph is a square, an em wide.

## Steps

1. **Data.** `draw_kanji` needs KanjiVG on the user's machine. If it answers `no_kanji_data`,
   stop and give the user the command it names. KanjiVG is CC BY-SA 3.0: a font made with it is
   shared under the same license and credits KanjiVG. Say so in the brief, before drawing.
2. **Metrics.** `set_metrics {ascender: 880, descender: -120}`: the em square from −120 to 880,
   as in Japanese fonts. Latin keeps its cap height and x-height.
3. **Pen.** From the sheet: `width` near the Latin stem or a little under it (kanji have many
   strokes and darken fast); `ends` from the terminals (round, flat, square); `contrast` with
   `angle: 0` for a Mincho feel (thin horizontals), 1 for a gothic. Measured in a test
   (2026-11-10, em 1000): width 72, round, set "吾輩は猫である" evenly at 48 and 20 px.
4. **Kana first.** `draw_kanji {set:"kana", pen}`, then `look_glyphs {chars:"あいうえおかきくけこアイウエオ"}`.
   Fix the pen there, never per kanji: a pen that works on kana works on the kanji. The kana are
   where a Japanese font shows its character: redraw a few by hand (`set_glyph` with `shapes`)
   when the brief asks for more than the pen gives.
5. **Kanji.** `draw_kanji {set:"joyo", pen}`: the 2,136 kanji for general use, in one call.
   `set:"jinmeiyo"` adds those of personal names (some have no stroke data: it lists them).
6. **By hand**, each an em wide: the ideographic space U+3000 (empty); 、 。 in the lower left of
   the square; 「 」 『 』 （ ） ！ ？ 〜 … 々 from the model of a Japanese font
   (`import_font`, Yu Gothic or Meiryo on Windows, to look at only), and the digits.
7. **Vertical writing** (optional): `uni3001.vert`, `uni3002.vert` (the comma and stop in the
   upper right), `uni30FC.vert` (the long vowel mark upright), `uni300C.vert` and the other
   brackets turned: the export writes them as `vert`.
8. **Proof.** `proof {text:"吾輩は猫である。名前はまだ無い。\nどこで生れたかとんと見当がつかぬ。", sizes:[48, 20, 12]}`:
   kana and kanji the same colour, nothing touching at 12 px.

## Anti-patterns

| ❌ | ✅ |
|---|---|
| Kanji drawn one by one | `draw_kanji` with one pen for all |
| A pen changed for one kanji | The pen set on the kana, then left alone |
| "Japanese" with kana only | `languages` reports `ja` complete: kana, punctuation and the 2,136 jōyō |
| The KanjiVG license left unsaid | CC BY-SA said in the brief and at delivery |
