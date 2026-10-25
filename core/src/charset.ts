import type { FontDoc } from './types';

const DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const SIGNS: Record<string, string> = {
  ' ': 'space', '!': 'exclam', '"': 'quotedbl', '#': 'numbersign', $: 'dollar', '%': 'percent', '&': 'ampersand', "'": 'quotesingle',
  '(': 'parenleft', ')': 'parenright', '*': 'asterisk', '+': 'plus', ',': 'comma', '-': 'hyphen', '.': 'period', '/': 'slash',
  ':': 'colon', ';': 'semicolon', '<': 'less', '=': 'equal', '>': 'greater', '?': 'question', '@': 'at', '[': 'bracketleft',
  '\\': 'backslash', ']': 'bracketright', '^': 'asciicircum', _: 'underscore', '`': 'grave', '{': 'braceleft', '|': 'bar',
  '}': 'braceright', '~': 'asciitilde',
};

/** The usual name of the glyph of a printable ASCII character, as in the Adobe Glyph List. */
export function nameOf(char: string): string | undefined {
  if (/^[A-Za-z]$/.test(char)) return char;
  if (/^[0-9]$/.test(char)) return DIGITS[Number(char)];
  return SIGNS[char];
}

/** The sets a font is measured against, from the smallest. */
export const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  punctuation: ' .,:;!?\'"-()/&@',
  ascii: Array.from({ length: 95 }, (_, index) => String.fromCharCode(32 + index)).join(''),
} as const;

export type Charset = keyof typeof CHARSETS;

/** What a font draws of each set: how many characters, and which are missing. */
export function coverage(doc: FontDoc): { set: Charset; has: number; of: number; missing: string }[] {
  const drawn = new Set(doc.glyphs.flatMap((glyph) => (glyph.unicode === undefined ? [] : [glyph.unicode])));
  return (Object.keys(CHARSETS) as Charset[]).map((set) => {
    const chars = [...CHARSETS[set]];
    const missing = chars.filter((char) => !drawn.has(char.codePointAt(0)!));
    return { set, has: chars.length - missing.length, of: chars.length, missing: missing.join('') };
  });
}
