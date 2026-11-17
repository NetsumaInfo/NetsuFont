import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { gposTable } from './gpos';
import { gposPairs } from './gposRead';
import { applyOps } from './ops';
import { Out, withChildren } from './otl';

describe('GPOS kerning read back', () => {
  it('reads the pairs the export writes, through its Extension lookup', () => {
    const doc = applyOps(newFont('t', 'T'), [
      ...['A', 'V', 'T', 'o'].map((glyph) => ({ op: 'set_glyph' as const, glyph, unicode: glyph.charCodeAt(0), advance: 500, path: 'M0 0H400V500H0Z' })),
      { op: 'set_kern', left: 'A', right: 'V', value: -80 },
      { op: 'set_kern', left: 'T', right: 'o', value: -60 },
    ]);
    const index = new Map(doc.glyphs.map((glyph, i) => [glyph.name, i + 1]));
    const pairs = gposPairs(gposTable(doc, index)!);
    expect(pairs).toEqual(expect.arrayContaining([{ left: index.get('A'), right: index.get('V'), value: -80 }, { left: index.get('T'), right: index.get('o'), value: -60 }]));
    expect(pairs).toHaveLength(2);
  });

  it('spreads a pair of classes (format 2) to every glyph of each class', () => {
    // Glyphs 1 and 2 are class 1 on the left; 5 and 6 class 1 on the right: -40 between them.
    const coverage = new Out().u16(1).u16(2).u16(1).u16(2).done();
    const left = new Out().u16(2).u16(1).u16(1).u16(2).u16(1).done();
    const right = new Out().u16(2).u16(1).u16(5).u16(6).u16(1).done();
    const subtable = withChildren((o) => {
      const out = new Out().u16(2).u16(o[0]!).u16(4).u16(0).u16(o[1]!).u16(o[2]!).u16(2).u16(2);
      [0, 0, 0, -40].forEach((value) => out.i16(value));
      return out;
    }, [coverage, left, right]);
    const lookup = withChildren((o) => new Out().u16(2).u16(0).u16(1).u16(o[0]!), [subtable]);
    const lookups = withChildren((o) => new Out().u16(1).u16(o[0]!), [lookup]);
    const features = withChildren((o) => new Out().u16(1).tag('kern').u16(o[0]!), [new Out().u16(0).u16(1).u16(0).done()]);
    const scripts = new Out().u16(0).done();
    const table = withChildren((o) => new Out().u16(1).u16(0).u16(o[0]!).u16(o[1]!).u16(o[2]!), [scripts, features, lookups]);
    expect(gposPairs(table).map((p) => `${p.left}-${p.right} ${p.value}`).sort()).toEqual(['1-5 -40', '1-6 -40', '2-5 -40', '2-6 -40']);
  });
});
