import { glyphMap, outline } from './outline';
import { bounds, type Box, type Command } from './path';
import type { FontDoc, Glyph } from './types';

/** One problem in a glyph that the agent should fix or keep on purpose. */
export interface Finding {
  glyph: string;
  text: string;
}

/** The contours of an outline, each from its M to the next M. */
function contours(commands: Command[]): Command[][] {
  const out: Command[][] = [];
  for (const command of commands) {
    if (command.type === 'M') out.push([command]);
    else out[out.length - 1]?.push(command);
  }
  return out;
}

/** The corners of a contour, handles included: close enough to the curve to tell inside from outside. */
function corners(contour: Command[]): [number, number][] {
  return contour.flatMap((c): [number, number][] => {
    if (c.type === 'Z') return [];
    if (c.type === 'Q') return [[c.x1, c.y1], [c.x, c.y]];
    if (c.type === 'C') return [[c.x1, c.y1], [c.x2, c.y2], [c.x, c.y]];
    return [[c.x, c.y]];
  });
}

function within([x, y]: [number, number], polygon: [number, number][]): boolean {
  let odd = false;
  polygon.forEach(([x0, y0], i) => {
    const [x1, y1] = polygon[(i + 1) % polygon.length]!;
    if (y0 > y !== y1 > y && x < ((x1 - x0) * (y - y0)) / (y1 - y0) + x0) odd = !odd;
  });
  return odd;
}

const inside = (inner: Box, outer: Box): boolean => inner.xMin > outer.xMin && inner.xMax < outer.xMax && inner.yMin > outer.yMin && inner.yMax < outer.yMax;

/** How many times the contours turn around a point, counterclockwise counted positive: the nonzero rule. */
function winding([x, y]: [number, number], polygon: [number, number][]): number {
  let turns = 0;
  polygon.forEach(([x0, y0], i) => {
    const [x1, y1] = polygon[(i + 1) % polygon.length]!;
    const side = (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0);
    if (y0 <= y && y1 > y && side > 0) turns += 1;
    else if (y0 > y && y1 <= y && side < 0) turns -= 1;
  });
  return turns;
}

/**
 * A contour wholly inside another, whose middle is filled twice: a hole drawn the same way as its outside. The bar of
 * a Θ or a θ, inside the outside and over the hole, is filled once there and is ink on purpose.
 */
function uncut(glyph: Glyph, commands: Command[]): Finding[] {
  const parts = contours(commands).map((contour) => ({ box: bounds(contour), points: corners(contour) }));
  const found = parts.some((inner, i) => {
    if (!inner.box || !parts.some((outer, j) => i !== j && outer.box && inside(inner.box!, outer.box) && inner.points.every((point) => within(point, outer.points)))) return false;
    const middle: [number, number] = [(inner.box.xMin + inner.box.xMax) / 2, (inner.box.yMin + inner.box.yMax) / 2];
    if (!within(middle, inner.points)) return false;
    return Math.abs(parts.reduce((sum, part) => sum + winding(middle, part.points), 0)) >= 2;
  });
  return found ? [{ glyph: glyph.name, text: 'a contour inside another turns the same way: the hole is filled. Reverse the inner one.' }] : [];
}

/** Ink far above the ascender or below the descender is cut by many apps. */
function outOfBounds(doc: FontDoc, glyph: Glyph, commands: Command[]): Finding[] {
  const box = bounds(commands);
  if (!box) return [];
  const margin = doc.unitsPerEm * 0.05;
  const said: Finding[] = [];
  // Accents of capitals go above the ascender on purpose: the file's line height follows the tallest glyph.
  const top = Math.max(doc.metrics.ascender, doc.metrics.capHeight + doc.unitsPerEm * 0.25);
  if (box.yMax > top + margin) said.push({ glyph: glyph.name, text: `reaches y ${Math.round(box.yMax)}, far above the ascender ${doc.metrics.ascender}: lines of text will collide.` });
  if (box.yMin < doc.metrics.descender - margin) said.push({ glyph: glyph.name, text: `reaches y ${Math.round(box.yMin)}, below the descender ${doc.metrics.descender}.` });
  // A mark is placed by compose, wherever it is drawn.
  if (glyph.unicode !== undefined && (box.xMin < -margin || box.xMax > glyph.advance + margin)) said.push({ glyph: glyph.name, text: `ink from x ${Math.round(box.xMin)} to ${Math.round(box.xMax)} leaves the advance 0 to ${glyph.advance}: it will touch its neighbours.` });
  return said;
}

/** What is wrong in the glyphs named, or in all of them. */
export function checkGlyphs(doc: FontDoc, names?: string[]): Finding[] {
  const byName = glyphMap(doc);
  const glyphs = names === undefined ? doc.glyphs : doc.glyphs.filter((glyph) => names.includes(glyph.name));
  return glyphs.flatMap((glyph) => {
    const commands = outline(doc, glyph, byName);
    return [...uncut(glyph, commands), ...outOfBounds(doc, glyph, commands)];
  });
}
