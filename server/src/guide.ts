/**
 * What an agent must know to draw a font. Sent as the server's instructions and by the `guide` tool: every agent
 * that connects pays for each line, so a line that does not change what it does goes. The method of type design is
 * in the skill `netsu-type-design`, never here.
 */
export const GUIDE = `NetsuFont: fonts drawn by small targeted operations. The user watches the font change live in the app.

WORKFLOW
1. list_fonts (one line each; {name} for one font's glyphs and checks, {name, chars} for a few of them), then create_font {name, family, style?, from?}
   (from: another style of that font, its glyphs copied: "Bold", "Light Italic"; the export names and links it) or
   import_font {file, name, index?} (a .ttf, .otf, or .ttc with index; to change, its license must allow it). It keeps
   its Arabic forms, Indic forms and conjuncts, and ligatures, under the names below. A font brought in as a model
   is looked at (look_glyphs model); never read its paths with get_font or trace them by a script: the result is that
   font's design, under its license, not yours.
   remove_font {name} takes a font out (its file goes to fonts/.trash).
2. edit_font {name, ops:[...]}. All or nothing: on an error nothing is saved and the error names the op. It answers the
   glyphs it changed, with their advance and [left right] side bearings, and checks: fix each, or keep it on purpose.
3. look_glyphs {name, chars:"Hno"} (or glyphs:[names]): the glyphs on their lines; model:"<font id>" draws that font's
   glyph of each character in blue, from your glyph's origin, filled under it and outlined over it, to trace a script;
   size:400 and grid:true (a line every 100 units) to read positions. proof {name, text, sizes?, features?, lang?}: words at
   several sizes, with spacing and kerning; "\\n" starts a line, 600 characters at most.
   get_font {name, glyphs:[names]}: the paths of those glyphs.
4. languages {name, languages?:["fr","pl"]}: what each language lacks, what compose can make, what to draw.
   lint {name}: glyphs whose strokes are much heavier or lighter than their script's, round letters short of the lines,
   Latin letters spaced unlike n, o, H or O on a side of the same shape.
5. export_font {name}: an .otf and a .ttf (TrueType outlines, for apps that take no other) the user installs, a .woff2 for web pages. set_language: the app speaks the user's language.

DOCUMENT
- Font units, y UP from the baseline (y 0). New fonts: unitsPerEm 1000, ascender 800, capHeight 700, xHeight 500, descender -200.
- glyph {name, unicode?, advance, path, components?}. name as in the Adobe Glyph List: "A", "a", "zero", "comma",
  "period", "hyphen", "eacute", "A.alt". unicode is the code point in decimal ("A" 65, "a" 97, "0" 48).
- path: SVG path data, M L H V Q C Z, absolute or relative. No A (arcs): a quarter of a circle of radius r is
  C with handles 0.552·r long. Every contour ends with Z.
- Fill is nonzero. Outer contours turn counterclockwise (y up: along the bottom to the right, up the right side),
  holes clockwise. A hole drawn the same way as its outer contour is filled, not cut.
- Ink goes from x = left side bearing to x = advance − right side bearing.
- components [{glyph, x, y, scale?}]: other glyphs drawn inside this one, moved (and scaled from their origin). An
  accented letter is its base and its accent.
- Marks: one glyph each, no unicode: acute grave circumflex dieresis tilde caron breve macron ring dotaccent
  hungarumlaut hookabove horn above the x-height; cedilla ogonek commaaccent dotbelow below the baseline.
  "<mark>.case" is the flatter one for capitals, above the cap height; without it, compose raises the lowercase one.
  dotlessi carries the accents of i.
- Right to left (Hebrew, Arabic): proof and the app set it so. In such text a kerning pair's left is the letter read first.
- Marks with a unicode (accents typed after a letter, Hebrew points, Arabic harakat, Thai and Indic signs above or below):
  advance 0, drawn once anywhere: the export (GDEF, GPOS mark and mkmk) and proof move it, its ink centred on the letter's,
  and set it on the top of its letter's
  ink, or under it (Unicode says, or it is drawn below the baseline); a second one stacks on the first. The Hebrew
  dagesh is centred; the shin and sin dots and holam stay where drawn in the letter's frame. Indic marks touch, Tamil's excepted.
  A sign beside its letter (া ি ং ঃ, Tamil ா ி) is not a mark: it keeps an advance, its ink may reach over the letter.
- Japanese, Chinese, Korean: draw_kanji {name, set or chars, from?, pen:{width, ends?, contrast?, angle?, terminals?}, frame?} draws
  them from their strokes with the pen, one em-wide glyph each. Sets: kana joyo jinmeiyo (KanjiVG), hanzi1 hanzi2 hanzi3
  hant (Make Me a Hanzi; from:"hanzi" for chars), hangul hangul_all jamo (composed from letters, no data). contrast:
  the share of the width left along angle (0.25: a quarter). terminals:"song": strokes made level and upright, a
  triangle on each horizontal's end. <name>.zht: the glyph traditional Chinese text uses (feature locl). Voicing marks uni3099 uni309A, without unicode, stay
  where drawn (compose が from か). <name>.vert: the glyph for vertical writing (feature vert).
- Indic (Devanagari, Bengali, Gurmukhi, Gujarati, Odia, Tamil, Malayalam, Telugu, Kannada, Sinhala, Khmer,
  Myanmar): <consonant>.half (before another consonant, the virama
  gone), <ra>.rphf (the reph: advance 0, ink above and left of x 0), <consonant>.blwf (under the consonant before it:
  advance 0), <consonant>.pstf (after it: Bengali ya-phala uni09AF.pstf), uni0D30.pref (Malayalam ra after a virama,
  drawn before its consonant: a spacing glyph), conjuncts named by their parts
  (uni0915_uni094D_uni0937 for क्ष), a letter drawn with its vowel the same way (Tamil கு uni0B95_uni0BC1). Vowel
  signs drawn before their consonant (ि, Bengali ি ে ৈ, Odia େ, Tamil ெ ே ை, Malayalam െ േ ൈ) are spacing glyphs: the engine draws them
  first. Vowel signs in two parts (ো ৌ ୈ ୋ ୌ ொ ோ ௌ ൊ ോ ൌ) are split by the engine: compose makes their glyph from the parts.
  The Malayalam dot reph ൎ, typed before its consonant, is drawn after it: advance 0, ink above and left of x 0.
  Khmer: the coeng ្ is the virama: <consonant>.blwf is each consonant under another, uni179A.pref the ro drawn before
  the consonant. ើ ឿ ៀ ោ ៅ are split into េ and themselves: draw each as its part after the letter.
  Tibetan: the letters written under another (ྐ ྱ ྲ, U+0F90 on) are marks of advance 0 drawn below the baseline:
  the font stacks them under the letter, the vowel ུ under them.
  Myanmar: the virama ္ stacks: <consonant>.blwf is a consonant under another; uni1004.rphf the kinzi (င်္ before a
  consonant, drawn over it). ေ and the medial ra ြ are drawn before the consonant, in that order.
  Telugu, Kannada, Sinhala: each consonant is drawn again with each vowel sign (కి uni0C15_uni0C3F; Sinhala ක් කු කූ). Draw <consonant>.base, the
  consonant without its head stroke, and the signs (a sign of advance 0 drawn left of x 0 sits over its end); then
  {op:"compose", syllables:"te"} (or "kn", "si") makes them all for the consonants drawn: a sign drawn as a mark (advance
  0) goes on .base, a spacing sign after the whole consonant. Redraw one by hand when needed.
- Arabic: a joining letter is its glyph (isolated, with unicode) and forms without unicode: <name>.init (word start, joins
  on its left edge), .medi (both edges), .fina (word end, joins on its right edge). ا د ذ ر ز و ة join only on the right:
  .fina alone. Lam-alef ligatures uni0644_uni0627, uni0644_uni0623, uni0644_uni0625, uni0644_uni0622, each with .fina.
  Draw skeletons with their forms (ٮ uni066E, ں uni06BA, ى uni0649, ح د ر س ص ط ع ه, ڡ uni06A1, ٯ uni066F) and dots as
  marks: dotabove-ar twodotsabove-ar threedotsabove-ar dotbelow-ar twodotsbelow-ar threedotsbelow-ar hamzaabove-ar
  hamzabelow-ar madda-ar tahabove-ar. compose makes ب ت ن ي ج خ ش ف ق أ… and their forms.
- Features come from names and are written to the font on export: f_i (liga, parts joined by _), a.ss01 to a.ss20
  (stylistic sets), a.alt (salt), a.sc (smcp), one.onum, one.tnum. proof {features:["ss01"]} shows them; the app has a
  switch for each.

OPS (edit_font)
{op:"set_glyph", glyph, unicode?, advance?, path?, shapes?, components?}   creates it, or changes what is given;
   unicode null removes it. shapes become the path (after "path" when both are given). A new glyph's advance is 600
   unless given: give it, also for a glyph made of components.

SHAPES (each turned the right way; overlapping shapes add; "hole":true cuts one layer). Angles: 0 right, 90 top.
{type:"rect", x, y, w, h}   {type:"ellipse", cx, cy, rx, ry}   {type:"polygon", points:[[x,y],...]}
{type:"ring", cx, cy, rx, ry, stroke, strokeY?}   rx, ry are the outside; strokeY: thickness at top and bottom;
   a stroke is less than rx and ry
{type:"arc", cx, cy, rx, ry, stroke, strokeY?, from, to, ends?}   the band of a ring (rx, ry outside) from one angle to the other,
   counterclockwise, ends cut along the radius: the arch of n is from 0 to 180, a c from 45 to 315; to may pass
   360 (270 to 450)
{type:"line", x1, y1, x2, y2, width, ends?}   width across the stroke
ends: "square" (line, default), "flat" (line: cut level to sit on a line; wider than width by 1/cos of the slant),
   "round" (line or arc: a half disc past each end; stroke default)
{type:"stroke", points:[[x,y],...], width, ends?, smooth?}   a pen along the points: corners round; smooth:true
   curves through them (kept sharp where they turn more than 50°). One stroke draws a whole bowl, hook or tail

MORE OPS
{op:"remove_glyph", glyph}   refused while another glyph uses it as a component
{op:"copy_glyph", from, to, unicode?}   the start of a related letter: n → h, o → c, b → d
{op:"decompose", glyph}   its components become its own path
{op:"set_spacing", glyph, left?, right?}   moves the drawing to these side bearings; the advance follows
{op:"center", glyphs, advance}   one advance for all, the ink centred: figures that line up in tables, a monospace
{op:"transform", glyphs?, scale?, slant?, translate?}   every glyph when glyphs is left out. scale n or [x,y] (x below 0
   mirrors the glyph in its advance: N into И; y below 0 mirrors it round the baseline: 6 into 9 with a translate); slant
   in degrees, positive leans right; then translate [x,y]. The advance follows the x scale.
{op:"set_kern", left, right, value}   glyph names or characters ("period" or "."); negative brings the pair closer; 0 removes it
{op:"compose", chars:"éèçÀ"} or {op:"compose", syllables:"te"}   makes letters from glyphs already drawn: base + marks, placed (centred, stacked,
   raised on capitals), Greek or Cyrillic letters shaped as Latin ones (а е о р с А В Н, Α Β Ε), and Arabic letters
   from skeleton + dots with all their forms (dots moved only to clear the skeleton). Refused with
   the list of glyphs to draw first. Fix one with set_glyph components afterwards.
{op:"set_metrics", metrics:{ascender?, descender?, capHeight?, xHeight?}}   {op:"set_info", family?, style?}`;
