import { describe, expect, it } from 'vitest';
import { newFont, styleOf } from './doc';
import { applyOps } from './ops';
import { exportOtf } from './otf';
import { readTables } from './sfnt';
import { styleNames } from './style';

describe('style names', () => {
  it('links the four styles Windows groups, and names any other weight as a family of its own', () => {
    expect(styleNames('Fulgur', 'Bold')).toMatchObject({ weight: 700, family: 'Fulgur', subfamily: 'Bold', fsSelection: 32, macStyle: 1 });
    expect(styleNames('Fulgur', 'Bold Italic')).toMatchObject({ weight: 700, italic: true, subfamily: 'Bold Italic', fsSelection: 33, macStyle: 3 });
    expect(styleNames('Fulgur', 'Regular')).toMatchObject({ weight: 400, subfamily: 'Regular', fsSelection: 64 });
    expect(styleNames('Fulgur', 'Regular').typographic).toBeUndefined();
    expect(styleNames('Fulgur', 'SemiBold Italic')).toMatchObject({ weight: 600, family: 'Fulgur SemiBold', subfamily: 'Italic', typographic: { family: 'Fulgur', subfamily: 'SemiBold Italic' }, fsSelection: 1 });
    expect(styleNames('Fulgur', 'Light')).toMatchObject({ weight: 300, family: 'Fulgur Light', subfamily: 'Regular' });
  });

  it('writes the weight and the bold bits in the font file', () => {
    const doc = applyOps(newFont('t', 'T'), [{ op: 'set_info', family: 'Fulgur', style: 'Bold' }]);
    const tables = readTables(exportOtf(doc)).tables;
    const os2 = new DataView(tables.find((t) => t.tag === 'OS/2')!.data.buffer);
    expect([os2.getUint16(4), os2.getUint16(62)]).toEqual([700, 32]);
    expect(new DataView(tables.find((t) => t.tag === 'head')!.data.buffer).getUint16(44)).toBe(1);
  });

  it('starts another style of a family from a font, its glyphs copied', () => {
    const regular = applyOps(newFont('f', 'Fulgur'), [{ op: 'set_glyph', glyph: 'I', unicode: 73, advance: 300, path: 'M100 0H200V700H100Z' }]);
    const bold = styleOf(regular, 'f-bold', 'Bold');
    expect([bold.name, bold.family, bold.style, bold.glyphs.length]).toEqual(['f-bold', 'Fulgur', 'Bold', 2]);
    bold.glyphs[1]!.advance = 400;
    expect(regular.glyphs[1]!.advance).toBe(300);
  });
});
