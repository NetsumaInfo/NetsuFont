// GDEF and GPOS tables written by hand: opentype.js writes neither. GDEF says which glyphs are marks; GPOS attaches
// each mark to its letter (`mark`) and to the mark under it (`mkmk`), at the anchors of `marks.ts`.
import { anchors, PLACES, type Anchor, type MarkPlace } from './marks';
import type { FontDoc } from './types';

/** Big-endian bytes, written in order. */
class Out {
  private bytes: number[] = [];
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
    this.bytes.push(...data);
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

function lookup(type: number, subtables: Uint8Array[]): Uint8Array {
  return withChildren((offsets) => {
    const out = new Out().u16(type).u16(0).u16(subtables.length);
    offsets.forEach((offset) => out.u16(offset));
    return out;
  }, subtables);
}

/** The bases in groups small enough for 16-bit offsets: each group is a subtable with every mark. */
function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.max(1, Math.ceil(items.length / size)) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

/** The GPOS table, or undefined when the font has no mark. Features mark and mkmk, for every script. */
export function gposTable(doc: FontDoc, index: Map<string, number>): Uint8Array | undefined {
  const found = anchors(doc);
  if (found.marks.size === 0) return undefined;
  const classOf = (place: MarkPlace): number => PLACES.indexOf(place);
  const marks: Attached[] = [...found.marks].map(([name, mark]) => ({ glyph: index.get(name)!, place: classOf(mark.place), anchor: mark.anchor }));
  const bases = [...found.bases].map(([name, byPlace]) => ({ glyph: index.get(name)!, anchors: PLACES.map((place) => byPlace[place]) }));
  const markBase = lookup(4, chunks(bases, 400).map((group) => markSubtable(marks, group, PLACES.length)));
  const stacking = marks.filter((mark) => mark.place <= 1);
  const stacks = [...found.stacks].map(([name, byPlace]) => ({ glyph: index.get(name)!, anchors: [byPlace.above, byPlace.below] }));
  const markMark = lookup(6, [markSubtable(stacking, stacks, 2)]);
  const lookupList = withChildren((offsets) => {
    const out = new Out().u16(2);
    offsets.forEach((offset) => out.u16(offset));
    return out;
  }, [markBase, markMark]);
  const feature = (lookupIndex: number): Uint8Array => new Out().u16(0).u16(1).u16(lookupIndex).done();
  const featureList = withChildren((o) => new Out().u16(2).tag('mark').u16(o[0]!).tag('mkmk').u16(o[1]!), [feature(0), feature(1)]);
  const langSys = new Out().u16(0).u16(0xffff).u16(2).u16(0).u16(1).done();
  const script = withChildren((o) => new Out().u16(o[0]!).u16(0), [langSys]);
  const scriptList = withChildren((o) => new Out().u16(1).tag('DFLT').u16(o[0]!), [script]);
  return withChildren((o) => new Out().u16(1).u16(0).u16(o[0]!).u16(o[1]!).u16(o[2]!), [scriptList, featureList, lookupList]);
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
