import { composeLetters } from './accents';
import { outline } from './outline';
import { bounds, parsePath, transformPath, writePath } from './path';
import { shapesPath, type Shape } from './shapes';
import { FontError, type FontDoc, type Glyph, type Metrics, type Part } from './types';
import { validate } from './validate';

/** The small changes an agent makes to a font. `applyOps` applies a list of them, all or none. */
export type Op =
  | { op: 'set_glyph'; glyph: string; unicode?: number | null; advance?: number; path?: string; shapes?: Shape[]; components?: Part[] }
  | { op: 'remove_glyph'; glyph: string }
  | { op: 'copy_glyph'; from: string; to: string; unicode?: number | null }
  | { op: 'set_spacing'; glyph: string; left?: number; right?: number }
  | { op: 'center'; glyphs: string[]; advance: number }
  | { op: 'transform'; glyphs?: string[]; scale?: number | [number, number]; slant?: number; translate?: [number, number] }
  | { op: 'decompose'; glyph: string }
  | { op: 'set_kern'; left: string; right: string; value: number }
  | { op: 'set_metrics'; metrics: Partial<Metrics> }
  | { op: 'set_info'; family?: string; style?: string }
  | { op: 'compose'; chars: string };

export const OP_NAMES = ['set_glyph', 'remove_glyph', 'copy_glyph', 'set_spacing', 'center', 'transform', 'decompose', 'set_kern', 'set_metrics', 'set_info', 'compose'] as const;

/** A deep copy: a document is plain JSON. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function find(doc: FontDoc, name: string): Glyph {
  const glyph = doc.glyphs.find((g) => g.name === name);
  if (!glyph) throw new FontError('glyph_not_found', `No glyph named "${name}". Create it with set_glyph.`);
  return glyph;
}

function setGlyph(doc: FontDoc, op: Extract<Op, { op: 'set_glyph' }>): void {
  let glyph = doc.glyphs.find((g) => g.name === op.glyph);
  if (!glyph) {
    glyph = { name: op.glyph, advance: Math.round(doc.unitsPerEm * 0.6), path: '' };
    doc.glyphs.push(glyph);
  }
  if (op.unicode === null) delete glyph.unicode;
  else if (op.unicode !== undefined) glyph.unicode = op.unicode;
  if (op.advance !== undefined) glyph.advance = op.advance;
  if (op.path !== undefined || op.shapes !== undefined) glyph.path = (op.path ?? '') + (op.shapes ? shapesPath(op.shapes) : '');
  if (op.components !== undefined) {
    if (op.components.length === 0) delete glyph.components;
    else glyph.components = op.components.map(({ glyph: part, x, y }) => ({ glyph: part, x, y }));
  }
}

function removeGlyph(doc: FontDoc, name: string): void {
  find(doc, name);
  const user = doc.glyphs.find((g) => g.components?.some((part) => part.glyph === name));
  if (user) throw new FontError('glyph_in_use', `"${user.name}" uses "${name}" as a component. Decompose or change it first.`);
  doc.glyphs = doc.glyphs.filter((g) => g.name !== name);
  doc.kerning = doc.kerning.filter((kern) => kern.left !== name && kern.right !== name);
}

/** Moves the drawing so that its left side bearing is `left`, and sets the advance so that the right one is `right`. */
function setSpacing(doc: FontDoc, op: Extract<Op, { op: 'set_spacing' }>): void {
  const glyph = find(doc, op.glyph);
  const box = bounds(outline(doc, glyph));
  if (!box) {
    if (op.left !== undefined || op.right !== undefined) glyph.advance = Math.max(0, (op.left ?? 0) + (op.right ?? 0));
    return;
  }
  const shift = op.left === undefined ? 0 : op.left - box.xMin;
  const right = op.right ?? glyph.advance - box.xMax;
  glyph.path = writePath(transformPath(parsePath(glyph.path), [1, 0, 0, 1, shift, 0]));
  glyph.components = glyph.components?.map((part) => ({ ...part, x: part.x + shift }));
  glyph.advance = Math.max(0, Math.round(box.xMax + shift + right));
}

/** One advance for every glyph named, the ink centred in it: the figures of a table, a monospaced font. */
function center(doc: FontDoc, op: Extract<Op, { op: 'center' }>): void {
  for (const name of op.glyphs) {
    const box = bounds(outline(doc, find(doc, name)));
    const side = box ? Math.round((op.advance - (box.xMax - box.xMin)) / 2) : 0;
    setSpacing(doc, { op: 'set_spacing', glyph: name, left: side, right: op.advance - side - (box ? box.xMax - box.xMin : 0) });
    find(doc, name).advance = op.advance;
  }
}

