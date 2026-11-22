// The style of a font, measured, and the glyphs that depart from it: stems thicker or thinner than those of their
// script, round letters that do not pass the lines, Latin letters spaced unlike those of the same side. Strokes are
// measured on lines through the ink, the curves flattened and the nonzero rule applied: overlaps count once.
import { glyphMap, glyphBounds, outline } from './outline';
import type { Command } from './path';
import type { FontDoc, Glyph } from './types';

type Point = [number, number];

/** The outline as closed polygons, each curve cut in eight. */
function polygons(commands: Command[]): Point[][] {
  const out: Point[][] = [];
  let at: Point = [0, 0];
  for (const c of commands) {
    if (c.type === 'M') out.push([(at = [c.x, c.y])]);
    else if (c.type === 'L') out[out.length - 1]!.push((at = [c.x, c.y]));
    else if (c.type === 'Q' || c.type === 'C') {
      const [p0, last] = [at, out[out.length - 1]!];
      for (let k = 1; k <= 8; k += 1) {
        const t = k / 8;
        const u = 1 - t;
        last.push(c.type === 'Q'
          ? [u * u * p0[0] + 2 * u * t * c.x1 + t * t * c.x, u * u * p0[1] + 2 * u * t * c.y1 + t * t * c.y]
          : [u ** 3 * p0[0] + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t ** 3 * c.x, u ** 3 * p0[1] + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t ** 3 * c.y]);
      }
      at = [c.x, c.y];
    }
  }
  return out;
}

/** The runs of ink a horizontal line at y crosses, left to right: [from, to]. */
export function inkRuns(commands: Command[], y: number): [number, number][] {
  const crossings: { x: number; turn: number }[] = [];
  for (const polygon of polygons(commands)) {
    polygon.forEach(([x0, y0], i) => {
      const [x1, y1] = polygon[(i + 1) % polygon.length]!;
      if (y0 <= y !== y1 <= y) crossings.push({ x: x0 + ((y - y0) * (x1 - x0)) / (y1 - y0), turn: y1 > y0 ? 1 : -1 });
    });
  }
  crossings.sort((a, b) => a.x - b.x);
  const runs: [number, number][] = [];
  let winding = 0;
  let start = 0;
  for (const { x, turn } of crossings) {
    if (winding === 0) start = x;
    winding += turn;
    if (winding === 0 && x - start > 1) runs.push([start, x]);
  }
  return runs;
}

export interface LintFinding {
  glyph: string;
  text: string;
}

