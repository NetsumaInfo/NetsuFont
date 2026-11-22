import opentype from 'opentype.js';
import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { exportOtf } from './otf';
import { applyOps, type Op } from './ops';
import { shapeLine } from './shape';

const g = (name: string, unicode: number | undefined): Op => ({ op: 'set_glyph', glyph: name, ...(unicode ? { unicode } : {}), advance: 500, path: 'M50 0H150V500H50Z' });

describe('contextual alternates', () => {
  it('draws a glyph another way before some glyphs, writes calt, and takes it out again', () => {
    const doc = applyOps(newFont('t', 'T'), [g('r', 114), g('a', 97), g('r.calt', undefined), { op: 'set_context', glyph: 'r', by: 'r.calt', after: ['a'] }]);
    expect(shapeLine(doc, 'rar').items.map((i) => i.glyph.name)).toEqual(['r.calt', 'a', 'r']);
    const bytes = exportOtf(doc);
    const gsub = (opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer).tables as unknown as { gsub: { features: { tag: string }[]; lookups: { lookupType: number }[] } }).gsub;
    expect(gsub.features.map((f) => f.tag)).toContain('calt');
    expect(gsub.lookups.map((l) => l.lookupType)).toEqual(expect.arrayContaining([6, 1]));
    const back = applyOps(doc, [{ op: 'set_context', glyph: 'r', by: null }]);
    expect(back.contextual).toBeUndefined();
    expect(() => applyOps(doc, [{ op: 'remove_glyph', glyph: 'r.calt' }])).not.toThrow();
  });
});
