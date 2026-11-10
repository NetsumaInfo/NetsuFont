import opentype from 'opentype.js';
import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { layout } from './layout';
import { languageCoverage } from './languages';
import { applyOps, type Op } from './ops';
import { exportOtf } from './otf';
import { scriptTags } from './gpos';

const box = (name: string, unicode: number | undefined, advance: number, x: number, y: number, w: number, h: number): Op => ({
  op: 'set_glyph',
  glyph: name,
  ...(unicode === undefined ? {} : { unicode }),
  advance,
  shapes: [{ type: 'rect', x, y, w, h }],
});

/** ก with the vowel sign i and the tone mai ek, both above: the tone sits on the vowel. */
function thai() {
  return applyOps(newFont('t', 'T'), [
    box('uni0E01', 0xe01, 500, 50, 0, 400, 500),
    box('uni0E1B', 0xe1b, 500, 50, 0, 400, 700),
    box('uni0E34', 0xe34, 0, -300, 560, 250, 80),
    box('uni0E48', 0xe48, 0, -200, 560, 60, 120),
    box('uni0E38', 0xe38, 0, -200, -150, 80, 100),
  ]);
}

describe('Hebrew accents of the Bible', () => {
  it('sets pashta past the left of its letter and yetiv past the right, below', () => {
    const doc = applyOps(newFont('t', 'T'), [
      box('uni05D0', 0x5d0, 500, 50, 0, 400, 560),
      box('uni0599', 0x599, 0, -300, 600, 60, 120),
      box('uni059A', 0x59a, 0, -300, -200, 60, 120),
    ]);
    const pashta = layout(doc, 'א֙').placed.find((p) => p.glyph.name === 'uni0599');
    // Its right edge 30 left of the letter's ink (50), its bottom 30 above the top (560).
    expect([pashta!.x - 300 + 60, pashta!.y + 600]).toEqual([20, 590]);
    const yetiv = layout(doc, 'א֚').placed.find((p) => p.glyph.name === 'uni059A');
    // Its left edge 30 right of the ink (450), its top 30 below the baseline.
    expect([yetiv!.x - 300, yetiv!.y - 80]).toEqual([480, -30]);
  });
});

describe('marks', () => {
  it('sets a mark on the top of its letter, a second one on the first', () => {
    const placed = layout(thai(), 'กิ่').placed;
    const [, vowel, tone] = placed;
    // The letter's ink is 50..450, 0..500: the vowel (250 wide) is centred on 250 and its bottom 30 above 500.
    // Mark ink: x -300..-50 (centre -175), bottom 560. Placed: centre on 250, bottom at 530.
    expect([vowel!.x - 175, vowel!.y + 560]).toEqual([250, 530]);
    // The tone sits 30 above the top of the vowel (its top 610, plus 30), centred on it.
    expect([tone!.x - 170, tone!.y + 560]).toEqual([250, 640]);
  });

  it('follows a taller letter, and hangs a mark below', () => {
    const [, high] = layout(thai(), 'ปิ').placed;
    expect(high!.y + 560).toBe(730);
    const [, low] = layout(thai(), 'กุ').placed;
    expect(low!.y + -50).toBe(-30);
  });

  it('writes GDEF and GPOS mark and mkmk', () => {
    const font = opentype.parse(exportOtf(thai()).buffer as ArrayBuffer) as unknown as { tables: { gpos?: { features: { tag: string }[]; lookups: { lookupType: number }[] }; gdef?: unknown } };
    expect(font.tables.gpos?.features.map((f) => f.tag)).toEqual(['mark', 'mkmk']);
    // Extension lookups (9) hold the mark-to-base (4) and mark-to-mark (6) subtables, past 16-bit offsets.
    expect(font.tables.gpos?.lookups.map((l) => l.lookupType)).toEqual([9, 9]);
    expect(font.tables.gdef).toBeDefined();
  });
});

/** Devanagari: ka, ssa, ra, the virama, the vowel sign i, and the forms the features name. */
function devanagari() {
  return applyOps(newFont('t', 'T'), [
    box('uni0915', 0x915, 500, 0, 0, 500, 600),
    box('uni0937', 0x937, 500, 0, 0, 500, 600),
    box('uni0930', 0x930, 400, 0, 0, 400, 600),
    box('uni094D', 0x94d, 0, -250, -200, 100, 100),
    box('uni093F', 0x93f, 200, 0, 0, 200, 800),
    box('uni0915.half', undefined, 350, 0, 0, 350, 600),
    box('uni0930.rphf', undefined, 0, -150, 650, 100, 100),
    box('uni0930.blwf', undefined, 0, -300, -150, 100, 100),
    box('uni0915_uni094D_uni0937', undefined, 700, 0, 0, 700, 600),
  ]);
}

describe('Devanagari', () => {
  const names = (text: string) => layout(devanagari(), text).placed.map((p) => p.glyph.name);

  it('draws the vowel sign i before its consonant', () => {
    expect(names('कि')).toEqual(['uni093F', 'uni0915']);
    expect(names('क्षि')).toEqual(['uni093F', 'uni0915_uni094D_uni0937']);
  });

  it('makes conjuncts, half forms, the reph and the ra below', () => {
    expect(names('क्ष')).toEqual(['uni0915_uni094D_uni0937']);
    expect(names('क्क')).toEqual(['uni0915.half', 'uni0915']);
    expect(names('र्क')).toEqual(['uni0915', 'uni0930.rphf']);
    expect(names('क्र')).toEqual(['uni0915', 'uni0930.blwf']);
    // A virama at the end of a word stays a virama.
    expect(names('क्')).toEqual(['uni0915', 'uni094D']);
  });

  it('counts the half forms and conjuncts Hindi needs', () => {
    const hi = languageCoverage(devanagari(), ['hi'])[0]!;
    expect(hi.forms).toContain('uni0916.half');
    expect(hi.forms).not.toContain('uni0915.half');
    expect(hi.forms).toContain('uni091C_uni094D_uni091E');
  });
});

describe('GPOS scripts', () => {
  it('names hebr beside DFLT, so that the Hebrew shaper reads the marks', () => {
    const doc = applyOps(newFont('t', 'T'), [box('uni05D0', 0x5d0, 500, 50, 0, 400, 560), box('uni05B7', 0x5b7, 0, -150, -120, 200, 50), box('A', 65, 600, 50, 0, 500, 700)]);
    expect(scriptTags(doc)).toEqual(['DFLT', 'hebr', 'latn']);
    const font = opentype.parse(exportOtf(doc).buffer as ArrayBuffer) as unknown as { tables: { gpos?: { scripts: { tag: string }[] } } };
    expect(font.tables.gpos!.scripts.map((s) => s.tag)).toEqual(['DFLT', 'hebr', 'latn']);
  });
});