/**
 * Scales, then slants (degrees, positive leans right, as an italic), then moves the outlines. The advance follows the
 * width. A negative x scale mirrors the glyph inside its advance: N into И.
 */
function transform(doc: FontDoc, op: Extract<Op, { op: 'transform' }>): void {
  const [sx, sy] = typeof op.scale === 'number' ? [op.scale, op.scale] : (op.scale ?? [1, 1]);
  const skew = Math.tan(((op.slant ?? 0) * Math.PI) / 180);
  const [dx, dy] = op.translate ?? [0, 0];
  const names = op.glyphs ?? doc.glyphs.map((g) => g.name);
  for (const name of names) {
    const glyph = find(doc, name);
    // A negative scale mirrors: the glyph is moved back into its advance.
    const matrix = [sx, 0, skew * sy, sy, dx + (sx < 0 ? -sx * glyph.advance : 0), dy];
    glyph.path = writePath(transformPath(parsePath(glyph.path), matrix));
    // A component is moved where its own glyph, transformed too, now sits only if that glyph is in the list.
    glyph.components = glyph.components?.map((part) => ({ ...part, x: Math.round(sx * part.x + skew * sy * part.y), y: Math.round(sy * part.y) }));
    glyph.advance = Math.round(glyph.advance * Math.abs(sx));
  }
}

function decompose(doc: FontDoc, name: string): void {
  const glyph = find(doc, name);
  glyph.path = writePath(outline(doc, glyph));
  delete glyph.components;
}

/** A glyph name, or a character the font draws: "period" or ".", "uni0431" or "б". */
function nameFor(doc: FontDoc, wanted: string): string {
  if (doc.glyphs.some((g) => g.name === wanted)) return wanted;
  const byChar = [...wanted].length === 1 ? doc.glyphs.find((g) => g.unicode === wanted.codePointAt(0)) : undefined;
  return byChar ? byChar.name : find(doc, wanted).name;
}

function setKern(doc: FontDoc, raw: Extract<Op, { op: 'set_kern' }>): void {
  const op = { ...raw, left: nameFor(doc, raw.left), right: nameFor(doc, raw.right) };
  doc.kerning = doc.kerning.filter((kern) => kern.left !== op.left || kern.right !== op.right);
  if (op.value !== 0) doc.kerning.push({ left: op.left, right: op.right, value: op.value });
}

function apply(doc: FontDoc, op: Op): void {
  switch (op.op) {
    case 'set_glyph':
      return setGlyph(doc, op);
    case 'remove_glyph':
      return removeGlyph(doc, op.glyph);
    case 'copy_glyph': {
      const from = find(doc, op.from);
      if (doc.glyphs.some((g) => g.name === op.to)) throw new FontError('glyph_exists', `A glyph named "${op.to}" exists already.`);
      const copy: Glyph = { ...clone(from), name: op.to };
      delete copy.unicode;
      if (typeof op.unicode === 'number') copy.unicode = op.unicode;
      doc.glyphs.push(copy);
      return;
    }
    case 'set_spacing':
      return setSpacing(doc, op);
    case 'center':
      return center(doc, op);
    case 'transform':
      return transform(doc, op);
    case 'decompose':
      return decompose(doc, op.glyph);
    case 'set_kern':
      return setKern(doc, op);
    case 'set_metrics':
      doc.metrics = { ...doc.metrics, ...op.metrics };
      return;
    case 'set_info':
      if (op.family !== undefined) doc.family = op.family;
      if (op.style !== undefined) doc.style = op.style;
      return;
    case 'compose':
      if (typeof op.chars !== 'string' || op.chars === '') throw new FontError('bad_op', 'compose takes chars: the letters to make, such as "éèêë".');
      composeLetters(doc, op.chars);
      return;
    default:
      throw new FontError('bad_op', `Unknown op "${(op as { op: unknown }).op}". Ops: ${OP_NAMES.join(', ')}.`);
  }
}

/** Applies every op to a copy and returns it, valid, or throws and changes nothing. */
export function applyOps(doc: FontDoc, ops: Op[]): FontDoc {
  const next = clone(doc);
  ops.forEach((op, index) => {
    try {
      apply(next, op);
    } catch (error) {
      if (error instanceof FontError) throw new FontError(error.code, `op ${index + 1} (${op.op}): ${error.message}`);
      throw error;
    }
  });
  validate(next);
  return next;
}
