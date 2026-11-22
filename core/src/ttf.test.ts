import opentype from 'opentype.js';
import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { applyOps } from './ops';
import { exportOtf } from './otf';
import { readTables } from './sfnt';
import { ttfFromOtf } from './ttf';

describe('TrueType export', () => {
  it('writes glyf outlines that keep the bounds, advances and side bearings of the OTF', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'o', unicode: 111, advance: 600, shapes: [{ type: 'ring', cx: 300, cy: 250, rx: 240, ry: 260, stroke: 80 }] },
      { op: 'set_glyph', glyph: 'l', unicode: 108, advance: 300, path: 'M100 0H200V700H100Z' },
    ]);
    const ttf = ttfFromOtf(exportOtf(doc));
    expect([...ttf.subarray(0, 4)]).toEqual([0, 1, 0, 0]);
    const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength) as ArrayBuffer);
    const glyphs = Array.from({ length: font.glyphs.length }, (_, i) => font.glyphs.get(i));
    const at = glyphs.findIndex((g) => g.unicode === 111);
    const points = glyphs[at]!.path.commands.filter((c) => c.type !== 'Z');
    const xs = points.map((c) => c.x!);
    const ys = points.map((c) => c.y!);
    expect([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]).toEqual([60, -10, 540, 510]);
    expect(glyphs[at]!.advanceWidth).toBe(600);
    expect(points.some((c) => c.type === 'Q')).toBe(true);
    // The left side bearing of l is its xMin, as TrueType engines place it.
    const hmtx = readTables(ttf).tables.find((t) => t.tag === 'hmtx')!.data;
    const l = glyphs.findIndex((g) => g.unicode === 108);
    expect(new DataView(hmtx.buffer).getInt16(l * 4 + 2)).toBe(100);
  });
});
