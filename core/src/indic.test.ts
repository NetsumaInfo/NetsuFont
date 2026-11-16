import { describe, expect, it } from 'vitest';
import { composeLetters } from './accents';
import { newFont } from './doc';
import { featureRules } from './features';
import { reorderIndic, splitVowels } from './indic';
import { languageCoverage } from './languages';
import { applyOps, type Op } from './ops';
import { shapeLine } from './shape';

const box = (char: string, advance: number, y = 0, h = 500): Op => ({
  op: 'set_glyph',
  glyph: `uni${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`,
  unicode: char.codePointAt(0)!,
  advance,
  shapes: [{ type: 'rect', x: advance === 0 ? -200 : 40, y, w: advance === 0 ? 150 : advance - 80, h }],
});
const form = (glyph: string, advance: number): Op => ({ op: 'set_glyph', glyph, advance, shapes: [{ type: 'rect', x: advance === 0 ? -150 : 40, y: 600, w: 100, h: 80 }] });
const chars = (items: { char: string }[]): string => items.map((item) => item.char).join('');
const unit = (text: string): { char: string }[] => [...text].map((char) => ({ char }));

describe('Indic syllables', () => {
  it('splits a Bengali and a Tamil vowel in two parts', () => {
    expect(splitVowels('কো')).toBe('কো');
    expect(splitVowels('கௌ')).toBe('கௌ');
  });

  it('draws the pre-base vowel first and puts the Bengali reph before a vowel sign that follows', () => {
    const reph = (ra: { char: string }): { char: string } => ({ char: `R${ra.char}` });
    expect(chars(reorderIndic(unit('কি'), reph))).toBe('িক');
    expect(chars(reorderIndic(unit('র্কা'), reph))).toBe('কRরা');
    expect(chars(reorderIndic(unit('র্কি'), reph))).toBe('িকRর');
    // Devanagari keeps its reph last, after the vowel sign.
    expect(chars(reorderIndic(unit('र्का'), reph))).toBe('काRर');
  });
});

describe('Indic forms', () => {
  it('reads the Bengali forms from glyph names under bng2', () => {
    const doc = applyOps(newFont('t', 'T'), [
      ...[...'কষরযু্'].map((c) => box(c, /\p{M}/u.test(c) ? 0 : 500)),
      form('uni09B0.rphf', 0), form('uni09AF.pstf', 200), form('uni0995_uni09CD_uni09B7', 700), form('uni09B0_uni09C1', 500),
    ]);
    const rules = featureRules(doc).map((rule) => `${rule.feature} ${rule.script} ${rule.sub.join(' ')}`);
    expect(rules).toEqual(expect.arrayContaining(['rphf bng2 uni09B0 uni09CD', 'pstf bng2 uni09CD uni09AF', 'akhn bng2 uni0995 uni09CD uni09B7', 'psts bng2 uni09B0 uni09C1']));
    expect(shapeLine(doc, 'ক্য র্ক রু').items.map((item) => item.glyph.name)).toEqual(['uni0995', 'uni09AF.pstf', 'space', 'uni0995', 'uni09B0.rphf', 'space', 'uni09B0_uni09C1']);
  });

  it('makes a split vowel of its two parts side by side', () => {
    const doc = applyOps(newFont('t', 'T'), [box('ে', 200), box('া', 150)]);
    composeLetters(doc, 'ো');
    const glyph = doc.glyphs.find((g) => g.unicode === 0x9cb)!;
    expect(glyph.advance).toBe(350);
    expect(glyph.components).toEqual([{ glyph: 'uni09C7', x: 0, y: 0 }, { glyph: 'uni09BE', x: 200, y: 0 }]);
  });

  it('counts the Tamil letters with their vowel u drawn as one', () => {
    const [ta] = languageCoverage(newFont('t', 'T'), ['ta']);
    expect(ta!.forms).toContain('uni0B95_uni0BC1');
    expect(ta!.forms).toHaveLength(40);
  });
});
