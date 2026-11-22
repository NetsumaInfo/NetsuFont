import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { emboldenPath } from './embolden';
import { inkRuns } from './lint';
import { applyOps } from './ops';
import { glyphBounds } from './outline';
import { bounds, parsePath } from './path';

describe('embolden', () => {
  it('grows a stem on both sides, keeps its side bearings and widens the advance', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'I', unicode: 73, advance: 300, path: 'M100 0H200V700H100Z' },
      { op: 'embolden', by: 20 },
    ]);
    const glyph = doc.glyphs.find((g) => g.name === 'I')!;
    expect(glyphBounds(doc, glyph)).toEqual({ xMin: 100, yMin: -20, xMax: 240, yMax: 720 });
    expect(glyph.advance).toBe(340);
  });

  it('makes a ring heavier, its counter smaller, and a stem drawn either way', () => {
    const ring = 'M300 0C450 0 550 100 550 250C550 400 450 500 300 500C150 500 50 400 50 250C50 100 150 0 300 0ZM300 80C200 80 130 150 130 250C130 350 200 420 300 420C400 420 470 350 470 250C470 150 400 80 300 80Z';
    const runs = inkRuns(parsePath(emboldenPath(ring, 15)), 250);
    expect(runs.map(([a, b]) => Math.round(b - a))).toEqual([110, 110]);
    // A stem drawn clockwise grows too.
    expect(bounds(parsePath(emboldenPath('M100 0V700H200V0Z', 20)))).toEqual({ xMin: 100, yMin: -20, xMax: 240, yMax: 720 });
    expect(bounds(parsePath(emboldenPath(ring, -10)))!.xMax).toBeCloseTo(530, -1);
  });
});