/** The scripts a stem is compared within: a Devanagari stem is not a Latin one. */
const SCRIPTS = ['Latin', 'Greek', 'Cyrillic', 'Armenian', 'Georgian', 'Hebrew', 'Arabic', 'Devanagari', 'Bengali', 'Gurmukhi', 'Gujarati', 'Oriya', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Thai', 'Lao'];
const scriptOf = (char: string): string | undefined => SCRIPTS.find((script) => new RegExp(`\\p{Script=${script}}`, 'u').test(char));

const median = (values: number[]): number => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;

/** The outline turned over its diagonal: x and y swapped, so that a vertical line is scanned as a horizontal one. */
function swapped(commands: Command[]): Command[] {
  return commands.map((c): Command => {
    if (c.type === 'Z') return c;
    if (c.type === 'Q') return { type: 'Q', x1: c.y1, y1: c.x1, x: c.y, y: c.x };
    if (c.type === 'C') return { type: 'C', x1: c.y1, y1: c.x1, x2: c.y2, y2: c.x2, x: c.y, y: c.x };
    return { type: c.type, x: c.y, y: c.x };
  });
}

/**
 * A letter's stroke. At three heights of its body, where the sides of a round letter are near upright, each run of
 * ink is measured across and up through its middle, the shorter kept (a bar of e is thin upward, a stem thin across).
 * The median of a height, so that a sliver where strokes join (k) is one width among many; the thinnest height, so
 * that the crossing of an x or a ж, at one height only, does not count.
 */
function stemOf(doc: FontDoc, glyph: Glyph, byName: Map<string, Glyph>): number | undefined {
  const box = glyphBounds(doc, glyph, byName);
  if (!box) return undefined;
  const commands = outline(doc, glyph, byName);
  const turned = swapped(commands);
  const [bottom, top] = [Math.max(0, box.yMin), Math.min(box.yMax, doc.metrics.capHeight)];
  const heights = [0.35, 0.5, 0.65].flatMap((share) => {
    const y = bottom + (top - bottom) * share;
    const widths = inkRuns(commands, y).map(([a, b]) => {
      const up = inkRuns(turned, (a + b) / 2).find(([from, to]) => from <= y && to >= y);
      return Math.min(b - a, up ? up[1] - up[0] : Infinity);
    });
    return widths.length > 0 ? [median(widths)] : [];
  });
  return heights.length > 0 ? Math.min(...heights) : undefined;
}

/** Strokes half again thicker, or two thirds as thick, as the median of their script's letters (five letters at least). */
function stems(doc: FontDoc, byName: Map<string, Glyph>): LintFinding[] {
  const byScript = new Map<string, { glyph: string; stem: number }[]>();
  for (const glyph of doc.glyphs) {
    if (glyph.unicode === undefined || glyph.advance === 0 || glyph.components?.length) continue;
    const char = String.fromCodePoint(glyph.unicode);
    const script = /\p{L}/u.test(char) ? scriptOf(char) : undefined;
    const stem = script ? stemOf(doc, glyph, byName) : undefined;
    if (script && stem) byScript.set(script, [...(byScript.get(script) ?? []), { glyph: glyph.name, stem }]);
  }
  return [...byScript].flatMap(([script, found]) => {
    if (found.length < 5) return [];
    const usual = median(found.map((f) => f.stem));
    return found
      .filter((f) => f.stem > usual * 1.5 || f.stem < usual / 1.5)
      .map((f) => ({ glyph: f.glyph, text: `stroke ${Math.round(f.stem)} wide where the ${script} letters have about ${Math.round(usual)}` }));
  });
}

/** Round letters stand on the baseline and reach the line above as flat ones do only if they pass them a little. */
function overshoots(doc: FontDoc, byName: Map<string, Glyph>): LintFinding[] {
  return [...'ocesOCGSQ'].flatMap((char) => {
    const glyph = doc.glyphs.find((g) => g.unicode === char.codePointAt(0));
    const box = glyph && !glyph.components?.length ? glyphBounds(doc, glyph, byName) : undefined;
    // A letter drawn without curves (pixels, cut corners) has nothing to pass the lines with.
    if (!glyph || !box || !outline(doc, glyph, byName).some((c) => c.type === 'Q' || c.type === 'C')) return [];
    const height = char === char.toLowerCase() ? doc.metrics.xHeight : doc.metrics.capHeight;
    const short = box.yMin >= 0 || box.yMax <= height;
    return short ? [{ glyph: glyph.name, text: `round but from ${Math.round(box.yMin)} to ${Math.round(box.yMax)}: let it pass the baseline and the ${height === doc.metrics.xHeight ? 'x-height' : 'cap height'} a little, or it looks smaller` }] : [];
  });
}

/**
 * Latin letters whose side has the shape of a reference letter's, and so the same side bearing: [reference, side,
 * letters]. A straight stem on the left of n is the one of h m r; the round left of o is the one of c d e q.
 */
const SIDES: [string, 'left' | 'right', string][] = [
  ['n', 'left', 'hmrbkpli'], ['n', 'right', 'hmu'], ['o', 'left', 'cdeq'], ['o', 'right', 'bp'],
  ['H', 'left', 'IEFLPRBDNMK'], ['H', 'right', 'INMU'], ['O', 'left', 'CGQ'], ['O', 'right', 'D'],
];

/** Side bearings that differ from their reference letter's by more than a quarter and 15 units. */
function sides(doc: FontDoc, byName: Map<string, Glyph>): LintFinding[] {
  // A monospaced font centres its narrow letters on purpose.
  const advances = new Set(doc.glyphs.filter((g) => g.unicode !== undefined && /\p{L}/u.test(String.fromCodePoint(g.unicode))).map((g) => g.advance));
  if (advances.size === 1) return [];
  const bearing = (char: string, side: 'left' | 'right'): number | undefined => {
    const glyph = doc.glyphs.find((g) => g.unicode === char.codePointAt(0));
    const box = glyph ? glyphBounds(doc, glyph, byName) : undefined;
    return glyph && box ? Math.round(side === 'left' ? box.xMin : glyph.advance - box.xMax) : undefined;
  };
  return SIDES.flatMap(([reference, side, letters]) => {
    const usual = bearing(reference, side);
    if (usual === undefined) return [];
    return [...letters].flatMap((char) => {
      const own = bearing(char, side);
      if (own === undefined || Math.abs(own - usual) <= Math.max(15, Math.abs(usual) / 4)) return [];
      return [{ glyph: byName.has(char) ? char : (doc.glyphs.find((g) => g.unicode === char.codePointAt(0))?.name ?? char), text: `${side} side bearing ${own} where ${reference} has ${usual}: the same shape of side takes the same space` }];
    });
  });
}

/** What departs from the font's own style, at most `limit` findings. */
export function lint(doc: FontDoc, limit = 40): LintFinding[] {
  const byName = glyphMap(doc);
  return [...stems(doc, byName), ...overshoots(doc, byName), ...sides(doc, byName)].slice(0, limit);
}
