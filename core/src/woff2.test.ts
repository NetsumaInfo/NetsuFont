import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { applyOps } from './ops';
import { exportOtf } from './otf';
import { readTables } from './sfnt';
import { base128, toWoff2 } from './woff2';

describe('WOFF2', () => {
  it('writes numbers as UIntBase128', () => {
    expect(base128(0)).toEqual([0]);
    expect(base128(127)).toEqual([127]);
    expect(base128(128)).toEqual([0x81, 0]);
    expect(base128(63)).toEqual([63]);
    expect(base128(16384)).toEqual([0x81, 0x80, 0]);
  });

  it('holds every table of the OTF in its Brotli stream, in order', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'H', unicode: 72, advance: 600, path: 'M100 0H500V700H100Z' },
      { op: 'set_kern', left: 'H', right: 'H', value: -40 },
    ]);
    const otf = exportOtf(doc);
    // No compression here (core has no Brotli): the stream is the tables, as they will be once decompressed.
    const woff = toWoff2(otf, (data) => data);
    const view = new DataView(woff.buffer);
    expect(String.fromCharCode(...woff.subarray(0, 4))).toBe('wOF2');
    expect(view.getUint32(8)).toBe(woff.length);
    const { tables } = readTables(otf);
    expect(view.getUint16(12)).toBe(tables.length);
    // The directory: a flag byte (63 is followed by the tag), then the length as UIntBase128.
    let at = 48;
    for (let i = 0; i < tables.length; i += 1) {
      if ((woff[at++]! & 63) === 63) at += 4;
      while (woff[at++]! & 128);
    }
    const stream = woff.subarray(at, at + view.getUint32(20));
    expect([...stream]).toEqual(tables.flatMap((table) => [...table.data]));
  });
});
