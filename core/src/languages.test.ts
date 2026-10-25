import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { languageCoverage, LANGUAGES, recipe } from './languages';
import { applyOps } from './ops';
import { FontError } from './types';

function withMarks() {
  return applyOps(newFont('t', 'T'), [
    { op: 'set_glyph', glyph: 'e', unicode: 101, advance: 500, shapes: [{ type: 'rect', x: 50, y: 0, w: 400, h: 500 }] },
    { op: 'set_glyph', glyph: 'E', unicode: 69, advance: 500, shapes: [{ type: 'rect', x: 50, y: 0, w: 400, h: 700 }] },
    { op: 'set_glyph', glyph: 'a', unicode: 97, advance: 500, shapes: [{ type: 'rect', x: 50, y: 0, w: 400, h: 500 }] },
    { op: 'set_glyph', glyph: 'acute', advance: 200, shapes: [{ type: 'rect', x: 0, y: 560, w: 100, h: 120 }] },
    { op: 'set_glyph', glyph: 'circumflex', advance: 200, shapes: [{ type: 'rect', x: 0, y: 560, w: 200, h: 100 }] },
    { op: 'set_glyph', glyph: 'cedilla', advance: 200, shapes: [{ type: 'rect', x: 0, y: -150, w: 100, h: 150 }] },
  ]);
}

describe('languages and accents', () => {
  it('knows how each letter is made', () => {
    expect(recipe('é')).toEqual({ name: 'eacute', unicode: 0xe9, base: 'e', marks: ['acute'] });
    expect(recipe('í').base).toBe('dotlessi');
    expect(recipe('ấ')).toMatchObject({ name: 'uni1EA5', base: 'a', marks: ['circumflex', 'acute'] });
    expect(recipe('ß')).toEqual({ name: 'germandbls', unicode: 0xdf });
    expect(recipe('ж')).toEqual({ name: 'uni0436', unicode: 0x436 });
  });

  it('centres a mark, raises it on a capital and stacks a second one', () => {
    const doc = applyOps(withMarks(), [{ op: 'compose', chars: 'éÉấ' }]);
    const get = (name: string) => doc.glyphs.find((g) => g.name === name)!;
    expect(get('eacute').components).toEqual([{ glyph: 'e', x: 0, y: 0 }, { glyph: 'acute', x: 200, y: 0 }]);
    expect(get('Eacute').components?.[1]).toEqual({ glyph: 'acute', x: 200, y: 200 });
    expect(get('uni1EA5').components?.[2]).toEqual({ glyph: 'acute', x: 200, y: 130 });
    expect(get('eacute').advance).toBe(500);
  });

  it('names every glyph to draw first, and changes nothing', () => {
    expect(() => applyOps(withMarks(), [{ op: 'compose', chars: 'èç' }])).toThrow(/grave, c/);
    expect(() => applyOps(withMarks(), [{ op: 'compose', chars: 'ß' }])).toThrow(FontError);
  });

  it('counts what each language lacks', () => {
    const doc = applyOps(withMarks(), [{ op: 'compose', chars: 'é' }]);
    const fr = languageCoverage(doc, ['fr'])[0]!;
    expect(fr.missing).not.toContain('é');
    expect(fr.missing).toContain('ç');
    expect(LANGUAGES.map((l) => l.code)).toContain('vi');
  });
});

describe('Cyrillic and Greek', () => {
  it('makes a lookalike from its Latin letter and accents it in the same op', () => {
    const doc = applyOps(newFont('t', 'T'), [
      { op: 'set_glyph', glyph: 'e', unicode: 101, advance: 500, shapes: [{ type: 'rect', x: 50, y: 0, w: 400, h: 500 }] },
      { op: 'set_glyph', glyph: 'dieresis', advance: 200, shapes: [{ type: 'rect', x: 0, y: 560, w: 200, h: 80 }] },
      { op: 'compose', chars: 'ёе' },
    ]);
    expect(doc.glyphs.find((g) => g.name === 'uni0435')?.components).toEqual([{ glyph: 'e', x: 0, y: 0 }]);
    expect(doc.glyphs.find((g) => g.name === 'uni0451')?.components?.[0]).toEqual({ glyph: 'uni0435', x: 0, y: 0 });
  });
});
