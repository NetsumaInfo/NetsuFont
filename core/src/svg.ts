import { layout } from './layout';
import { glyphMap, outline } from './outline';
import { writePath } from './path';
import type { FontDoc, Glyph } from './types';

export interface Colors {
  ink: string;
  paper: string;
  guide: string;
  label: string;
}

export const LIGHT: Colors = { ink: '#16181d', paper: '#ffffff', guide: '#c8ccd4', label: '#888d99' };

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The SVG path data of a whole glyph, y turned down, origin at the baseline. */
export function glyphPath(doc: FontDoc, glyph: Glyph, byName = glyphMap(doc)): string {
  return writePath(outline(doc, glyph, byName), true);
}

/** The lines a glyph is drawn against, from x0 to x1: baseline, x-height, cap height, ascender, descender. */
function guides(doc: FontDoc, x0: number, x1: number, color: string): string {
  const { ascender, descender, capHeight, xHeight } = doc.metrics;
  const width = doc.unitsPerEm / 250;
  return [0, xHeight, capHeight, ascender, descender]
    .map((y, index) => `<line x1="${x0}" x2="${x1}" y1="${-y}" y2="${-y}" stroke="${color}" stroke-width="${index === 0 ? width * 2 : width}"/>`)
    .join('');
}

/** The height of a cell: the ascender to the descender, with a margin. */
function band(doc: FontDoc): { top: number; height: number } {
  const margin = doc.unitsPerEm * 0.1;
  const top = Math.max(doc.metrics.ascender, doc.metrics.capHeight) + margin;
  return { top, height: top - doc.metrics.descender + margin };
}

export interface SheetOptions {
  columns?: number;
  colors?: Colors;
  /** Draw the metric lines and the advance of each glyph. */
  guides?: boolean;
  /**
   * Another font drawn under each glyph in a light colour, as on tracing paper: the glyph of the same character,
   * scaled so that both fonts' cap heights match. To draw a script from a model.
   */
  under?: FontDoc;
}

/** The model's glyph of the same character, under the cell's own glyph, centred in the cell. */
function underlay(doc: FontDoc, model: FontDoc, glyph: Glyph, cell: number): string {
  const found = model.glyphs.find((g) => (glyph.unicode !== undefined ? g.unicode === glyph.unicode : g.name === glyph.name));
  if (!found) return '';
  const scale = doc.metrics.capHeight / model.metrics.capHeight;
  const left = (cell - found.advance * scale) / 2;
  return `<path transform="translate(${left} 0) scale(${scale})" d="${glyphPath(model, found)}" fill="#6aa5ff" fill-opacity="0.45"/>`;
}

/**
 * Glyphs side by side in cells of one em, their names under them: one picture of many glyphs.
 * The advance is drawn as two thin uprights.
 */
export function glyphSheet(doc: FontDoc, glyphs: Glyph[], options: SheetOptions = {}): string {
  const colors = options.colors ?? LIGHT;
  const columns = Math.max(1, Math.min(options.columns ?? 8, glyphs.length));
  const byName = glyphMap(doc);
  const { top, height } = band(doc);
  const cell = Math.max(doc.unitsPerEm, ...glyphs.map((g) => g.advance)) * 1.15;
  const label = doc.unitsPerEm * 0.12;
  const rowHeight = height + label * 1.6;
  const rows = Math.ceil(glyphs.length / columns);
  const cells = glyphs.map((glyph, index) => {
    const x = (index % columns) * cell;
    const y = Math.floor(index / columns) * rowHeight + top;
    const left = (cell - glyph.advance) / 2;
    const marks = options.guides === false ? '' : guides(doc, 0, cell, colors.guide) + [0, glyph.advance].map((ax) => `<line x1="${left + ax}" x2="${left + ax}" y1="${-top}" y2="${-doc.metrics.descender}" stroke="${colors.guide}" stroke-width="${doc.unitsPerEm / 250}"/>`).join('');
    // A uniXXXX name says nothing at a glance: the character follows it.
    const said = glyph.name.startsWith('uni') && glyph.unicode !== undefined ? `${glyph.name} ${String.fromCodePoint(glyph.unicode)}` : glyph.name;
    const name = `<text x="${cell / 2}" y="${height - top + label * 1.2}" font-size="${label}" font-family="monospace" text-anchor="middle" fill="${colors.label}">${escape(said)}</text>`;
    const model = options.under ? underlay(doc, options.under, glyph, cell) : '';
    return `<g transform="translate(${x} ${y})">${marks}${model}<path transform="translate(${left} 0)" d="${glyphPath(doc, glyph, byName)}" fill="${colors.ink}" fill-opacity="${model ? 0.8 : 1}"/>${name}</g>`;
  });
  const width = columns * cell;
  const total = Math.max(1, rows) * rowHeight;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${total}" width="${Math.round(width / 5)}" height="${Math.round(total / 5)}"><rect width="${width}" height="${total}" fill="${colors.paper}"/>${cells.join('')}</svg>`;
}

