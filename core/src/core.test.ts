import { describe, expect, it } from 'vitest';
import { coverage } from './charset';
import { checkGlyphs } from './check';
import { newFont } from './doc';
import { applyOps } from './ops';
import { exportOtf, importFont } from './otf';
import { layout, sideBearings } from './outline';
import { bounds, parsePath, writePath } from './path';
import { proofSvg } from './svg';
import { FontError } from './types';

const SQUARE = 'M100 0H500V700H100Z';

function withGlyphs() {
  return applyOps(newFont('test', 'Test'), [
    { op: 'set_glyph', glyph: 'H', unicode: 72, advance: 600, path: SQUARE },
    { op: 'set_glyph', glyph: 'acute', path: 'M250 750L350 850L300 850Z' },
    { op: 'set_glyph', glyph: 'Hacute', unicode: 0x1e24, advance: 600, components: [{ glyph: 'H', x: 0, y: 0 }, { glyph: 'acute', x: 0, y: 0 }] },
  ]);
}

describe('path', () => {
  it('reads relative commands, H and V, and implicit linetos', () => {
    const commands = parsePath('m10 10 h20 v20 l-20 0 z M0 0 5 5');
    expect(writePath(commands)).toBe('M10 10L30 10L30 30L10 30ZM0 0L5 5');
  });

  it('refuses what is not path data', () => {
    expect(() => parsePath('M0 0 A 1 1 0 0 0 5 5')).toThrow(FontError);
    expect(() => parsePath('L0 0')).toThrow(/starts with M/);
  });

  it('measures the ink of a curve, not its handles', () => {
    expect(bounds(parsePath('M0 0Q50 100 100 0Z'))).toEqual({ xMin: 0, yMin: 0, xMax: 100, yMax: 50 });
  });
});

describe('ops', () => {
  it('changes nothing when one op fails', () => {
    const doc = withGlyphs();
    expect(() => applyOps(doc, [{ op: 'set_glyph', glyph: 'I', path: SQUARE }, { op: 'remove_glyph', glyph: 'nope' }])).toThrow(/op 2/);
    expect(doc.glyphs.some((glyph) => glyph.name === 'I')).toBe(false);
  });

  it('refuses to remove a glyph used as a component', () => {
    expect(() => applyOps(withGlyphs(), [{ op: 'remove_glyph', glyph: 'acute' }])).toThrow(/Hacute/);
  });

  it('refuses a component loop and a duplicate code point', () => {
    expect(() => applyOps(withGlyphs(), [{ op: 'set_glyph', glyph: 'H', components: [{ glyph: 'Hacute', x: 0, y: 0 }] }])).toThrow(/loop/);
    expect(() => applyOps(withGlyphs(), [{ op: 'set_glyph', glyph: 'acute', unicode: 72 }])).toThrow(/U\+0048/);
  });

  it('sets the side bearings', () => {
    const doc = applyOps(withGlyphs(), [{ op: 'set_spacing', glyph: 'H', left: 50, right: 70 }]);
    expect(sideBearings(doc, doc.glyphs.find((g) => g.name === 'H')!)).toEqual({ left: 50, right: 70 });
  });

  it('slants to the right and scales the advance with the width', () => {
    const doc = applyOps(withGlyphs(), [{ op: 'transform', glyphs: ['H'], slant: 45, scale: [2, 1] }]);
    const h = doc.glyphs.find((g) => g.name === 'H')!;
    expect(h.advance).toBe(1200);
    expect(bounds(parsePath(h.path))).toEqual({ xMin: 200, yMin: 0, xMax: 1700, yMax: 700 });
  });

  it('decomposes a glyph into one outline', () => {
    const doc = applyOps(withGlyphs(), [{ op: 'decompose', glyph: 'Hacute' }]);
    const glyph = doc.glyphs.find((g) => g.name === 'Hacute')!;
    expect(glyph.components).toBeUndefined();
    expect(parsePath(glyph.path).filter((c) => c.type === 'M')).toHaveLength(2);
  });
});

describe('layout and proof', () => {
  it('adds the kerning of a pair and names what is missing', () => {
    const doc = applyOps(withGlyphs(), [{ op: 'set_kern', left: 'H', right: 'H', value: -40 }]);
    const { placed, width, missing } = layout(doc, 'HHx');
    expect(placed.map((p) => p.x)).toEqual([0, 560]);
    expect(width).toBe(1160);
    expect(missing).toEqual(['x']);
    expect(proofSvg(doc, 'HH').svg).toContain('<path');
  });

  it('counts the characters of each set', () => {
    const upper = coverage(withGlyphs()).find((c) => c.set === 'uppercase')!;
    expect(upper.has).toBe(1);
    expect(upper.missing).not.toContain('H');
  });
});

describe('font file', () => {
  it('exports an OTF that reads back with its glyphs, metrics and kerning', () => {
    const doc = applyOps(withGlyphs(), [{ op: 'set_kern', left: 'H', right: 'H', value: -40 }]);
    const bytes = exportOtf(doc);
    expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe('OTTO');
    const { doc: back } = importFont(bytes, 'back');
    expect(back.family).toBe('Test');
    expect(back.metrics.capHeight).toBe(700);
    const h = back.glyphs.find((g) => g.unicode === 72)!;
    expect(h.advance).toBe(600);
    expect(bounds(parsePath(h.path))).toEqual({ xMin: 100, yMin: 0, xMax: 500, yMax: 700 });
    expect(back.kerning).toEqual([{ left: 'H', right: 'H', value: -40 }]);
    // The component glyph is drawn whole in the file.
    expect(parsePath(back.glyphs.find((g) => g.unicode === 0x1e24)!.path).filter((c) => c.type === 'M')).toHaveLength(2);
  });

  it('refuses a file that is not a font', () => {
    expect(() => importFont(new Uint8Array([1, 2, 3, 4, 5]), 'x')).toThrow(FontError);
  });
});

describe('checks', () => {
  it('finds a counter drawn the same way as its outer contour', () => {
    const same = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'o', path: 'M0 0H500V500H0ZM100 100H400V400H100Z' }]);
    expect(checkGlyphs(same)[0]?.text).toContain('hole is filled');
    const cut = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'o', advance: 500, path: 'M0 0H500V500H0ZM100 100V400H400V100Z' }]);
    expect(checkGlyphs(cut)).toEqual([]);
  });

  it('finds ink outside the advance and above the ascender', () => {
    const doc = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'I', unicode: 73, advance: 100, path: 'M0 0H300V1200H0Z' }]);
    expect(checkGlyphs(doc).map((f) => f.text).join(' ')).toMatch(/far above the ascender.*leaves the advance/);
  });
});
