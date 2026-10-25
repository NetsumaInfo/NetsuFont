import { BELOW, recipe, RIGHT } from './languages';
import { glyphBounds, glyphMap } from './outline';
import { FontError, type FontDoc, type Glyph, type Part } from './types';

/**
 * Accented letters made of their base and their marks, placed: a mark above is centred on the ink of the base and,
 * on a capital, raised by the cap height minus the x-height unless a `<mark>.case` is drawn for capitals. A second
 * mark above sits on the first. A mark below is centred and kept where it is drawn; an ogonek hangs at the right of the foot; a horn goes to the right.
 * Marks are drawn once, at their place over an x-height letter: above the x-height, or below the baseline.
 */
export function composeLetters(doc: FontDoc, chars: string): string[] {
  const byName = glyphMap(doc);
  // A letter made here may be the base of another one made here: е before ё. Plain copies come first.
  const wanted = [...new Set(chars)].map((char) => ({ char, made: recipe(char) })).sort((a, b) => (a.made.marks?.length ?? 0) - (b.made.marks?.length ?? 0));
  const coming = new Set(wanted.map((entry) => entry.made.name));
  const lacking = new Set<string>();
  for (const { char, made } of wanted) {
    if (!made.base) throw new FontError('not_composed', `"${char}" is drawn on its own, not composed: draw it as ${made.name} with set_glyph.`);
    for (const name of [made.base, ...made.marks!]) if (!byName.has(name) && !coming.has(name)) lacking.add(name);
  }
  if (lacking.size > 0) throw new FontError('glyph_not_found', `Draw these first: ${[...lacking].join(', ')}. Marks are drawn above the x-height or below the baseline.`);
  return wanted.map(({ char, made }) => {
    const base = byName.get(made.base!)!;
    const capital = char !== char.toLowerCase();
    const parts = place(doc, byName, base, made.marks!, capital);
    const existing = doc.glyphs.find((glyph) => glyph.name === made.name);
    const glyph: Glyph = { name: made.name, unicode: made.unicode, advance: base.advance, path: '', components: parts };
    if (existing) Object.assign(existing, glyph);
    else doc.glyphs.push(glyph);
    byName.set(glyph.name, existing ?? glyph);
    return made.name;
  });
}

function place(doc: FontDoc, byName: Map<string, Glyph>, base: Glyph, marks: string[], capital: boolean): Part[] {
  const box = glyphBounds(doc, base, byName) ?? { xMin: 0, xMax: base.advance, yMin: 0, yMax: doc.metrics.xHeight };
  const centre = (box.xMin + box.xMax) / 2;
  const lift = doc.metrics.capHeight - doc.metrics.xHeight;
  const gap = Math.round(doc.unitsPerEm * 0.03);
  const parts: Part[] = [{ glyph: base.name, x: 0, y: 0 }];
  let top: number | undefined;
  for (const name of marks) {
    const cased = capital && byName.has(`${name}.case`) ? `${name}.case` : name;
    const mark = byName.get(cased)!;
    const markBox = glyphBounds(doc, mark, byName);
    if (!markBox) throw new FontError('empty_mark', `The mark "${cased}" is empty: draw it.`);
    const markCentre = (markBox.xMin + markBox.xMax) / 2;
    const raise = capital && cased === name ? lift : 0;
    if (name === 'ogonek') {
      // An ogonek hangs from the right of the foot: its right edge on the base's.
      parts.push({ glyph: cased, x: Math.round(box.xMax - markBox.xMax), y: 0 });
    } else if (BELOW.has(name)) {
      parts.push({ glyph: cased, x: Math.round(centre - markCentre), y: 0 });
    } else if (RIGHT.has(name)) {
      parts.push({ glyph: cased, x: Math.round(box.xMax - markBox.xMin - (markBox.xMax - markBox.xMin) * 0.4), y: raise });
    } else {
      // A second mark above sits on the first one, a small gap between them.
      const y = top === undefined ? raise : Math.round(top + gap - markBox.yMin);
      parts.push({ glyph: cased, x: Math.round(centre - markCentre), y });
      top = markBox.yMax + y;
    }
  }
  return parts;
}
