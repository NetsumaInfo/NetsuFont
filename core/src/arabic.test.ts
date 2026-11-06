import opentype from 'opentype.js';
import { describe, expect, it } from 'vitest';
import { checkGlyphs } from './check';
import { newFont } from './doc';
import { featureRules, optionalFeatures } from './features';
import { languageCoverage } from './languages';
import { applyOps, type Op } from './ops';
import { exportOtf } from './otf';
import { layout } from './layout';
import { bidiLevels, shapeLine, visualOrder } from './shape';

const bar = (name: string, unicode?: number, w = 300, x0 = 0, x1 = 300): Op => ({ op: 'set_glyph', glyph: name, ...(unicode === undefined ? {} : { unicode }), advance: w, shapes: [{ type: 'rect', x: x0, y: 0, w: x1 - x0, h: 80 }] });

/** A tiny Arabic font: the beh skeleton, alef, lam, their forms, the dot below, lam-alef. */
function arabic() {
  return applyOps(newFont('t', 'T'), [
    bar('uni066E', 0x66e, 300, 40, 260), bar('uni066E.init', undefined, 250, 0, 220), bar('uni066E.medi', undefined, 200, 0, 200), bar('uni066E.fina', undefined, 300, 40, 300),
    { op: 'set_glyph', glyph: 'uni0627', unicode: 0x627, advance: 150, shapes: [{ type: 'rect', x: 50, y: 0, w: 60, h: 600 }] },
    { op: 'set_glyph', glyph: 'uni0627.fina', advance: 150, shapes: [{ type: 'rect', x: 50, y: 0, w: 60, h: 600 }, { type: 'rect', x: 50, y: 0, w: 100, h: 60 }] },
    bar('uni0644', 0x644), bar('uni0644.init', undefined, 300, 0, 260), bar('uni0644.medi', undefined, 300, 0, 300), bar('uni0644.fina', undefined, 300, 40, 300),
    bar('uni0644_uni0627', undefined, 400, 40, 360), bar('uni0644_uni0627.fina', undefined, 400, 40, 400),
    { op: 'set_glyph', glyph: 'dotbelow-ar', advance: 100, shapes: [{ type: 'rect', x: 0, y: -200, w: 80, h: 80 }] },
    { op: 'compose', chars: 'ب' },
  ]);
}

describe('Arabic', () => {
  it('composes a letter and its forms from the skeleton and a dot', () => {
    const doc = arabic();
    const get = (name: string) => doc.glyphs.find((g) => g.name === name);
    expect(get('uni0628')?.unicode).toBe(0x628);
    expect(get('uni0628.init')?.components?.[0]).toEqual({ glyph: 'uni066E.init', x: 0, y: 0 });
    expect(get('uni0628.fina')?.components?.[1]?.glyph).toBe('dotbelow-ar');
    expect(get('uni0628.medi')?.unicode).toBeUndefined();
  });

  it('turns glyph names into features', () => {
    const rules = featureRules(arabic());
    expect(rules).toContainEqual({ feature: 'init', script: 'arab', sub: ['uni0628'], by: 'uni0628.init' });
    expect(rules).toContainEqual({ feature: 'rlig', script: 'arab', sub: ['uni0644.init', 'uni0627.fina'], by: 'uni0644_uni0627' });
    expect(rules).toContainEqual({ feature: 'rlig', script: 'arab', sub: ['uni0644.medi', 'uni0627.fina'], by: 'uni0644_uni0627.fina' });
  });

  it('joins letters, makes lam-alef and sets the word right to left', () => {
    const doc = arabic();
    // Latin letters the font lacks end the word. بباب: beh init, beh medi, alef fina, beh isol. Drawn right to left: the last letter read is on the left.
    expect(shapeLine(doc, 'ببab').items.map((i) => i.glyph.name)).toEqual(['uni0628.fina', 'uni0628.init']);
    expect(shapeLine(doc, 'بباب').items.map((i) => i.glyph.name)).toEqual(['uni0628', 'uni0627.fina', 'uni0628.medi', 'uni0628.init']);
    expect(shapeLine(doc, 'لا').items.map((i) => i.glyph.name)).toEqual(['uni0644_uni0627']);
    expect(shapeLine(doc, 'بلا').items.map((i) => i.glyph.name)).toEqual(['uni0644_uni0627.fina', 'uni0628.init']);
  });

  it('finds the forms a language lacks and joins that do not touch the edge', () => {
    const doc = arabic();
    const ar = languageCoverage(doc, ['ar'])[0]!;
    expect(ar.forms).toContain('uni062C.init');
    expect(ar.forms).not.toContain('uni0628.init');
    expect(checkGlyphs(doc, ['uni066E.init'])).toEqual([]);
    expect(checkGlyphs(applyOps(doc, [bar('uni066E.fina', undefined, 300, 40, 250)]), ['uni066E.fina'])[0]?.text).toMatch(/joins by its right/);
  });

  it('writes the forms and ligatures as GSUB', () => {
    const doc = arabic();
    const font = opentype.parse(exportOtf(doc).buffer as ArrayBuffer) as unknown as { substitution: { getSingle(f: string, s: string, l: string): { sub: number; by: number }[]; getLigatures(f: string, s: string, l: string): { sub: number[]; by: number }[] } };
    const index = (name: string) => doc.glyphs.findIndex((g) => g.name === name) + 1;
    expect(font.substitution.getSingle('init', 'arab', 'dflt')).toContainEqual({ sub: index('uni0628'), by: index('uni0628.init') });
    expect(font.substitution.getLigatures('rlig', 'arab', 'dflt')).toContainEqual({ sub: [index('uni0644.init'), index('uni0627.fina')], by: index('uni0644_uni0627') });
  });
});

describe('bidi and features', () => {
  it('orders a right-to-left word inside a left-to-right line, numbers kept in their order', () => {
    const chars = [...'ab אב 12 c'];
    const levels = bidiLevels(chars);
    expect(levels.slice(0, 3)).toEqual([0, 0, 0]);
    expect(levels[3]).toBe(1);
    const seen = visualOrder(levels).map((i) => chars[i]).join('');
    expect(seen).toBe('ab 12 בא c');
    expect(visualOrder(bidiLevels([...'אב 12'])).map((i) => [...'אב 12'][i]).join('')).toBe('12 בא');
  });

  it('makes ligatures and stylistic sets from names', () => {
    const doc = applyOps(newFont('t', 'T'), [bar('f', 102), bar('i', 105), bar('f_i'), bar('a', 97), bar('a.ss01')]);
    expect(layout(doc, 'fia').placed.map((p) => p.glyph.name)).toEqual(['f_i', 'a']);
    expect(layout(doc, 'fia', ['ss01']).placed.map((p) => p.glyph.name)).toEqual(['f_i', 'a.ss01']);
    expect(optionalFeatures(doc)).toEqual(['ss01']);
  });
});
