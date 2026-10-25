/// <reference path="./opentype.d.ts" />
import opentype, { type Font as OtFont, type Glyph as OtGlyph, type Path as OtPath } from 'opentype.js';
import { glyphMap, outline } from './outline';
import { writePath, type Command } from './path';
import { kernTable, withTable } from './sfnt';
import { FontError, FORMAT, type FontDoc, type Glyph, type Kern } from './types';
import { GLYPH_NAME, validate } from './validate';

function toPath(commands: Command[]): OtPath {
  const path = new opentype.Path();
  for (const c of commands) {
    if (c.type === 'M') path.moveTo(c.x, c.y);
    else if (c.type === 'L') path.lineTo(c.x, c.y);
    else if (c.type === 'Q') path.quadraticCurveTo(c.x1, c.y1, c.x, c.y);
    else if (c.type === 'C') path.bezierCurveTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y);
    else path.close();
  }
  return path;
}

/** The empty box a font shows for a character it lacks: a rectangle with a hole, as is usual. */
function notdef(doc: FontDoc): OtGlyph {
  const em = doc.unitsPerEm;
  const [l, r, b, t, w] = [em * 0.06, em * 0.44, 0, doc.metrics.capHeight, em * 0.05];
  const commands: Command[] = [
    { type: 'M', x: l, y: b }, { type: 'L', x: r, y: b }, { type: 'L', x: r, y: t }, { type: 'L', x: l, y: t }, { type: 'Z' },
    { type: 'M', x: l + w, y: b + w }, { type: 'L', x: l + w, y: t - w }, { type: 'L', x: r - w, y: t - w }, { type: 'L', x: r - w, y: b + w }, { type: 'Z' },
  ];
  return new opentype.Glyph({ name: '.notdef', advanceWidth: Math.round(em * 0.5), path: toPath(commands) });
}

/**
 * The font as an OpenType file with CFF outlines (.otf). Components are drawn into each glyph, quadratic
 * curves become cubic, and the kerning is written as a `kern` table.
 */
export function exportOtf(doc: FontDoc): Uint8Array {
  validate(doc);
  const byName = glyphMap(doc);
  const own = doc.glyphs.filter((glyph) => glyph.name !== '.notdef');
  const glyphs = [notdef(doc), ...own.map((glyph) => new opentype.Glyph({ name: glyph.name, ...(glyph.unicode === undefined ? {} : { unicode: glyph.unicode }), advanceWidth: glyph.advance, path: toPath(outline(doc, glyph, byName)) }))];
  const font = new opentype.Font({
    familyName: doc.family,
    styleName: doc.style,
    unitsPerEm: doc.unitsPerEm,
    ascender: doc.metrics.ascender,
    descender: doc.metrics.descender,
    glyphs,
    tables: { os2: { sxHeight: doc.metrics.xHeight, sCapHeight: doc.metrics.capHeight } },
  });
  const bytes = new Uint8Array(font.toArrayBuffer());
  if (doc.kerning.length === 0) return bytes;
  // .notdef is index 0: the glyphs of the document follow in their order.
  const index = new Map(own.map((glyph, at) => [glyph.name, at + 1]));
  const pairs = doc.kerning.map((kern) => ({ left: index.get(kern.left)!, right: index.get(kern.right)!, value: kern.value }));
  return withTable(bytes, 'kern', kernTable(pairs));
}

function fromPath(path: OtPath): string {
  const commands = path.commands.map((c: OtPath['commands'][number]): Command => {
    if (c.type === 'Z') return { type: 'Z' };
    if (c.type === 'Q') return { type: 'Q', x1: c.x1!, y1: c.y1!, x: c.x!, y: c.y! };
    if (c.type === 'C') return { type: 'C', x1: c.x1!, y1: c.y1!, x2: c.x2!, y2: c.y2!, x: c.x!, y: c.y! };
    return { type: c.type, x: c.x!, y: c.y! };
  });
  return writePath(commands);
}

/** A glyph name the format accepts, unique: the font's own when it can be, else one made from the code point. */
function nameFor(glyph: OtGlyph, index: number, taken: Set<string>): string {
  const own = glyph.name ?? '';
  let name = GLYPH_NAME.test(own) ? own : glyph.unicode !== undefined ? `uni${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')}` : `glyph${index}`;
  while (taken.has(name)) name += '.dup';
  taken.add(name);
  return name;
}

/**
 * Reads a TTF or OTF file into a document. What is kept: names, metrics, outlines, advances, one code point per
 * glyph, and kerning from a `kern` table. Not kept: GPOS kerning, hinting, features such as ligatures.
 */
export function importFont(bytes: Uint8Array, name: string): { doc: FontDoc; skipped: string[] } {
  let font: OtFont;
  try {
    font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  } catch (error) {
    throw new FontError('bad_font_file', `This file could not be read as a font: ${(error as Error).message}`);
  }
  const taken = new Set<string>();
  const seen = new Set<number>();
  const glyphs: Glyph[] = [];
  const names: string[] = [];
  for (let index = 0; index < font.glyphs.length; index += 1) {
    const source = font.glyphs.get(index);
    const glyphName = nameFor(source, index, taken);
    names.push(glyphName);
    const glyph: Glyph = { name: glyphName, advance: Math.max(0, Math.round(source.advanceWidth ?? 0)), path: fromPath(source.path) };
    if (source.unicode !== undefined && !seen.has(source.unicode)) {
      glyph.unicode = source.unicode;
      seen.add(source.unicode);
    }
    glyphs.push(glyph);
  }
  const doc = toDoc(font, name, glyphs, readKerning(font, names));
  validate(doc);
  return { doc, skipped: ['GPOS kerning', 'hinting', 'OpenType features'] };
}

/** The pairs of a `kern` table, by glyph name. */
function readKerning(font: OtFont, names: string[]): Kern[] {
  return Object.entries(font.kerningPairs ?? {}).flatMap(([key, value]) => {
    const [left, right] = key.split(',').map(Number);
    const pair = { left: names[left!], right: names[right!], value: Math.round(value) };
    return pair.left && pair.right && pair.value !== 0 ? [pair as Kern] : [];
  });
}

function toDoc(font: OtFont, name: string, glyphs: Glyph[], kerning: Kern[]): FontDoc {
  const em = font.unitsPerEm;
  return {
    format: FORMAT,
    name,
    family: font.getEnglishName('fontFamily') || name,
    style: font.getEnglishName('fontSubfamily') || 'Regular',
    unitsPerEm: em,
    metrics: { ascender: font.ascender, descender: Math.min(0, font.descender), capHeight: font.tables.os2?.sCapHeight || Math.round(em * 0.7), xHeight: font.tables.os2?.sxHeight || Math.round(em * 0.5) },
    glyphs,
    kerning,
  };
}
