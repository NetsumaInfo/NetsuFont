import { parsePath } from './path';
import { FontError, FORMAT, type FontDoc, type Glyph } from './types';

export const FONT_NAME = /^[a-z0-9][a-z0-9-]*$/;
/** The names a font may give its glyphs: those of the Adobe Glyph List and their `.alt` forms. */
export const GLYPH_NAME = /^[A-Za-z_.][A-Za-z0-9_.-]*$/;
/** The largest em a font file can hold. */
const MAX_EM = 16384;

function fail(code: string, message: string): never {
  throw new FontError(code, message);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function checkGlyph(glyph: Glyph, names: Set<string>): void {
  const where = `glyph "${glyph.name}"`;
  if (typeof glyph.name !== 'string' || !GLYPH_NAME.test(glyph.name)) fail('bad_glyph_name', `${where}: a glyph name is letters, digits, "_", "." and "-", and does not start with a digit.`);
  if (glyph.unicode !== undefined && (!Number.isInteger(glyph.unicode) || glyph.unicode < 0 || glyph.unicode > 0x10ffff)) fail('bad_unicode', `${where}: unicode is a code point, from 0 to 0x10FFFF.`);
  if (!isNumber(glyph.advance) || glyph.advance < 0) fail('bad_advance', `${where}: the advance is a number, 0 or more.`);
  if (typeof glyph.path !== 'string') fail('bad_path', `${where}: the path is a string of SVG path data, "" for an empty glyph.`);
  try {
    parsePath(glyph.path);
  } catch (error) {
    if (error instanceof FontError) fail(error.code, `${where}: ${error.message}`);
    throw error;
  }
  for (const part of glyph.components ?? []) {
    if (!names.has(part.glyph)) fail('component_not_found', `${where}: no glyph named "${part.glyph}" to use as a component.`);
    if (!isNumber(part.x) || !isNumber(part.y)) fail('bad_component', `${where}: a component has numbers x and y.`);
  }
}

/** A component that holds its own glyph, at any depth, would never end. */
function checkCycles(doc: FontDoc): void {
  const byName = new Map(doc.glyphs.map((glyph) => [glyph.name, glyph]));
  const done = new Set<string>();
  const visit = (name: string, trail: string[]): void => {
    if (trail.includes(name)) fail('component_cycle', `The components loop: ${[...trail, name].join(' > ')}.`);
    if (done.has(name)) return;
    for (const part of byName.get(name)?.components ?? []) visit(part.glyph, [...trail, name]);
    done.add(name);
  };
  for (const glyph of doc.glyphs) visit(glyph.name, []);
}

function checkMetrics(doc: FontDoc): void {
  const { ascender, descender, capHeight, xHeight } = doc.metrics ?? {};
  if (![ascender, descender, capHeight, xHeight].every(isNumber)) fail('bad_metrics', 'The metrics are four numbers: ascender, descender, capHeight, xHeight.');
  if (ascender! <= 0 || descender! > 0) fail('bad_metrics', 'The ascender is above the baseline (more than 0) and the descender below it (0 or less).');
  if (xHeight! <= 0 || capHeight! <= 0) fail('bad_metrics', 'The x-height and the cap height are above the baseline: more than 0.');
}

/** Throws a `FontError` that says what to fix unless the document can be drawn and exported. */
export function validate(doc: FontDoc): void {
  if (doc.format !== FORMAT) fail('bad_format', `This is format ${String(doc.format)}; this version reads format ${FORMAT}.`);
  if (typeof doc.name !== 'string' || !FONT_NAME.test(doc.name)) fail('bad_name', 'The name of a font is lowercase letters, digits and dashes.');
  if (typeof doc.family !== 'string' || doc.family.trim() === '') fail('bad_family', 'The family name is a word or a few, such as "Netsu Pixel".');
  if (typeof doc.style !== 'string' || doc.style.trim() === '') fail('bad_style', 'The style is a word, such as "Regular".');
  if (!Number.isInteger(doc.unitsPerEm) || doc.unitsPerEm < 16 || doc.unitsPerEm > MAX_EM) fail('bad_em', `unitsPerEm is a whole number from 16 to ${MAX_EM}.`);
  checkMetrics(doc);
  const names = new Set<string>();
  const unicodes = new Map<number, string>();
  for (const glyph of doc.glyphs) {
    if (names.has(glyph.name)) fail('duplicate_glyph', `Two glyphs are named "${glyph.name}".`);
    names.add(glyph.name);
    if (glyph.unicode === undefined) continue;
    const other = unicodes.get(glyph.unicode);
    if (other !== undefined) fail('duplicate_unicode', `"${other}" and "${glyph.name}" both draw U+${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')}.`);
    unicodes.set(glyph.unicode, glyph.name);
  }
  for (const glyph of doc.glyphs) checkGlyph(glyph, names);
  checkCycles(doc);
  for (const kern of doc.kerning) {
    if (!names.has(kern.left) || !names.has(kern.right)) fail('kern_glyph_not_found', `The kerning pair ${kern.left} ${kern.right} names a glyph that does not exist.`);
    if (!Number.isInteger(kern.value) || Math.abs(kern.value) > doc.unitsPerEm) fail('bad_kern', `The kerning of ${kern.left} ${kern.right} is a whole number, at most one em.`);
  }
}
