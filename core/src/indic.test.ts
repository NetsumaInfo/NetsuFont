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
    const reph = { reph: (ra: { char: string }): { char: string } => ({ char: `R${ra.char}` }), pref: () => undefined };
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

describe('Odia and Malayalam', () => {
  it('draws the Malayalam ra after a virama before its consonant, and the dot reph after it', () => {
    const movers = { reph: () => undefined, pref: (ra: { char: string }) => ({ char: `P${ra.char}` }) };
    expect(chars(reorderIndic(unit('ക്ര'), movers))).toBe('Pരക');
    expect(chars(reorderIndic(unit('ക്രെ'), movers))).toBe('െPരക');
    expect(chars(reorderIndic(unit('ൎക'), movers))).toBe('കൎ');
  });

  it('puts the Odia reph after its consonant, before a vowel sign that follows', () => {
    const movers = { reph: (ra: { char: string }) => ({ char: `R${ra.char}` }), pref: () => undefined };
    expect(chars(reorderIndic(unit('ର୍କା'), movers))).toBe('କRରା');
    expect(chars(reorderIndic(unit('କୋ'.normalize('NFD')), movers))).toBe('େକା');
  });
});

describe('Telugu and Kannada', () => {
  it('counts each consonant with each vowel sign, and composes them from the consonant without its head stroke', () => {
    const [te, kn] = languageCoverage(newFont('t', 'T'), ['te', 'kn']);
    expect(te!.forms).toContain('uni0C15_uni0C3F');
    expect(te!.forms).toContain('uni0C15_uni0C46_uni0C56');
    expect(kn!.forms).toContain('uni0C95_uni0CC6_uni0CC2');
    const doc = applyOps(newFont('t', 'T'), [box('క', 600), form('uni0C15.base', 560), box('ి', 0), box('ె', 0), box('ౖ', 0), box('ా', 300), box('ు', 300), box('ూ', 300), box('ే', 0), box('ొ', 300), box('ో', 300), box('ౌ', 300), box('ీ', 0)]);
    const done = applyOps(doc, [{ op: 'compose', syllables: 'te' }]).glyphs.find((g) => g.name === 'uni0C15_uni0C3E')!;
    expect(done.components).toEqual([{ glyph: 'uni0C15.base', x: 0, y: 0 }, { glyph: 'uni0C3E', x: 560, y: 0 }]);
    expect(done.advance).toBe(860);
  });

  it('puts the Kannada reph last and splits ೋ in three', () => {
    const movers = { reph: (ra: { char: string }) => ({ char: `R${ra.char}` }), pref: () => undefined };
    expect(chars(reorderIndic(unit('ರ್ಕಾ'), movers))).toBe('ಕಾRರ');
    expect(splitVowels('ಕೋ')).toBe('ಕೋ');
  });
});

describe('Sinhala', () => {
  it('counts each consonant with al-lakuna, u and uu, and keeps the al-lakuna of ේ out of a conjunct', () => {
    const [si] = languageCoverage(newFont('t', 'T'), ['si']);
    expect(si!.forms).toHaveLength(123);
    expect(si!.forms).toContain('uni0D9A_uni0DCA');
    const doc = applyOps(newFont('t', 'T'), [box('ක', 600), box('ෙ', 300), box('්', 0), form('uni0D9A_uni0DCA', 600)]);
    expect(shapeLine(doc, 'ක්').items.map((i) => i.glyph.name)).toEqual(['uni0D9A_uni0DCA']);
    expect(shapeLine(doc, 'කේ').items.map((i) => i.glyph.name)).toEqual(['uni0DD9', 'uni0D9A', 'uni0DCA']);
  });
});
