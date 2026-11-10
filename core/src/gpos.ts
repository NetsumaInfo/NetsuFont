// GDEF and GPOS tables written by hand: opentype.js writes neither. GDEF says which glyphs are marks; GPOS attaches
// each mark to its letter (`mark`) and to the mark under it (`mkmk`), at the anchors of `marks.ts`.
import { anchors, PLACES, type Anchor, type MarkPlace } from './marks';
import type { FontDoc } from './types';

/** Big-endian bytes, written in order. */
class Out {
  private bytes: number[] = [];
  u32(value: number): this {
    return this.u16(Math.floor(value / 0x10000)).u16(value % 0x10000);
  }
  u16(value: number): this {
    this.bytes.push((value >> 8) & 0xff, value & 0xff);
    return this;
  }
  i16(value: number): this {
    return this.u16(value < 0 ? value + 0x10000 : value);
  }
  tag(value: string): this {
    for (const char of value.padEnd(4)) this.bytes.push(char.charCodeAt(0));
    return this;
  }
  add(data: Uint8Array): this {
    // A loop, not push(...data): a subtable of thousands of glyphs passes the limit of a call's arguments.
    for (const byte of data) this.bytes.push(byte);
    return this;
  }
  get size(): number {
    return this.bytes.length;
  }
  done(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/** A table that points at its children: the header, then each child, offsets counted from the start. */
function withChildren(head: (offsets: number[]) => Out, children: Uint8Array[]): Uint8Array {
  const size = head(children.map(() => 0)).size;
  const offsets: number[] = [];
  let at = size;
  for (const child of children) {
    offsets.push(at);
    at += child.length;
  }
  if (at > 0xffff) throw new Error('A GPOS subtable is too large: split it.');
  const out = head(offsets);
  children.forEach((child) => out.add(child));
  return out.done();
}

const coverage = (glyphs: number[]): Uint8Array => {
  const out = new Out().u16(1).u16(glyphs.length);
  glyphs.forEach((glyph) => out.u16(glyph));
  return out.done();
};

const anchor = ([x, y]: Anchor): Uint8Array => new Out().u16(1).i16(x).i16(y).done();

interface Attached {
  glyph: number;
  place: number;
  anchor: Anchor;
}

/** A MarkArray: each mark with its class and its anchor. */
function markArray(marks: Attached[]): Uint8Array {
  return withChildren((offsets) => {
    const out = new Out().u16(marks.length);
    marks.forEach((mark, i) => out.u16(mark.place).u16(offsets[i]!));
    return out;
  }, marks.map((mark) => anchor(mark.anchor)));
}

/** A BaseArray (or Mark2Array): for each base, one anchor per class, 0 where it has none. */
function baseArray(bases: { glyph: number; anchors: (Anchor | undefined)[] }[], classes: number): Uint8Array {
  const list = bases.flatMap((base) => base.anchors.filter((a): a is Anchor => a !== undefined));
  return withChildren((offsets) => {
    const out = new Out().u16(bases.length);
    let k = 0;
    for (const base of bases) for (let c = 0; c < classes; c += 1) out.u16(base.anchors[c] ? offsets[k++]! : 0);
    return out;
  }, list.map(anchor));
}

/** A MarkBasePos or MarkMarkPos subtable, format 1: they have the same layout. */
function markSubtable(marks: Attached[], bases: { glyph: number; anchors: (Anchor | undefined)[] }[], classes: number): Uint8Array {
  const sortedMarks = [...marks].sort((a, b) => a.glyph - b.glyph);
  const sortedBases = [...bases].sort((a, b) => a.glyph - b.glyph);
  const children = [coverage(sortedMarks.map((m) => m.glyph)), coverage(sortedBases.map((b) => b.glyph)), markArray(sortedMarks), baseArray(sortedBases, classes)];
  return withChildren((o) => new Out().u16(1).u16(o[0]!).u16(o[1]!).u16(classes).u16(o[2]!).u16(o[3]!), children);
}

interface Lookup {
  type: number;
  subtables: Uint8Array[];
}

/**
 * The LookupList and, after it, every subtable: each lookup is an Extension (type 9) whose records point at their
 * subtable with a 32-bit offset, so that a font of thousands of glyphs (all the kanji) passes the 64 KiB a 16-bit
 * offset can reach. `at` is where the LookupList starts in the table.
 */
function lookupsWithData(lookups: Lookup[], at: number): Uint8Array {
  const sizes = lookups.map((l) => 6 + l.subtables.length * 10);
  const listSize = 2 + lookups.length * 2 + sizes.reduce((a, b) => a + b, 0);
  const out = new Out().u16(lookups.length);
  let offset = 2 + lookups.length * 2;
  sizes.forEach((size) => {
    out.u16(offset);
    offset += size;
  });
  let data = at + listSize;
  let start = 2 + lookups.length * 2;
  for (const [i, l] of lookups.entries()) {
    out.u16(9).u16(0).u16(l.subtables.length);
    l.subtables.forEach((_, k) => out.u16(6 + l.subtables.length * 2 + k * 8));
    l.subtables.forEach((subtable, k) => {
      const record = at + start + 6 + l.subtables.length * 2 + k * 8;
      out.u16(1).u16(l.type).u32(data - record);
      data += subtable.length;
    });
    start += sizes[i]!;
  }
  lookups.forEach((l) => l.subtables.forEach((subtable) => out.add(subtable)));
  return out.done();
}

/** The bases in groups small enough for 16-bit offsets: each group is a subtable with every mark. */
function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.max(1, Math.ceil(items.length / size)) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

/** OpenType script tags by code point ranges. HarfBuzz's Hebrew shaper reads GPOS only under `hebr`: with DFLT
 * alone it sets the marks by its own fallback, so every script the font draws gets its record. */
const SCRIPT_RANGES: [number, number, string[]][] = [
  [0x41, 0x24f, ['latn']], [0x1e00, 0x1eff, ['latn']], [0x370, 0x3ff, ['grek']], [0x400, 0x52f, ['cyrl']],
  [0x530, 0x58f, ['armn']], [0x590, 0x5ff, ['hebr']], [0xfb1d, 0xfb4f, ['hebr']], [0x600, 0x6ff, ['arab']],
  [0x750, 0x77f, ['arab']], [0xfb50, 0xfeff, ['arab']], [0x900, 0x97f, ['deva', 'dev2']], [0xe00, 0xe7f, ['thai']],
  [0xe80, 0xeff, ['lao ']], [0x10a0, 0x10ff, ['geor']], [0x3040, 0x30ff, ['kana']], [0x4e00, 0x9fff, ['hani']],
];

/** DFLT and the tag of each script the font has a glyph for, in the order a ScriptList needs (by tag). */
export function scriptTags(doc: FontDoc): string[] {
  const tags = new Set<string>(['DFLT']);
  for (const glyph of doc.glyphs) {
    const code = glyph.unicode;
    if (code === undefined) continue;
    for (const [from, to, names] of SCRIPT_RANGES) if (code >= from && code <= to) names.forEach((tag) => tags.add(tag));
  }
  return [...tags].sort();
}

/** The GPOS table, or undefined when the font has no mark. Features mark and mkmk, for every script. */
export function gposTable(doc: FontDoc, index: Map<string, number>): Uint8Array | undefined {
  const found = anchors(doc);
  if (found.marks.size === 0) return undefined;
  const classOf = (place: MarkPlace): number => PLACES.indexOf(place);
  const marks: Attached[] = [...found.marks].map(([name, mark]) => ({ glyph: index.get(name)!, place: classOf(mark.place), anchor: mark.anchor }));
  const bases = [...found.bases].map(([name, byPlace]) => ({ glyph: index.get(name)!, anchors: PLACES.map((place) => byPlace[place]) }));
  const markBase: Lookup = { type: 4, subtables: chunks(bases, 400).map((group) => markSubtable(marks, group, PLACES.length)) };
  const stacking = marks.filter((mark) => mark.place <= 1);
  const stacks = [...found.stacks].map(([name, byPlace]) => ({ glyph: index.get(name)!, anchors: [byPlace.above, byPlace.below] }));
  const markMark: Lookup = { type: 6, subtables: [markSubtable(stacking, stacks, 2)] };
  const feature = (lookupIndex: number): Uint8Array => new Out().u16(0).u16(1).u16(lookupIndex).done();
  const featureList = withChildren((o) => new Out().u16(2).tag('mark').u16(o[0]!).tag('mkmk').u16(o[1]!), [feature(0), feature(1)]);
  const langSys = new Out().u16(0).u16(0xffff).u16(2).u16(0).u16(1).done();
  const script = withChildren((o) => new Out().u16(o[0]!).u16(0), [langSys]);
  const tags = scriptTags(doc);
  const scriptList = withChildren((o) => {
    const out = new Out().u16(tags.length);
    tags.forEach((tag, i) => out.tag(tag).u16(o[i]!));
    return out;
  }, tags.map(() => script));
  // The ScriptList and FeatureList are small; the lookups and their data come last, past any 16-bit offset.
  const at = 10 + scriptList.length + featureList.length;
  return new Out().u16(1).u16(0).u16(10).u16(10 + scriptList.length).u16(at).add(scriptList).add(featureList).add(lookupsWithData([markBase, markMark], at)).done();
}

/** The GDEF table: each glyph's class, 1 base or 3 mark, so that lookups that skip marks can. */
export function gdefTable(doc: FontDoc, index: Map<string, number>): Uint8Array {
  const found = anchors(doc);
  const classes = doc.glyphs.map((glyph) => ({ glyph: index.get(glyph.name)!, value: found.marks.has(glyph.name) ? 3 : 1 })).sort((a, b) => a.glyph - b.glyph);
  const ranges: { start: number; end: number; value: number }[] = [];
  for (const entry of classes) {
    const last = ranges[ranges.length - 1];
    if (last && last.end === entry.glyph - 1 && last.value === entry.value) last.end = entry.glyph;
    else ranges.push({ start: entry.glyph, end: entry.glyph, value: entry.value });
  }
  const classDef = new Out().u16(2).u16(ranges.length);
  ranges.forEach((range) => classDef.u16(range.start).u16(range.end).u16(range.value));
  return withChildren((o) => new Out().u16(1).u16(0).u16(o[0]!).u16(0).u16(0).u16(0), [classDef.done()]);
}
