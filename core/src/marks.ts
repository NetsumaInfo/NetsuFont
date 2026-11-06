// Where a combining mark goes on its letter, and the anchors that put it there: computed from the ink of the glyphs,
// so the agent draws a mark once and never places it by hand. Used by the GPOS writer and by `proof`.
import { glyphBounds, glyphMap } from './outline';
import type { Box } from './path';
import type { FontDoc, Glyph } from './types';

/**
 * above: sits on the top of its letter's ink. below: hangs under its ink. centre: centred across, kept at the height
 * it is drawn (a Hebrew dagesh). frame: kept where it is drawn in its letter's own coordinates (the dot of shin).
 */
export type MarkPlace = 'above' | 'below' | 'centre' | 'frame';
export const PLACES: MarkPlace[] = ['above', 'below', 'centre', 'frame'];

const inRanges = (code: number, ranges: [number, number][]): boolean => ranges.some(([from, to]) => code >= from && code <= to);

const BELOW: [number, number][] = [
  [0x316, 0x319], [0x31c, 0x333], [0x339, 0x33c], [0x345, 0x345], [0x347, 0x349], [0x34d, 0x34e], [0x353, 0x356], [0x359, 0x35a],
  [0x5b0, 0x5b8], [0x5bb, 0x5bb], [0x5bd, 0x5bd], [0x64d, 0x64d], [0x650, 0x650], [0x655, 0x656],
  [0x93c, 0x93c], [0x941, 0x944], [0x94d, 0x94d], [0x952, 0x952], [0x962, 0x963], [0xe38, 0xe3a], [0xeb8, 0xeb9], [0xebc, 0xebc],
];
const CENTRE: [number, number][] = [[0x5bc, 0x5bc]];
const FRAME: [number, number][] = [[0x5b9, 0x5ba], [0x5c1, 0x5c2]];

/** True for a glyph text engines treat as a mark: it draws a combining character and has no advance. */
export function isMark(glyph: Glyph): boolean {
  return glyph.unicode !== undefined && glyph.advance === 0 && /\p{M}/u.test(String.fromCodePoint(glyph.unicode));
}

/** Where a mark goes: by its code point when Unicode says, else by where it is drawn (below the baseline: below). */
export function markPlace(glyph: Glyph, box: Box | undefined): MarkPlace {
  const code = glyph.unicode ?? 0;
  if (inRanges(code, CENTRE)) return 'centre';
  if (inRanges(code, FRAME)) return 'frame';
  if (inRanges(code, BELOW)) return 'below';
  if (code >= 0x300 && code <= 0x36f) return 'above';
  return box && (box.yMin + box.yMax) / 2 < 0 ? 'below' : 'above';
}

/** The space between a letter and its mark: none in Devanagari, where marks touch the headline and the stem. */
function gapFor(doc: FontDoc, glyph: Glyph): number {
  const code = glyph.unicode ?? 0;
  return code >= 0x900 && code <= 0x97f ? 0 : Math.round(doc.unitsPerEm * 0.03);
}

export type Anchor = [number, number];

export interface Anchors {
  /** The marks, each with its place and the point of it that is attached. */
  marks: Map<string, { place: MarkPlace; anchor: Anchor; box: Box }>;
  /** Every other glyph with ink: where a mark of each place attaches to it. */
  bases: Map<string, Record<MarkPlace, Anchor>>;
  /** Marks above or below, as bases for the next mark of the same place (stacked). */
  stacks: Map<string, Partial<Record<MarkPlace, Anchor>>>;
}

const centre = (box: Box): number => Math.round((box.xMin + box.xMax) / 2);

/** The anchors of every glyph of a font. A mark's gap is its own: a Devanagari mark brings none. */
export function anchors(doc: FontDoc): Anchors {
  const byName = glyphMap(doc);
  const result: Anchors = { marks: new Map(), bases: new Map(), stacks: new Map() };
  for (const glyph of doc.glyphs) {
    const box = glyphBounds(doc, glyph, byName);
    if (!box) continue;
    const x = centre(box);
    if (isMark(glyph)) {
      const place = markPlace(glyph, box);
      const own = gapFor(doc, glyph);
      const anchor: Anchor = place === 'above' ? [x, Math.round(box.yMin) - own] : place === 'below' ? [x, Math.round(box.yMax) + own] : place === 'centre' ? [x, 0] : [0, 0];
      result.marks.set(glyph.name, { place, anchor, box });
      if (place === 'above') result.stacks.set(glyph.name, { above: [x, Math.round(box.yMax)] });
      if (place === 'below') result.stacks.set(glyph.name, { below: [x, Math.round(box.yMin)] });
      continue;
    }
    result.bases.set(glyph.name, { above: [x, Math.round(box.yMax)], below: [x, Math.round(Math.min(box.yMin, 0))], centre: [x, 0], frame: [0, 0] });
  }
  return result;
}
