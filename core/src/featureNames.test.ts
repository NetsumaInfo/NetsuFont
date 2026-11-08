import { describe, expect, it } from 'vitest';
import { nameFeatureGlyphs, type ParsedGsub } from './featureNames';
import type { Glyph } from './types';

const glyph = (name: string, unicode?: number): Glyph => ({ name, ...(unicode === undefined ? {} : { unicode }), advance: 500, path: '' });

describe('names from an imported GSUB', () => {
  it('names half forms, conjuncts and Arabic forms, through extension lookups, and the letters first', () => {
    // 0 .notdef, 1 ka (named kaDeva by its font), 2 virama, 3 ssa, 4 half ka, 5 ksha, 6 beh, 7 beh initial.
    const glyphs = [glyph('.notdef'), glyph('kaDeva', 0x915), glyph('uni094D', 0x94d), glyph('uni0937', 0x937), glyph('glyph4'), glyph('glyph5'), glyph('uni0628', 0x628), glyph('glyph7')];
    const gsub: ParsedGsub = {
      scripts: [{ tag: 'arab', script: { defaultLangSys: { featureIndexes: [2] } } }, { tag: 'dev2', script: { defaultLangSys: { featureIndexes: [0, 1] } } }],
      features: [{ tag: 'akhn', feature: { lookupListIndexes: [0] } }, { tag: 'half', feature: { lookupListIndexes: [1] } }, { tag: 'init', feature: { lookupListIndexes: [2] } }],
      lookups: [
        { lookupType: 7, subtables: [{ lookupType: 4, extension: { substFormat: 1, coverage: { format: 1, glyphs: [1] }, ligatureSets: [[{ ligGlyph: 5, components: [2, 3] }]] } }] },
        { lookupType: 4, subtables: [{ substFormat: 1, coverage: { format: 1, glyphs: [1] }, ligatureSets: [[{ ligGlyph: 4, components: [2] }]] }] },
        { lookupType: 1, subtables: [{ substFormat: 1, coverage: { format: 2, ranges: [{ start: 6, end: 6 }] }, deltaGlyphId: 1 }] },
      ],
    };
    expect(nameFeatureGlyphs(gsub, glyphs)).toBe(3);
    expect(glyphs.map((g) => g.name)).toEqual(['.notdef', 'uni0915', 'uni094D', 'uni0937', 'uni0915.half', 'uni0915_uni094D_uni0937', 'uni0628', 'uni0628.init']);
  });
});
