import { describe, expect, it } from 'vitest';
import { checkGlyphs } from './check';
import { newFont } from './doc';
import { applyOps } from './ops';
import { bounds, parsePath } from './path';
import { shapesPath } from './shapes';
import { proofSvg } from './svg';
import { FontError } from './types';

const box = (d: string) => bounds(parsePath(d));

describe('shapes', () => {
  it('draws a ring with a hole that is cut', () => {
    const doc = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'o', advance: 600, shapes: [{ type: 'ring', cx: 300, cy: 250, rx: 250, ry: 260, stroke: 90 }] }]);
    const o = doc.glyphs.find((g) => g.name === 'o')!;
    expect(box(o.path)).toEqual({ xMin: 50, yMin: -10, xMax: 550, yMax: 510 });
    expect(checkGlyphs(doc)).toEqual([]);
  });

  it('turns a clockwise polygon and cuts with a hole', () => {
    const d = shapesPath([{ type: 'rect', x: 0, y: 0, w: 400, h: 700 }, { type: 'rect', x: 100, y: 100, w: 200, h: 500, hole: true }]);
    const doc = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'O', advance: 400, path: d }]);
    expect(checkGlyphs(doc)).toEqual([]);
    const same = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'O', advance: 400, shapes: [{ type: 'polygon', points: [[0, 0], [0, 700], [400, 700], [400, 0]] }, { type: 'rect', x: 100, y: 100, w: 200, h: 500 }] }]);
    expect(checkGlyphs(same)[0]?.text).toContain('hole is filled');
  });

  it('draws the top half of an arch and a line that sits flat on the baseline', () => {
    expect(box(shapesPath([{ type: 'arc', cx: 300, cy: 300, rx: 200, ry: 200, stroke: 80, from: 0, to: 180 }]))).toMatchObject({ xMin: 100, xMax: 500, yMin: 300 });
    const v = box(shapesPath([{ type: 'line', x1: 100, y1: 500, x2: 300, y2: 0, width: 80, ends: 'flat' }]))!;
    expect([v.yMin, v.yMax]).toEqual([0, 500]);
  });

  it('refuses a stroke wider than the radius', () => {
    expect(() => shapesPath([{ type: 'ring', cx: 0, cy: 0, rx: 50, ry: 50, stroke: 60 }])).toThrow(FontError);
  });
});

describe('round ends, centring, ogonek, lines of proof', () => {
  it('adds half discs past the ends of a line and an arc', () => {
    expect(box(shapesPath([{ type: 'line', x1: 100, y1: 0, x2: 100, y2: 500, width: 80, ends: 'round' }]))).toEqual({ xMin: 60, yMin: -40, xMax: 140, yMax: 540 });
    const arc = box(shapesPath([{ type: 'arc', cx: 300, cy: 300, rx: 200, ry: 200, stroke: 80, from: 0, to: 180, ends: 'round' }]))!;
    expect(arc.yMin).toBe(260);
    expect(() => shapesPath([{ type: 'line', x1: 0, y1: 0, x2: 1, y2: 1, width: 1, ends: 'pointy' as 'round' }])).toThrow(/ends/);
  });

  it('centres glyphs in one advance', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'one', path: 'M100 0H200V700H100Z' },
      { op: 'center', glyphs: ['one'], advance: 600 },
    ]);
    const one = doc.glyphs.find((g) => g.name === 'one')!;
    expect(one.advance).toBe(600);
    expect(box(one.path)).toMatchObject({ xMin: 250, xMax: 350 });
  });

  it('hangs an ogonek at the right of the foot', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'e', unicode: 101, advance: 500, path: 'M50 0H450V500H50Z' },
      { op: 'set_glyph', glyph: 'ogonek', path: 'M0 -150H80V0H0Z' },
      { op: 'compose', chars: 'ę' },
    ]);
    expect(doc.glyphs.find((g) => g.name === 'eogonek')?.components?.[1]).toEqual({ glyph: 'ogonek', x: 370, y: 0 });
  });

  it('sets each line of a proof under the other', () => {
    const doc = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'H', unicode: 72, advance: 600, path: 'M0 0H600V700H0Z' }]);
    const one = proofSvg(doc, 'HH', { sizes: [100] });
    const two = proofSvg(doc, 'HH\nHH', { sizes: [100] });
    expect(Number(/height="(\d+)"/.exec(two.svg)![1])).toBeGreaterThan(Number(/height="(\d+)"/.exec(one.svg)![1]));
    expect(proofSvg(doc, 'H'.repeat(80), { sizes: [100] }).cut).toBe(true);
  });
});

describe('second run', () => {
  it('takes the bar of a theta, inside the hole of its ring, as ink', () => {
    const doc = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'Theta', unicode: 0x398, advance: 700, shapes: [{ type: 'ring', cx: 350, cy: 350, rx: 300, ry: 350, stroke: 90 }, { type: 'rect', x: 150, y: 310, w: 400, h: 80 }] }]);
    expect(checkGlyphs(doc)).toEqual([]);
  });

  it('leaves marks out of the advance check and kerns by character', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'acute', advance: 0, path: 'M-50 560H50V700H-50Z' },
      { op: 'set_glyph', glyph: 'period', unicode: 46, advance: 200, path: 'M50 0H150V100H50Z' },
      { op: 'set_kern', left: '.', right: 'period', value: -20 },
    ]);
    expect(checkGlyphs(doc)).toEqual([]);
    expect(doc.kerning).toEqual([{ left: 'period', right: 'period', value: -20 }]);
  });
});

it('takes a bar that crosses from the hole into the ring as ink', () => {
  const doc = applyOps(newFont('t', 'T'), [{ op: 'set_glyph', glyph: 'theta', unicode: 0x3b8, advance: 500, shapes: [{ type: 'ring', cx: 250, cy: 368, rx: 205, ry: 382, stroke: 118, strokeY: 108 }, { type: 'rect', x: 110, y: 312, w: 280, h: 100 }] }]);
  expect(checkGlyphs(doc)).toEqual([]);
});

it('mirrors a glyph inside its advance', () => {
  const doc = applyOps(newFont('t', 'T'), [
    { op: 'set_glyph', glyph: 'N', unicode: 78, advance: 600, path: 'M50 0H150V700H50Z' },
    { op: 'copy_glyph', from: 'N', to: 'uni0418', unicode: 0x418 },
    { op: 'transform', glyphs: ['uni0418'], scale: [-1, 1] },
  ]);
  const mirrored = doc.glyphs.find((g) => g.name === 'uni0418')!;
  expect(mirrored.advance).toBe(600);
  expect(box(mirrored.path)).toMatchObject({ xMin: 450, xMax: 550 });
});
