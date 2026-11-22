import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { applyOps } from './ops';
import { sheetCell } from './svg';

describe('glyph sheet', () => {
  it('widens a cell to a model glyph wider than the font own, at the model scale', () => {
    const doc = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'w', unicode: 119, advance: 700, path: 'M0 0H700V500H0Z' }]);
    const model = { ...applyOps(newFont('m', 'M'), [{ op: 'set_glyph', glyph: 'w', unicode: 119, advance: 2800, path: 'M0 0H2800V500H0Z' }]), metrics: { ascender: 1600, descender: -400, capHeight: 1400, xHeight: 1000 } };
    const w = doc.glyphs.filter((g) => g.name === 'w');
    expect(sheetCell(doc, w)).toBeCloseTo(1150);
    expect(sheetCell(doc, w, model)).toBeCloseTo(1400 * 1.15);
  });
});
