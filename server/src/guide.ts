/**
 * What an agent must know to draw a font. Sent as the server's instructions and by the `guide` tool: every agent
 * that connects pays for each line, so a line that does not change what it does goes. The method of type design is
 * in the skill `netsu-type-design`, never here.
 */
export const GUIDE = `NetsuFont: fonts drawn by small targeted operations. The user watches the font change live in the app.

WORKFLOW
1. list_fonts, then create_font {name, family, style?} or import_font {file, name} (a .ttf or .otf; its license must allow changes).
2. edit_font {name, ops:[...]}. All or nothing: on an error nothing is saved and the error names the op. It answers the
   glyphs it changed, with their advance and [left right] side bearings, and checks: fix each, or keep it on purpose.
3. look_glyphs {name, chars:"Hno"} (or glyphs:[names]): the glyphs on their lines. proof {name, text, sizes?}: words at
   several sizes, with spacing and kerning; "\\n" starts a line, 600 characters at most.
   get_font {name, glyphs:[names]}: the paths of those glyphs.
4. languages {name, languages?:["fr","pl"]}: what each language lacks, what compose can make, what to draw.
5. export_font {name}: an .otf the user installs. set_language: the app speaks the user's language.

DOCUMENT
- Font units, y UP from the baseline (y 0). New fonts: unitsPerEm 1000, ascender 800, capHeight 700, xHeight 500, descender -200.
- glyph {name, unicode?, advance, path, components?}. name as in the Adobe Glyph List: "A", "a", "zero", "comma",
  "period", "hyphen", "eacute", "A.alt". unicode is the code point in decimal ("A" 65, "a" 97, "0" 48).
- path: SVG path data, M L H V Q C Z, absolute or relative. No A (arcs): a quarter of a circle of radius r is
  C with handles 0.552·r long. Every contour ends with Z.
- Fill is nonzero. Outer contours turn counterclockwise (y up: along the bottom to the right, up the right side),
  holes clockwise. A hole drawn the same way as its outer contour is filled, not cut.
- Ink goes from x = left side bearing to x = advance − right side bearing.
- components [{glyph, x, y}]: other glyphs drawn inside this one, moved. An accented letter is its base and its accent.
- Marks: one glyph each, no unicode: acute grave circumflex dieresis tilde caron breve macron ring dotaccent
  hungarumlaut hookabove horn above the x-height; cedilla ogonek commaaccent dotbelow below the baseline.
  "<mark>.case" is the flatter one for capitals, above the cap height; without it, compose raises the lowercase one.
  dotlessi carries the accents of i.
- Hebrew runs right to left: proof sets it left to right; the app's text view sets it the right way.

OPS (edit_font)
{op:"set_glyph", glyph, unicode?, advance?, path?, shapes?, components?}   creates it, or changes what is given;
   unicode null removes it. shapes become the path (after "path" when both are given).

SHAPES (each turned the right way; overlapping shapes add; "hole":true cuts one layer). Angles: 0 right, 90 top.
{type:"rect", x, y, w, h}   {type:"ellipse", cx, cy, rx, ry}   {type:"polygon", points:[[x,y],...]}
{type:"ring", cx, cy, rx, ry, stroke, strokeY?}   rx, ry are the outside; strokeY: thickness at top and bottom
{type:"arc", cx, cy, rx, ry, stroke, strokeY?, from, to, ends?}   the band of a ring from one angle to the other,
   counterclockwise, ends cut along the radius: the arch of n is from 0 to 180, a c from 45 to 315; to may pass
   360 (270 to 450)
{type:"line", x1, y1, x2, y2, width, ends?}   width across the stroke
ends: "square" (line, default), "flat" (line: cut level to sit on a line; wider than width by 1/cos of the slant),
   "round" (line or arc: a half disc past each end)

MORE OPS
{op:"remove_glyph", glyph}   refused while another glyph uses it as a component
{op:"copy_glyph", from, to, unicode?}   the start of a related letter: n → h, o → c, b → d
{op:"decompose", glyph}   its components become its own path
{op:"set_spacing", glyph, left?, right?}   moves the drawing to these side bearings; the advance follows
{op:"center", glyphs, advance}   one advance for all, the ink centred: figures that line up in tables, a monospace
{op:"transform", glyphs?, scale?, slant?, translate?}   every glyph when glyphs is left out. scale n or [x,y] (x below 0
   mirrors the glyph in its advance: N into И); slant
   in degrees, positive leans right; then translate [x,y]. The advance follows the x scale.
{op:"set_kern", left, right, value}   glyph names or characters ("period" or "."); negative brings the pair closer; 0 removes it
{op:"compose", chars:"éèçÀ"}   makes letters from glyphs already drawn: base + marks, placed (centred, stacked,
   raised on capitals), and Greek or Cyrillic letters shaped as Latin ones (а е о р с А В Н, Α Β Ε). Refused with
   the list of glyphs to draw first. Fix one with set_glyph components afterwards.
{op:"set_metrics", metrics:{ascender?, descender?, capHeight?, xHeight?}}   {op:"set_info", family?, style?}`;
