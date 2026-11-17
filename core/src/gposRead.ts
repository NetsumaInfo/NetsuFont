// The kerning of a font's GPOS table, read as pairs of glyph indices: the PairPos lookups of the feature `kern`,
// inside Extension lookups too (opentype.js reads neither). Pairs by class are spread to every glyph of the class.

export interface Pair {
  left: number;
  right: number;
  value: number;
}

/** Past this, the pairs of a large font's classes are cut: the document keeps pairs one by one. */
export const MAX_PAIRS = 50000;

class In {
  constructor(private view: DataView) {}
  u16 = (at: number): number => this.view.getUint16(at);
  i16 = (at: number): number => this.view.getInt16(at);
  u32 = (at: number): number => this.view.getUint32(at);
  tag = (at: number): string => String.fromCharCode(...[0, 1, 2, 3].map((k) => this.view.getUint8(at + k)));
}

const bits = (value: number): number => [...value.toString(2)].filter((b) => b === '1').length;
/** The size of a ValueRecord, and where its XAdvance is (undefined when it has none). */
const record = (format: number): { size: number; advance?: number } => ({ size: bits(format) * 2, ...(format & 4 ? { advance: bits(format & 3) * 2 } : {}) });

function coverage(read: In, at: number): number[] {
  const count = read.u16(at + 2);
  if (read.u16(at) === 1) return Array.from({ length: count }, (_, i) => read.u16(at + 4 + i * 2));
  return Array.from({ length: count }, (_, i) => {
    const [start, end] = [read.u16(at + 4 + i * 6), read.u16(at + 6 + i * 6)];
    return Array.from({ length: end - start + 1 }, (_, k) => start + k);
  }).flat();
}

/** The glyphs of each class of a ClassDef, class 0 left out (every glyph not listed). */
function classes(read: In, at: number): Map<number, number[]> {
  const out = new Map<number, number[]>();
  const add = (glyph: number, value: number): void => {
    if (value !== 0) out.set(value, [...(out.get(value) ?? []), glyph]);
  };
  if (read.u16(at) === 1) {
    const [start, count] = [read.u16(at + 2), read.u16(at + 4)];
    for (let i = 0; i < count; i += 1) add(start + i, read.u16(at + 6 + i * 2));
  } else {
    for (let i = 0; i < read.u16(at + 2); i += 1) {
      const [start, end, value] = [read.u16(at + 4 + i * 6), read.u16(at + 6 + i * 6), read.u16(at + 8 + i * 6)];
      for (let glyph = start; glyph <= end; glyph += 1) add(glyph, value);
    }
  }
  return out;
}

function pairSets(read: In, at: number, out: Map<string, Pair>): void {
  const [first, second] = [record(read.u16(at + 4)), record(read.u16(at + 6))];
  if (first.advance === undefined) return;
  coverage(read, at + read.u16(at + 2)).forEach((left, i) => {
    const set = at + read.u16(at + 10 + i * 2);
    for (let k = 0; k < read.u16(set); k += 1) {
      const row = set + 2 + k * (2 + first.size + second.size);
      put(out, left, read.u16(row), read.i16(row + 2 + first.advance!));
    }
  });
}

function pairClasses(read: In, at: number, out: Map<string, Pair>): void {
  const [first, second] = [record(read.u16(at + 4)), record(read.u16(at + 6))];
  if (first.advance === undefined) return;
  const lefts = classes(read, at + read.u16(at + 8));
  const rights = classes(read, at + read.u16(at + 10));
  const [count1, count2] = [read.u16(at + 12), read.u16(at + 14)];
  const ofLeft = new Map([...lefts].flatMap(([value, glyphs]) => glyphs.map((glyph) => [glyph, value] as const)));
  for (const left of coverage(read, at + read.u16(at + 2))) {
    const c1 = ofLeft.get(left) ?? 0;
    if (c1 >= count1) continue;
    for (let c2 = 1; c2 < count2; c2 += 1) {
      const value = read.i16(at + 16 + (c1 * count2 + c2) * (first.size + second.size) + first.advance);
      if (value !== 0) for (const right of rights.get(c2) ?? []) put(out, left, right, value);
    }
  }
}

/** The first rule for a pair wins, as in a text engine. */
function put(out: Map<string, Pair>, left: number, right: number, value: number): void {
  const key = `${left} ${right}`;
  if (value !== 0 && !out.has(key) && out.size < MAX_PAIRS) out.set(key, { left, right, value });
}

/** The lookups the feature `kern` uses, under any script. */
function kernLookups(read: In): number[] {
  const list = read.u16(6);
  const found = new Set<number>();
  for (let i = 0; i < read.u16(list); i += 1) {
    if (read.tag(list + 2 + i * 6) !== 'kern') continue;
    const feature = list + read.u16(list + 6 + i * 6);
    for (let k = 0; k < read.u16(feature + 2); k += 1) found.add(read.u16(feature + 4 + k * 2));
  }
  return [...found].sort((a, b) => a - b);
}

/** Every kerning pair of a GPOS table, by glyph index, the change of the first glyph's advance. */
export function gposPairs(table: Uint8Array): Pair[] {
  const read = new In(new DataView(table.buffer, table.byteOffset, table.byteLength));
  const lookups = read.u16(8);
  const out = new Map<string, Pair>();
  for (const index of kernLookups(read)) {
    const lookup = lookups + read.u16(lookups + 2 + index * 2);
    for (let k = 0; k < read.u16(lookup + 4); k += 1) {
      let at = lookup + read.u16(lookup + 6 + k * 2);
      let type = read.u16(lookup);
      if (type === 9) [type, at] = [read.u16(at + 2), at + read.u32(at + 4)];
      if (type !== 2) continue;
      if (read.u16(at) === 1) pairSets(read, at, out);
      else pairClasses(read, at, out);
    }
  }
  return [...out.values()];
}
