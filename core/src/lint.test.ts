import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { inkRuns, lint } from './lint';
import { applyOps, type Op } from './ops';
import { parsePath } from './path';

const stem = (glyph: string, unicode: number, width: number): Op => ({ op: 'set_glyph', glyph, unicode, advance: 600, shapes: [{ type: 'rect', x: 100, y: 0, w: width, h: 500 }, { type: 'rect', x: 400, y: 0, w: width, h: 500 }] });

describe('lint', () => {
  it('counts overlapping ink once across a line', () => {
    expect(inkRuns(parsePath('M0 0H100V100H0ZM50 0H150V100H50Z'), 50)).toEqual([[0, 150]]);
  });

  it('finds a letter whose stems are much heavier than the others of its script, and a round letter that does not pass the lines', () => {
    const doc = applyOps(newFont('t', 'T'), [
      stem('n', 110, 80), stem('u', 117, 80), stem('h', 104, 80), stem('m', 109, 80), stem('H', 72, 80), stem('U', 85, 160),
      { op: 'set_glyph', glyph: 'o', unicode: 111, advance: 600, shapes: [{ type: 'ring', cx: 300, cy: 250, rx: 250, ry: 250, stroke: 80 }] },
    ]);
    const found = lint(doc).map((f) => `${f.glyph}: ${f.text}`);
    expect(found).toEqual([expect.stringMatching(/^U: stroke 160 wide where the Latin letters have about 80/), expect.stringMatching(/^o: round but from 0 to 500/)]);
  });
});
