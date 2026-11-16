// The Indic scripts NetsuFont shapes: what a text engine reorders in a syllable before it applies the font's features.
// The browser does this itself with the exported font; `proof` does it here so that both show the same thing. Their
// blocks follow the same plan (ISCII): a consonant, the virama or the ra sits at the same offset in each.

export interface IndicScript {
  /** The OpenType tags: the one of today's shaping (v2) first, then the old one. */
  tags: [string, string];
  /** The first code point of the block; a block is 128 code points. */
  from: number;
  /** Vowel signs written after their consonant and drawn before it. */
  prebase: number[];
  /** Vowel signs drawn in two parts, one before the consonant and one after: text engines split them. */
  split: Record<number, [number, number]>;
  /** The letters ra that, before a virama and a consonant, become the reph. Empty for a script without one. */
  ras: number[];
  /** Where the reph goes: after the vowel signs that follow (Devanagari), or before them. */
  rephLast: boolean;
}

export const INDIC: IndicScript[] = [
  { tags: ['dev2', 'deva'], from: 0x900, prebase: [0x93f], split: {}, ras: [0x930], rephLast: true },
  {
    tags: ['bng2', 'beng'], from: 0x980, prebase: [0x9bf, 0x9c7, 0x9c8], split: { 0x9cb: [0x9c7, 0x9be], 0x9cc: [0x9c7, 0x9d7] },
    ras: [0x9b0, 0x9f0], rephLast: false,
  },
  { tags: ['gur2', 'guru'], from: 0xa00, prebase: [0xa3f], split: {}, ras: [], rephLast: false },
  { tags: ['gjr2', 'gujr'], from: 0xa80, prebase: [0xabf], split: {}, ras: [0xab0], rephLast: false },
  {
    tags: ['tml2', 'taml'], from: 0xb80, prebase: [0xbc6, 0xbc7, 0xbc8], split: { 0xbca: [0xbc6, 0xbbe], 0xbcb: [0xbc7, 0xbbe], 0xbcc: [0xbc6, 0xbd7] },
    ras: [], rephLast: false,
  },
];

const hex = (code: number): string => `uni${code.toString(16).toUpperCase().padStart(4, '0')}`;

export const indicOf = (code: number): IndicScript | undefined => INDIC.find((script) => code >= script.from && code < script.from + 0x80);
export const isIndic = (code: number): boolean => indicOf(code) !== undefined;
export const viramaOf = (script: IndicScript): number => script.from + 0x4d;
export const viramaName = (script: IndicScript): string => hex(viramaOf(script));

/** A consonant: those of the block, those with a nukta, and the Assamese ra and wa. */
export function isConsonant(code: number): boolean {
  const script = indicOf(code);
  if (!script) return false;
  const at = code - script.from;
  return (at >= 0x15 && at <= 0x39) || (at >= 0x58 && at <= 0x5f) || (script.from === 0x980 && (at === 0x70 || at === 0x71));
}

/** A vowel sign, not the virama nor the nukta: what a ligature of a consonant and its vowel holds. */
export function isVowelSign(code: number): boolean {
  const script = indicOf(code);
  return script !== undefined && /\p{M}/u.test(String.fromCodePoint(code)) && code !== viramaOf(script) && code !== script.from + 0x3c;
}

/** The text with each split vowel sign written as its two parts, as text engines do before they shape. */
export function splitVowels(text: string): string {
  return [...text].map((char) => {
    const code = char.codePointAt(0)!;
    const parts = indicOf(code)?.split[code];
    return parts ? String.fromCodePoint(...parts) : char;
  }).join('');
}

interface Unit {
  char: string;
}

const codeOf = (item: Unit | undefined): number => item?.char.codePointAt(0) ?? -1;

/** The syllables of a run: a new one starts at a letter not joined by a virama, or out of the script. */
function syllables<T extends Unit>(items: T[]): T[][] {
  const out: T[][] = [];
  items.forEach((item, i) => {
    const [code, before] = [codeOf(item), codeOf(items[i - 1])];
    const script = indicOf(code);
    const joined = script !== undefined && before === viramaOf(script);
    const starts = !script || indicOf(before) !== script || (/\p{L}/u.test(item.char) && !joined);
    if (starts || out.length === 0) out.push([item]);
    else out[out.length - 1]!.push(item);
  });
  return out;
}

/** One syllable in the order it is drawn: the reph moved to its place, the vowel signs drawn before go first. */
function reorder<T extends Unit>(syllable: T[], reph: (ra: T) => T | undefined): T[] {
  let letters = [...syllable];
  const script = indicOf(codeOf(letters[0]));
  if (!script) return letters;
  const [first, second, third] = letters.map(codeOf);
  const made = script.ras.includes(first!) && second === viramaOf(script) && third !== undefined && isConsonant(third) ? reph(letters[0]!) : undefined;
  if (made) {
    const rest = letters.slice(2);
    const after = script.rephLast ? -1 : rest.findIndex((item) => /\p{Mc}/u.test(item.char) && !script.prebase.includes(codeOf(item)));
    letters = after < 0 ? [...rest, made] : [...rest.slice(0, after), made, ...rest.slice(after)];
  }
  const at = letters.findIndex((item) => script.prebase.includes(codeOf(item)));
  if (at > 0) letters = [letters[at]!, ...letters.slice(0, at), ...letters.slice(at + 1)];
  return letters;
}

/**
 * The letters of a line in the order they are drawn: in each Indic syllable, a ra and virama before a consonant become
 * the reph (when `reph` gives one) at its place, and a vowel sign drawn before its consonant goes first.
 */
export function reorderIndic<T extends Unit>(items: T[], reph: (ra: T) => T | undefined): T[] {
  return syllables(items).flatMap((syllable) => reorder(syllable, reph));
}
