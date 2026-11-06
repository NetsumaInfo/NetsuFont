import { anchors, type Anchors } from './marks';
import { shapeLine, type Item } from './shape';
import type { FontDoc, Glyph } from './types';

export interface Placed {
  glyph: Glyph;
  /** Where its origin is on the line, in font units. */
  x: number;
  /** How far a mark is raised (or lowered, below 0) to sit on its letter. 0 for a letter. */
  y: number;
  /** The kerning added before it. */
  kern: number;
}

/**
 * A mark moved onto what it belongs to, as GPOS mark and mkmk do: the anchor of the mark on the anchor of its letter,
 * or of the mark of the same place before it (a tone over a vowel sign).
 */
function attach(found: Anchors, items: Item[], placed: Placed[], i: number, under: Map<number, number>): void {
  const item = items[i]!;
  const mark = found.marks.get(item.glyph.name);
  if (!mark || item.base === undefined) return;
  const below = under.get(item.base);
  const onMark = below !== undefined && found.marks.get(items[below]!.glyph.name)?.place === mark.place;
  const target = onMark ? found.stacks.get(items[below]!.glyph.name)?.[mark.place] : found.bases.get(items[item.base]!.glyph.name)?.[mark.place];
  if (!target) return;
  const from = placed[onMark ? below : item.base]!;
  placed[i] = { ...placed[i]!, x: from.x + target[0] - mark.anchor[0], y: from.y + target[1] - mark.anchor[1] };
  under.set(item.base, i);
}

/**
 * A line of text set with the font, shaped (see `shapeLine`): each glyph after the one before, its advance and
 * the kerning of the pair. In right-to-left text a pair is read in its order: `left` is the letter read first, on
 * the right. Marks sit on their letters at the anchors the exported GPOS has. A character the font does not draw is
 * left out and named in `missing`.
 */
export function layout(doc: FontDoc, text: string, features: string[] = []): { placed: Placed[]; width: number; missing: string[] } {
  const kerns = new Map(doc.kerning.map((kern) => [`${kern.left} ${kern.right}`, kern.value]));
  const { items, missing } = shapeLine(doc, text, features);
  const placed: Placed[] = [];
  let x = 0;
  let previous: Item | undefined;
  for (const item of items) {
    if (item.mark) {
      placed.push({ glyph: item.glyph, x, y: 0, kern: 0 });
      continue;
    }
    const pair = previous && (item.level % 2 === 1 && previous.level % 2 === 1 ? `${item.glyph.name} ${previous.glyph.name}` : `${previous.glyph.name} ${item.glyph.name}`);
    const kern = pair ? (kerns.get(pair) ?? 0) : 0;
    x += kern;
    placed.push({ glyph: item.glyph, x, y: 0, kern });
    x += item.glyph.advance;
    previous = item;
  }
  const found = anchors(doc);
  const under = new Map<number, number>();
  // In the order they are typed, so that a second mark finds the first one on its letter: right to left is drawn reversed.
  const indices = items.map((_, i) => i);
  const order = [...indices.filter((i) => items[i]!.level % 2 === 0), ...indices.filter((i) => items[i]!.level % 2 === 1).reverse()];
  order.forEach((i) => attach(found, items, placed, i, under));
  return { placed, width: x, missing };
}
