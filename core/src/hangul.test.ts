import { describe, expect, it } from 'vitest';
import { newFont } from './doc';
import { hangulLines, hangulPath } from './hangul';
import { languageCoverage } from './languages';
import { bounds, parsePath } from './path';

const extent = (lines: [number, number][][]) => {
  const xs = lines.flat().map(([x]) => x);
  const ys = lines.flat().map(([, y]) => y);
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)].map((v) => Math.round(v * 100) / 100);
};

describe('Hangul from its letters', () => {
  it('puts the initial left of a vertical vowel and above a horizontal one', () => {
    // 가: ㄱ then ㅏ, no final. ㄱ is one line, ㅏ two.
    const ga = hangulLines('가');
    expect(ga).toHaveLength(3);
    expect(extent(ga.slice(0, 1))[1]).toBeLessThan(0.6);
    // 고: ㄱ above ㅗ.
    const go = hangulLines('고');
    expect(extent(go.slice(0, 1))[2]).toBeGreaterThan(0.44);
  });

  it('keeps a final in the bottom band and splits a cluster in two', () => {
    // 닭: ㄷ, ㅏ, final ㄺ (ㄹ and ㄱ side by side).
    const lines = hangulLines('닭');
    const final = lines.slice(-2);
    expect(extent(final)[3]).toBeLessThanOrEqual(0.34);
    expect(extent(lines.slice(-1))[0]).toBeGreaterThan(0.45);
  });

  it('draws in the frame with the pen, and counts Korean', () => {
    const box = bounds(parsePath(hangulPath('ㅡ', { width: 60, ends: 'flat' }, { left: 0, right: 1000, top: 880 })))!;
    expect(Math.round(box.yMax - box.yMin)).toBe(60);
    const ko = languageCoverage(newFont('t', 'T'), ['ko'])[0]!;
    expect(ko.of).toBeGreaterThan(2350 + 51);
    expect(ko.missing).toContain('한');
  });
});
