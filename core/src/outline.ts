import { bounds, parsePath, transformPath, type Box, type Command } from './path';
import type { FontDoc, Glyph } from './types';

/** The glyphs by name. */
export function glyphMap(doc: FontDoc): Map<string, Glyph> {
  return new Map(doc.glyphs.map((glyph) => [glyph.name, glyph]));
}

/** The whole outline of a glyph: its own path and its components, moved, at any depth. */
export function outline(doc: FontDoc, glyph: Glyph, byName = glyphMap(doc)): Command[] {
  const own = parsePath(glyph.path);
  const parts = (glyph.components ?? []).flatMap((part) => {
    const inner = byName.get(part.glyph);
    return inner ? transformPath(outline(doc, inner, byName), [1, 0, 0, 1, part.x, part.y]) : [];
  });
  return [...own, ...parts];
}

/** The box of the whole outline, or undefined for an empty glyph such as the space. */
export function glyphBounds(doc: FontDoc, glyph: Glyph, byName = glyphMap(doc)): Box | undefined {
  return bounds(outline(doc, glyph, byName));
}

/** The space on each side of the drawing: from the origin to the left of the box, from its right to the advance. */
export function sideBearings(doc: FontDoc, glyph: Glyph): { left: number; right: number } | undefined {
  const box = glyphBounds(doc, glyph);
  if (!box) return undefined;
  return { left: Math.round(box.xMin), right: Math.round(glyph.advance - box.xMax) };
}

/** The glyph that draws a character, if the font has one. */
export function glyphFor(doc: FontDoc, char: string): Glyph | undefined {
  const code = char.codePointAt(0);
  return doc.glyphs.find((glyph) => glyph.unicode === code);
}

export interface Placed {
  glyph: Glyph;
  /** Where its origin is on the line, in font units. */
  x: number;
  /** The kerning added before it. */
  kern: number;
}

/**
 * A line of text set with the font: each character's glyph after the one before, its advance and the
 * kerning of the pair. A character the font does not draw is left out and named in `missing`.
 */
export function layout(doc: FontDoc, text: string): { placed: Placed[]; width: number; missing: string[] } {
  const kerns = new Map(doc.kerning.map((kern) => [`${kern.left} ${kern.right}`, kern.value]));
  const placed: Placed[] = [];
  const missing: string[] = [];
  let x = 0;
  let previous: Glyph | undefined;
  for (const char of text) {
    const glyph = glyphFor(doc, char);
    if (!glyph) {
      if (!missing.includes(char)) missing.push(char);
      continue;
    }
    const kern = previous ? (kerns.get(`${previous.name} ${glyph.name}`) ?? 0) : 0;
    x += kern;
    placed.push({ glyph, x, kern });
    x += glyph.advance;
    previous = glyph;
  }
  return { placed, width: x, missing };
}
