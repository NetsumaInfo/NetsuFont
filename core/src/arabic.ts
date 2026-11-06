// Arabic, Persian and Urdu: how each letter joins its neighbours, the forms it needs, and the letters that are
// another letter's skeleton with dots.

/** The positional forms of a joining letter, as glyph name suffixes: `uni0628.init`. */
export type Form = 'init' | 'medi' | 'fina' | 'isol';

/** Letters that join on both sides. */
const DUAL = 'ئبتثجحخسشصضطظعغفقكلمنهىيٮٯڡپچکگیٹںہھ';
/** Letters that join only to the letter before them, on their right. */
const RIGHT_ONLY = 'آأؤإاةدذرزوژڈڑےۓ';
/** The tatweel stretches a join: it joins on both sides and never changes shape. */
const TATWEEL = 'ـ';

export type Joining = 'D' | 'R' | 'C' | 'T' | 'U';

/** How a character joins: D both sides, R to the one before only, C the tatweel, T a mark (skipped), U not at all. */
export function joiningOf(char: string): Joining {
  if (DUAL.includes(char)) return 'D';
  if (RIGHT_ONLY.includes(char)) return 'R';
  if (char === TATWEEL) return 'C';
  if (/\p{Mn}/u.test(char)) return 'T';
  return 'U';
}

/** The forms a letter must have besides its own glyph, which is its isolated form. */
export function formsOf(char: string): Form[] {
  const joining = joiningOf(char);
  if (joining === 'D') return ['init', 'medi', 'fina'];
  if (joining === 'R') return ['fina'];
  return [];
}

/** True for a character of the Arabic blocks. */
export function isArabic(code: number): boolean {
  return (code >= 0x600 && code <= 0x6ff) || (code >= 0x750 && code <= 0x77f) || (code >= 0xfb50 && code <= 0xfdff) || (code >= 0xfe70 && code <= 0xfeff);
}

/**
 * The lam-alef ligatures every Arabic font must have: lam then an alef is never set as two letters. Each needs its
 * isolated glyph and its `.fina` form (after a letter that joins).
 */
export const LAM_ALEF = ['uni0644_uni0627', 'uni0644_uni0623', 'uni0644_uni0625', 'uni0644_uni0622'];

/** The marks of the Arabic dots, by name: drawn once, placed by compose above or below the skeleton. */
export const ARABIC_MARKS_ABOVE = new Set(['dotabove-ar', 'twodotsabove-ar', 'threedotsabove-ar', 'hamzaabove-ar', 'madda-ar', 'tahabove-ar']);
export const ARABIC_MARKS_BELOW = new Set(['dotbelow-ar', 'twodotsbelow-ar', 'threedotsbelow-ar', 'hamzabelow-ar']);

/** Letters made of a skeleton and dots: the skeleton is drawn once, with its forms, and compose adds the dots. */
export const ARABIC_PARTS: Record<string, [string, string]> = {
  ب: ['ٮ', 'dotbelow-ar'], ت: ['ٮ', 'twodotsabove-ar'], ث: ['ٮ', 'threedotsabove-ar'], پ: ['ٮ', 'threedotsbelow-ar'], ٹ: ['ٮ', 'tahabove-ar'],
  ن: ['ں', 'dotabove-ar'], ي: ['ى', 'twodotsbelow-ar'], ئ: ['ى', 'hamzaabove-ar'],
  ج: ['ح', 'dotbelow-ar'], خ: ['ح', 'dotabove-ar'], چ: ['ح', 'threedotsbelow-ar'],
  ذ: ['د', 'dotabove-ar'], ڈ: ['د', 'tahabove-ar'], ز: ['ر', 'dotabove-ar'], ژ: ['ر', 'threedotsabove-ar'], ڑ: ['ر', 'tahabove-ar'],
  ش: ['س', 'threedotsabove-ar'], ض: ['ص', 'dotabove-ar'], ظ: ['ط', 'dotabove-ar'], غ: ['ع', 'dotabove-ar'],
  ف: ['ڡ', 'dotabove-ar'], ق: ['ٯ', 'twodotsabove-ar'], ة: ['ه', 'twodotsabove-ar'],
  أ: ['ا', 'hamzaabove-ar'], إ: ['ا', 'hamzabelow-ar'], آ: ['ا', 'madda-ar'], ؤ: ['و', 'hamzaabove-ar'],
};

/**
 * The Persian yeh has no dots alone or at the end, and two below at the start or in the middle: each of its forms is a
 * form of another letter. Compose makes it from them.
 */
export const FORM_OF: Record<string, Partial<Record<Form | 'base', string>>> = {
  ی: { base: 'ى', fina: 'ى', init: 'ي', medi: 'ي' },
};

/** Characters a right-to-left text swaps for their mirror: an opening bracket points the other way. */
export const MIRROR: Record<string, string> = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«', '‹': '›', '›': '‹' };

/** True for a letter written right to left: Hebrew, Arabic, Syriac, Thaana, N'Ko and their presentation forms. */
export function isRtl(code: number): boolean {
  if ((code >= 0x660 && code <= 0x669) || (code >= 0x6f0 && code <= 0x6f9)) return false;
  return (code >= 0x590 && code <= 0x8ff) || (code >= 0xfb1d && code <= 0xfdff) || (code >= 0xfe70 && code <= 0xfeff);
}