/** One glyph, large, on its metric lines. */
export function glyphSvg(doc: FontDoc, glyph: Glyph, colors: Colors = LIGHT): string {
  return glyphSheet(doc, [glyph], { columns: 1, colors });
}

export interface ProofOptions {
  /** The size of each line in pixels, top to bottom. */
  sizes?: number[];
  colors?: Colors;
  /** The widest the picture may be, in pixels: as wide as the longest line, up to this. */
  width?: number;
  /** Optional features turned on, such as ss01. Joining forms and ligatures are always on. */
  features?: string[];
}

/**
 * The text set with the font at several sizes, one line per size, drawn from the document itself:
 * the advances, kerning and features as a font file will have them, right-to-left text set right to left. "
" starts a new line. Lines too long are cut.
 */
export function proofSvg(doc: FontDoc, text: string, options: ProofOptions = {}): { svg: string; missing: string[]; cut: boolean; fits: number } {
  const colors = options.colors ?? LIGHT;
  const sizes = options.sizes ?? [72, 36, 18];
  const byName = glyphMap(doc);
  const rows = text.split('\n').map((line) => layout(doc, line, options.features));
  const missing = [...new Set(rows.flatMap((row) => row.missing))];
  const { top, height } = band(doc);
  const pad = 16;
  const widest = Math.max(...rows.map((row) => row.width)) * (Math.max(...sizes) / doc.unitsPerEm) + pad * 2;
  const width = Math.min(options.width ?? 2400, Math.max(400, Math.ceil(widest)));
  let y = pad;
  const lines = sizes.flatMap((size) => {
    const scale = size / doc.unitsPerEm;
    const drawn = rows.map(({ placed }) => {
      const shapes = placed.map(({ glyph, x, y }) => `<path transform="translate(${x} ${-y})" d="${glyphPath(doc, glyph, byName)}"/>`).join('');
      const line = `<g transform="translate(${pad} ${y + top * scale}) scale(${scale})" fill="${colors.ink}">${shapes}</g>`;
      y += height * scale;
      return line;
    });
    y += pad / 2;
    return drawn;
  });
  const total = Math.ceil(y + pad / 2);
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${total}" width="${width}" height="${total}"><rect width="${width}" height="${total}" fill="${colors.paper}"/>${lines.join('')}</svg>`,
    missing,
    cut: widest > width,
    fits: fitting(rows, width - pad * 2, Math.max(...sizes) / doc.unitsPerEm),
  };
}

/** About how many characters of these lines fit in a width at a scale: for the agent to split a line that is cut. */
function fitting(rows: { placed: unknown[]; width: number }[], room: number, scale: number): number {
  const glyphs = rows.reduce((sum, row) => sum + row.placed.length, 0);
  const width = rows.reduce((sum, row) => sum + row.width, 0);
  return glyphs === 0 || width === 0 ? 0 : Math.floor(room / ((width / glyphs) * scale));
}
