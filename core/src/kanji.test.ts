import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { kanjiPath, kanjiStrokes } from './kanji';
import { languageCoverage } from './languages';
import { applyOps } from './ops';
import { bounds, parsePath } from './path';

/** A KanjiVG file of one: a horizontal stroke, then a vertical one written as a smooth curve, relative. */
const ONE = '<svg><g><path id="s1" d="M10,50C30,50 70,50 90,50"/><path id="s2" d="M50,10c0,20 0,40 0,40s0,20 0,40"/></g></svg>';

describe('kanji from strokes', () => {
  it('reads each stroke as a line of points, curves included', () => {
    const strokes = kanjiStrokes(ONE);
    expect(strokes).toHaveLength(2);
    expect(strokes[0]![0]).toEqual([10, 50]);
    expect(strokes[1]![strokes[1]!.length - 1]).toEqual([50, 90]);
  });

  it('draws each stroke with the pen, in the frame, y up', () => {
    const d = kanjiPath(ONE, { width: 100, ends: 'flat' }, { left: 0, right: 1090, top: 1000 });
    expect(d.match(/M/g)).toHaveLength(2);
    const box = bounds(parsePath(d))!;
    // The box of 109 is scaled by 10: the horizontal from x 100 to 900, 100 thick round y 1000 − 500.
    expect([Math.round(box.xMin), Math.round(box.xMax), Math.round(box.yMin), Math.round(box.yMax)]).toEqual([100, 900, 100, 900]);
  });

  it('thins the strokes along the angle of a pen with contrast', () => {
    const d = kanjiPath('<svg><path d="M10,50C30,50 70,50 90,50"/></svg>', { width: 100, contrast: 0.3, angle: 0, ends: 'flat' }, { left: 0, right: 1090, top: 1000 });
    const box = bounds(parsePath(d))!;
    expect(Math.round(box.yMax - box.yMin)).toBe(30);
  });
});

describe('Japanese', () => {
  it('voices a kana with its mark kept where drawn, and counts the kanji for general use', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'uni304B', unicode: 0x304b, advance: 1000, shapes: [{ type: 'rect', x: 100, y: 0, w: 700, h: 700 }] },
      { op: 'set_glyph', glyph: 'uni3099', advance: 0, shapes: [{ type: 'rect', x: 820, y: 700, w: 80, h: 120 }] },
      { op: 'compose', chars: 'が' },
    ]);
    expect(doc.glyphs.find((g) => g.name === 'uni304C')?.components).toEqual([{ glyph: 'uni304B', x: 0, y: 0 }, { glyph: 'uni3099', x: 0, y: 0 }]);
    const ja = languageCoverage(doc, ['ja'])[0]!;
    expect(ja.of).toBeGreaterThan(2136 + 170);
    expect(ja.missing).toContain('漢');
  });
});
