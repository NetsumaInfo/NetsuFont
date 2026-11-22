/// <reference path="./opentype.d.ts" />
// TrueType outlines (.ttf) from the OTF this writes: the same tables, with `glyf`, `loca` and a `maxp` of version 1
// in place of `CFF `. Cubic curves become quadratic ones, split until they stray less than half a unit.
import opentype, { type Path as OtPath } from 'opentype.js';
import { readTables, writeTables, type Table } from './sfnt';

type Point = [number, number];
/** A contour as TrueType holds it: points on the curve and control points off it. */
type Contour = { x: number; y: number; on: boolean }[];

const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** One cubic as quadratics: its control points, each followed by the point the quadratic ends on. */
function quadratics(p0: Point, c1: Point, c2: Point, p3: Point, depth = 0): [Point, Point][] {
  const control: Point = [(3 * (c1[0] + c2[0]) - p0[0] - p3[0]) / 4, (3 * (c1[1] + c2[1]) - p0[1] - p3[1]) / 4];
  // How far one quadratic strays from the cubic, at most (√3/36 of this third difference).
  const error = (Math.sqrt(3) / 36) * Math.hypot(p3[0] - 3 * c2[0] + 3 * c1[0] - p0[0], p3[1] - 3 * c2[1] + 3 * c1[1] - p0[1]);
  if (error <= 0.5 || depth > 6) return [[control, p3]];
  const [a, b, c] = [mid(p0, c1), mid(c1, c2), mid(c2, p3)];
  const [d, e] = [mid(a, b), mid(b, c)];
  const half = mid(d, e);
  return [...quadratics(p0, a, d, half, depth + 1), ...quadratics(half, e, c, p3, depth + 1)];
}

/** The contours of a glyph's path, whole units, the closing point not repeated. */
function contours(commands: OtPath['commands']): Contour[] {
  const out: Contour[] = [];
  let current: Contour = [];
  let at: Point = [0, 0];
  const add = (x: number, y: number, on: boolean): void => {
    current.push({ x: Math.round(x), y: Math.round(y), on });
  };
  for (const c of commands) {
    if (c.type === 'M') {
      if (current.length > 0) out.push(current);
      current = [];
      add(c.x!, c.y!, true);
    } else if (c.type === 'L') add(c.x!, c.y!, true);
    else if (c.type === 'Q') {
      add(c.x1!, c.y1!, false);
      add(c.x!, c.y!, true);
    } else if (c.type === 'C') {
      for (const [control, end] of quadratics(at, [c.x1!, c.y1!], [c.x2!, c.y2!], [c.x!, c.y!])) {
        add(control[0], control[1], false);
        add(end[0], end[1], true);
      }
    }
    if (c.type !== 'Z') at = [c.x!, c.y!];
  }
  if (current.length > 0) out.push(current);
  return out.map((contour) => {
    const [first, last] = [contour[0]!, contour[contour.length - 1]!];
    return contour.length > 1 && last.on && last.x === first.x && last.y === first.y ? contour.slice(0, -1) : contour;
  }).filter((contour) => contour.length > 1);
}

/** Big-endian bytes, appended. */
class Bytes {
  data: number[] = [];
  u8 = (v: number): void => void this.data.push(v & 0xff);
  u16 = (v: number): void => void this.data.push((v >> 8) & 0xff, v & 0xff);
  i16 = (v: number): void => this.u16(v < 0 ? v + 0x10000 : v);
  u32 = (v: number): void => (this.u16(Math.floor(v / 0x10000)), this.u16(v % 0x10000));
}

/** One glyph's entry of `glyf`, a simple glyph: every point with its flag, x and y as 16-bit deltas. */
function glyphEntry(found: Contour[]): number[] {
  if (found.length === 0) return [];
  const points = found.flat();
  const out = new Bytes();
  out.i16(found.length);
  [Math.min(...points.map((p) => p.x)), Math.min(...points.map((p) => p.y)), Math.max(...points.map((p) => p.x)), Math.max(...points.map((p) => p.y))].forEach(out.i16);
  let end = -1;
  for (const contour of found) out.u16((end += contour.length));
  out.u16(0);
  points.forEach((p) => out.u8(p.on ? 1 : 0));
  for (const axis of ['x', 'y'] as const) points.forEach((p, i) => out.i16(p[axis] - (i === 0 ? 0 : points[i - 1]![axis])));
  while (out.data.length % 4 !== 0) out.u8(0);
  return out.data;
}

function maxp(count: number, all: Contour[][]): Uint8Array {
  const out = new Bytes();
  out.u32(0x10000);
  out.u16(count);
  out.u16(Math.max(0, ...all.map((found) => found.flat().length)));
  out.u16(Math.max(0, ...all.map((found) => found.length)));
  // Composites, zones (2: no twilight), storage, functions, instructions, stack, components: none.
  [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0].forEach(out.u16);
  return Uint8Array.from(out.data);
}

/**
 * `hmtx` with each glyph's left side bearing equal to its xMin, and `hhea` saying every glyph has its own entry:
 * TrueType engines place an outline by them, where a CFF font's are only informative.
 */
function metrics(tables: Table[], all: Contour[][], advances: number[]): Table[] {
  const hmtx = new Bytes();
  all.forEach((found, i) => {
    hmtx.u16(advances[i]!);
    hmtx.i16(found.length === 0 ? 0 : Math.min(...found.flat().map((p) => p.x)));
  });
  const hhea = tables.find((table) => table.tag === 'hhea')!.data.slice();
  new DataView(hhea.buffer).setUint16(34, all.length);
  return [{ tag: 'hmtx', data: Uint8Array.from(hmtx.data) }, { tag: 'hhea', data: hhea }];
}

/** The font of an OTF file this exports, with TrueType outlines. */
export function ttfFromOtf(otf: Uint8Array): Uint8Array {
  const font = opentype.parse(otf.buffer.slice(otf.byteOffset, otf.byteOffset + otf.byteLength) as ArrayBuffer);
  const all = Array.from({ length: font.glyphs.length }, (_, i) => contours(font.glyphs.get(i).path.commands));
  const glyf = new Bytes();
  const loca = new Bytes();
  for (const found of all) {
    loca.u32(glyf.data.length);
    glyf.data.push(...glyphEntry(found));
  }
  loca.u32(glyf.data.length);
  const { tables } = readTables(otf);
  const advances = Array.from({ length: font.glyphs.length }, (_, i) => Math.round(font.glyphs.get(i).advanceWidth ?? 0));
  const kept = tables.filter((table) => !['CFF ', 'maxp', 'hmtx', 'hhea'].includes(table.tag)).map((table): Table => {
    if (table.tag !== 'head') return table;
    const head = table.data.slice();
    // indexToLocFormat 1: offsets of 32 bits.
    new DataView(head.buffer).setInt16(50, 1);
    return { tag: 'head', data: head };
  });
  const added: Table[] = [{ tag: 'glyf', data: Uint8Array.from(glyf.data) }, { tag: 'loca', data: Uint8Array.from(loca.data) }, { tag: 'maxp', data: maxp(all.length, all) }];
  return writeTables(0x10000, [...kept, ...added, ...metrics(tables, all, advances)]);
}
