import { ARABIC_MARKS_ABOVE, ARABIC_MARKS_BELOW, FORM_OF, formsOf } from './arabic';
import { BELOW, glyphName, KEEP, recipe, RIGHT } from './names';
import { glyphBounds, glyphMap } from './outline';
import { FontError, type FontDoc, type Glyph, type Part } from './types';

/** One glyph compose makes: a letter, or one of the joining forms of an Arabic letter. */
interface Build {
  name: string;
  unicode?: number;
  base: string;
  marks: string[];
  capital: boolean;
}

/** The glyphs to make for a character: itself, and the forms of an Arabic letter from the forms of its skeleton. */
function buildsOf(char: string): Build[] {
  const made = recipe(char);
  if (!made.base) throw new FontError('not_composed', `"${char}" is drawn on its own, not composed: draw it as ${made.name} with set_glyph.`);
  const capital = char !== char.toLowerCase();
  const own: Build = { name: made.name, unicode: made.unicode, base: made.base, marks: made.marks ?? [], capital };
  const forms = formsOf(char).map((form) => {
    const other = FORM_OF[char]?.[form];
    return { name: `${made.name}.${form}`, base: `${other ? glyphName(other) : made.base}.${form}`, marks: own.marks, capital };
  });
  return [own, ...forms];
}

/** The builds in an order where each comes after the builds it is made from: е before ё, ي.init before ی.init. */
function ordered(builds: Build[]): Build[] {
  const byName = new Map(builds.map((build) => [build.name, build]));
  const out: Build[] = [];
  const seen = new Set<string>();
  const visit = (build: Build): void => {
    if (seen.has(build.name)) return;
    seen.add(build.name);
    for (const dep of [build.base, ...build.marks]) {
      const inner = byName.get(dep);
      if (inner) visit(inner);
    }
    out.push(build);
  };
  builds.forEach(visit);
  return out;
}

/**
 * Accented letters made of their base and their marks, placed: a mark above is centred on the ink of the base and,
 * on a capital, raised by the cap height minus the x-height unless a `<mark>.case` is drawn for capitals. A second
 * mark above sits on the first. A mark below is centred and kept where it is drawn; an ogonek hangs at the right of
 * the foot; a horn goes to the right. Arabic dots are centred and moved only to clear the skeleton.
 */
export function composeLetters(doc: FontDoc, chars: string): string[] {
  const byName = glyphMap(doc);
  const builds = ordered([...new Set(chars)].flatMap(buildsOf));
  const lacking = lackingOf(builds, byName);
  if (lacking.length > 0) throw new FontError('glyph_not_found', `Draw these first: ${lacking.join(', ')}. Marks are drawn above the x-height or below the baseline.`);
  return builds.map((build) => {
    const base = byName.get(build.base)!;
    const parts = place(doc, byName, base, build.marks, build.capital);
    const existing = doc.glyphs.find((glyph) => glyph.name === build.name);
    const glyph: Glyph = { name: build.name, ...(build.unicode === undefined ? {} : { unicode: build.unicode }), advance: base.advance, path: '', components: parts };
    if (existing) {
      for (const key of Object.keys(existing) as (keyof Glyph)[]) delete existing[key];
      Object.assign(existing, glyph);
    } else doc.glyphs.push(glyph);
    byName.set(glyph.name, existing ?? glyph);
    return build.name;
  });
}

function lackingOf(builds: Build[], byName: Map<string, Glyph>): string[] {
  const coming = new Set(builds.map((build) => build.name));
  return [...new Set(builds.flatMap((build) => [build.base, ...build.marks]).filter((name) => !byName.has(name) && !coming.has(name)))];
}

/** The glyphs compose needs drawn before it can make these characters: bases, skeletons with their forms, marks. */
export function composeNeeds(doc: FontDoc, chars: string): string[] {
  const composable = [...new Set(chars)].filter((char) => recipe(char).base !== undefined);
  return lackingOf(composable.flatMap(buildsOf), glyphMap(doc));
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
    const x = Math.round(centre - (markBox.xMin + markBox.xMax) / 2);
    const raise = capital && cased === name ? lift : 0;
    if (KEEP.has(name)) {
      parts.push({ glyph: cased, x: 0, y: 0 });
    } else if (ARABIC_MARKS_ABOVE.has(name)) {
      parts.push({ glyph: cased, x, y: Math.max(0, Math.round(box.yMax + gap - markBox.yMin)) });
    } else if (ARABIC_MARKS_BELOW.has(name)) {
      parts.push({ glyph: cased, x, y: Math.min(0, Math.round(box.yMin - gap - markBox.yMax)) });
    } else if (name === 'ogonek') {
      // An ogonek hangs from the right of the foot: its right edge on the base's.
      parts.push({ glyph: cased, x: Math.round(box.xMax - markBox.xMax), y: 0 });
    } else if (BELOW.has(name)) {
      parts.push({ glyph: cased, x, y: 0 });
    } else if (RIGHT.has(name)) {
      parts.push({ glyph: cased, x: Math.round(box.xMax - markBox.xMin - (markBox.xMax - markBox.xMin) * 0.4), y: raise });
    } else {
      // A second mark above sits on the first one, a small gap between them.
      const y = top === undefined ? raise : Math.round(top + gap - markBox.yMin);
      parts.push({ glyph: cased, x, y });
      top = markBox.yMax + y;
    }
  }
  return parts;
}
