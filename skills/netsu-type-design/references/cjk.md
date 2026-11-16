# Japanese, Chinese, Korean

Load for a brief with `ja`, `zh-Hans`, `zh-Hant` or `ko`. Their thousands of characters are drawn
from their strokes with `draw_kanji`, in the pen of the font; punctuation by hand. Every glyph is
a square, an em wide.

## Common steps

1. **Data and license**, said in the brief before drawing. Japanese: KanjiVG, CC BY-SA 3.0 (a font
   made with it is CC BY-SA and credits KanjiVG). Chinese: Make Me a Hanzi, Arphic Public License
   (a font made with it is under that license). Korean: letters written for NetsuFont, no data, no
   license of their own. If `draw_kanji` answers `no_kanji_data`, stop and give the user the
   command it names.
2. **Metrics.** `set_metrics {ascender: 880, descender: -120}`: the em square from −120 to 880.
   Latin keeps its cap height and x-height.
3. **Pen.** From the sheet: `width` near the Latin stem or a little under it (these scripts have
   many strokes and darken fast); `ends` from the terminals (round, flat, square); `contrast` is
   the share of the width left along `angle` (0.25 with `angle: 0`: horizontals a quarter as thick),
   1 for a gothic. For a Song or Mincho face add `terminals: "song"`: it makes the data's slanting
   brush strokes level and upright and puts a triangle on each horizontal's end; without it a pen
   with contrast reads as a fine brush (kai), as a blind run found. Measured (2026-11-16): width 80,
   contrast 0.25, flat, song, read as a Song face on 云山三王書国永東語言. Measured (2026-11-10 and
   2026-11-16, em 1000): width 72 round set Japanese and Chinese evenly at 48 and 20 px, width 66
   Korean; at 12 px the characters of many strokes (輩 驚) went dark: keep the pen under the stem.
   Set the pen on a first small set, look, then never change it for one character.
4. **Latin in the square.** The descender line is −120: the Latin descenders of p q g j y fit
   in it, short, or the descender goes lower and the lines open. Say which in the sheet.
5. **Proof** at `[48, 20, 12]`: the text below for each language; nothing touching at 12 px.
   Budget: two blind runs made a Japanese and a Chinese font with Latin in 35 and 31 calls.

## Japanese (ja)

- `draw_kanji {set:"kana", pen}`, then `look_glyphs {chars:"あいうえおかきくけこアイウエオ"}`: fix the pen
  there. The kana show a Japanese font's character: redraw a few by hand when the brief asks for
  more than the pen gives. The voicing marks of が ぱ come out as small ticks a round pen blurs:
  draw `uni3099` ゛ and `uni309A` ゜ by hand, larger, top right of the square, without unicode,
  then `compose` every voiced kana (がぎぐ…ぱぴぷ…ガ…パ…ヴ).
- `draw_kanji {set:"joyo", pen}`: the 2,136 kanji for general use. `set:"jinmeiyo"` adds those of
  names (some have no data: it lists them).
- By hand, each an em wide: the ideographic space U+3000 (empty); 、 。 lower left; 「 （ in the
  right half, high; 」 ） in the left half, low; 『 』 the same, doubled; ！ ？ narrow ink centred;
  〜 a wave as thick as the pen. Look at a Japanese font for them (`import_font`, Yu Gothic or
  Meiryo on Windows, to look at only). 々 and ー come with `draw_kanji`. Digits and … are the Latin.
- Vertical writing (optional): `uni3001.vert`, `uni3002.vert` (upper right), `uni30FC.vert`
  (upright), `uni300C.vert` and the other brackets turned: the export writes them as `vert`.
- Proof: `名前はまだ無い。どこで生まれたか見当がつかぬ。\n「カタカナ」と（ひらがな）、漢字！`

## Chinese (zh-Hans, zh-Hant)

- `draw_kanji {set:"hanzi1", pen}`: the 3,500 characters in common use, simplified (level 1 of the
  2013 table). `hanzi2` (3,000) and `hanzi3` (1,605) complete the table. `set:"hant"`: their
  traditional forms. Look at `中国汉字书法说语` first and fix the pen there.
- Characters the Chinese data lacks come from KanjiVG when it has them (`from the other stroke
  data` in the answer): they are Japanese forms, check them; those neither has are drawn by hand.
- By hand: ，。、；：？！ in the lower left of the square (simplified), and the same centred named
  `.zht` (`uniFF0C.zht`, `uni3002.zht`…): text marked zh-Hant or zh-HK takes them (locl). 「 」 『 』
  for zh-Hant, （ ） 《 》, · centred. “ ” ‘ ’ — … are shared with the Latin: draw them as the Latin
  needs (a Chinese text sets them wider; one code point has one width).
- Proof: `汉字是世界上最古老的文字之一。\n我们一起学习中文书法！` and for zh-Hant `漢字是世界上最古老的文字之一。\n我們一起學習中文書法！`

## Korean (ko)

- `draw_kanji {set:"jamo", pen}` then `look_glyphs {chars:"ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅗ"}`: fix the pen.
- `draw_kanji {set:"hangul", pen}`: the 2,350 syllables of KS X 1001, composed from the letters by
  the shape of their vowel and their final. `hangul_all`: all 11,172 (a large file).
- Korean uses the Latin punctuation and digits: they must be drawn for `ko` to be complete.
- Proof: `모든 인간은 태어날 때부터 자유로우며\n다람쥐 헌 쳇바퀴에 타고파`

## Anti-patterns

| ❌ | ✅ |
|---|---|
| Characters drawn one by one | `draw_kanji` with one pen for a whole set |
| A pen changed for one character | The pen set on a first small set, then left alone |
| "Japanese" with kana only, "Chinese" with a few hundred | `languages` reports `ja`, `zh-Hans`, `zh-Hant` or `ko` complete |
| The license of the data left unsaid | KanjiVG CC BY-SA or Arphic said in the brief and at delivery |
| Japanese forms in a Chinese font, unseen | The fallback list read and those forms checked |
