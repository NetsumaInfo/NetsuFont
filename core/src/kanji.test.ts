import opentype from 'opentype.js';
import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { hanziPath, kanjiPath, kanjiStrokes } from './kanji';
import { languageCoverage } from './languages';
import { applyOps } from './ops';
import { exportOtf } from './otf';
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

describe('hanzi from medians', () => {
  it('draws each median in the frame, its corners kept sharp', () => {
    // 口 drawn as one stroke: down the left, across the bottom: a corner of 90°. Box of 1024, top 900.
    const d = hanziPath([[[100, 800], [100, 100], [900, 100]]], { width: 64, ends: 'flat' }, { left: 0, right: 1024, top: 900 });
    const box = bounds(parsePath(d))!;
    expect([Math.round(box.xMin), Math.round(box.xMax), Math.round(box.yMin), Math.round(box.yMax)]).toEqual([68, 900, 68, 800]);
  });

  it('counts simplified and traditional Chinese', () => {
    const [hans, hant] = languageCoverage(newFont('t', 'T'), ['zh-Hans', 'zh-Hant']);
    expect(hans!.missing).toContain('们');
    expect(hant!.missing).toContain('們');
    expect(hans!.of).toBeGreaterThan(3500);
  });
});

describe('Song terminals and local forms', () => {
  it('puts a triangle on the end of a level stroke and makes a brush stroke level', () => {
    // A horizontal that rises 4% and ends in a short flick down: a Song pen draws it level, with its triangle.
    const medians = [[[100, 400], [500, 410], [880, 420], [900, 380]]];
    const plain = hanziPath(medians, { width: 80, contrast: 0.25, ends: 'flat' }, { left: 0, right: 1024, top: 900 });
    const song = hanziPath(medians, { width: 80, contrast: 0.25, ends: 'flat', terminals: 'song' }, { left: 0, right: 1024, top: 900 });
    expect(song.match(/M/g)).toHaveLength(2);
    expect(plain.match(/M/g)).toHaveLength(1);
  });

  it('writes a .zht glyph as locl for traditional Chinese', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'uniFF0C', unicode: 0xff0c, advance: 1000, shapes: [{ type: 'rect', x: 100, y: -60, w: 100, h: 140 }] },
      { op: 'set_glyph', glyph: 'uniFF0C.zht', advance: 1000, shapes: [{ type: 'rect', x: 450, y: 200, w: 100, h: 140 }] },
    ]);
    const bytes = exportOtf(doc);
    const font = opentype.parse(bytes.buffer as ArrayBuffer) as unknown as { substitution: { getSingle(f: string, s: string, l: string): { sub: number; by: number }[] } };
    expect(font.substitution.getSingle('locl', 'hani', 'ZHT ')).toEqual([{ sub: 2, by: 3 }]);
  });
});
