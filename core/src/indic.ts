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
  /** Vowel signs drawn in parts (two, or three in Kannada ೋ), around the consonant: text engines split them. */
  split: Record<number, number[]>;
  /** The letters ra that, before a virama and a consonant, become the reph. Empty for a script without one. */
  ras: number[];
  /** Where the reph goes: after the vowel signs that follow (Devanagari), or before them. */
  rephLast: boolean;
  /** The ra that, after a virama, is drawn before its consonant (pref: Malayalam ക്ര). */
  pref?: number;
  /** A reph typed as a letter before its consonant and drawn after it, on top (Malayalam ൎ). */
  dotReph?: number;
  /** Vowel signs go right after the base consonant, before its forms below (Telugu క్కి, Kannada ಕ್ಕಿ). */
  signsAfterBase?: boolean;
  /** A block not on the common plan (Sinhala, Khmer, Myanmar): its virama and its consonants. */
  virama?: number;
  consonants?: [number, number];
  /** What follows the ra to make the reph: the virama, or the asat and the virama of the Myanmar kinzi. */
  rephTail?: number[];
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
    tags: ['ory2', 'orya'], from: 0xb00, prebase: [0xb47], split: { 0xb48: [0xb47, 0xb56], 0xb4b: [0xb47, 0xb3e], 0xb4c: [0xb47, 0xb57] },
    ras: [0xb30], rephLast: false,
  },
  {
    tags: ['mlm2', 'mlym'], from: 0xd00, prebase: [0xd46, 0xd47, 0xd48], split: { 0xd4a: [0xd46, 0xd3e], 0xd4b: [0xd47, 0xd3e], 0xd4c: [0xd46, 0xd57] },
    ras: [], rephLast: false, pref: 0xd30, dotReph: 0xd4e,
  },
  { tags: ['tel2', 'telu'], from: 0xc00, prebase: [], split: { 0xc48: [0xc46, 0xc56] }, ras: [], rephLast: false, signsAfterBase: true },
  {
    tags: ['knd2', 'knda'], from: 0xc80, prebase: [],
    split: { 0xcc0: [0xcbf, 0xcd5], 0xcc7: [0xcc6, 0xcd5], 0xcc8: [0xcc6, 0xcd6], 0xcca: [0xcc6, 0xcc2], 0xccb: [0xcc6, 0xcc2, 0xcd5] },
    ras: [0xcb0], rephLast: true, signsAfterBase: true,
  },
  {
    tags: ['sinh', 'sinh'], from: 0xd80, prebase: [0xdd9, 0xddb],
    split: { 0xdda: [0xdd9, 0xdca], 0xddc: [0xdd9, 0xdcf], 0xddd: [0xdd9, 0xdcf, 0xdca], 0xdde: [0xdd9, 0xddf] },
    ras: [], rephLast: false, virama: 0xdca, consonants: [0xd9a, 0xdc6],
  },
  {
    // Myanmar: the virama (U+1039) stacks a consonant under another; nga, asat and virama before a consonant are the
    // kinzi, drawn over it. ေ and the medial ra ြ are drawn before the consonant, in that order.
    tags: ['mym2', 'mymr'], from: 0x1000, prebase: [0x1031, 0x103c], split: {}, ras: [0x1004], rephLast: false,
    virama: 0x1039, consonants: [0x1000, 0x1021], rephTail: [0x103a, 0x1039],
  },
  {
    // Khmer: the coeng (U+17D2) is its virama; a vowel in two parts keeps its own code for the part after the letter.
    tags: ['khmr', 'khmr'], from: 0x1780, prebase: [0x17c1, 0x17c2, 0x17c3],
    split: { 0x17be: [0x17c1, 0x17be], 0x17bf: [0x17c1, 0x17bf], 0x17c0: [0x17c1, 0x17c0], 0x17c4: [0x17c1, 0x17c4], 0x17c5: [0x17c1, 0x17c5] },
    ras: [], rephLast: false, virama: 0x17d2, consonants: [0x1780, 0x17a2], pref: 0x179a,
  },
  {
    tags: ['tml2', 'taml'], from: 0xb80, prebase: [0xbc6, 0xbc7, 0xbc8], split: { 0xbca: [0xbc6, 0xbbe], 0xbcb: [0xbc7, 0xbbe], 0xbcc: [0xbc6, 0xbd7] },
    ras: [], rephLast: false,
  },
];

const hex = (code: number): string => `uni${code.toString(16).toUpperCase().padStart(4, '0')}`;

export const indicOf = (code: number): IndicScript | undefined => INDIC.find((script) => code >= script.from && code < script.from + 0x80);
export const isIndic = (code: number): boolean => indicOf(code) !== undefined;
export const viramaOf = (script: IndicScript): number => script.virama ?? script.from + 0x4d;
export const viramaName = (script: IndicScript): string => hex(viramaOf(script));

/** A consonant: those of the block, those with a nukta, the Assamese ra and wa, the Odia wa. */
export function isConsonant(code: number): boolean {
  const script = indicOf(code);
  if (!script) return false;
  if (script.consonants) return code >= script.consonants[0] && code <= script.consonants[1];
  const at = code - script.from;
  return (at >= 0x15 && at <= 0x39) || (at >= 0x58 && at <= 0x5f) || (script.from === 0x980 && at === 0x70) || ((script.from === 0x980 || script.from === 0xb00) && at === 0x71);
}

/** A vowel sign, not the virama nor the nukta: what a ligature of a consonant and its vowel holds. */
export function isVowelSign(code: number): boolean {
  const script = indicOf(code);
  return script !== undefined && /\p{M}/u.test(String.fromCodePoint(code)) && code !== viramaOf(script) && code !== script.from + 0x3c;
}

/** The text with each split vowel sign written as its two parts, as text engines do before they shape. */
export function splitVowels(text: string): string {
  return splitParts(text).map((part) => part.char).join('');
}

/** The characters of a text, split vowel signs in their parts, each part marked: it takes no part in a conjunct. */
export function splitParts(text: string): { char: string; split: boolean }[] {
  return [...text].flatMap((char): { char: string; split: boolean }[] => {
    const code = char.codePointAt(0)!;
    const parts = indicOf(code)?.split[code];
    return parts ? parts.map((part) => ({ char: String.fromCodePoint(part), split: true })) : [{ char, split: false }];
  });
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
    const joined = script !== undefined && (before === viramaOf(script) || before === script.dotReph);
    const starts = !script || indicOf(before) !== script || (/\p{L}/u.test(item.char) && !joined);
    if (starts || out.length === 0) out.push([item]);
    else out[out.length - 1]!.push(item);
  });
  return out;
}

/** The forms a font has that move in a syllable: the reph, and the ra drawn before its consonant. */
export interface Movers<T> {
  reph(ra: T): T | undefined;
  pref(ra: T): T | undefined;
}

/** The ra after a virama, as the font's pre-base form, moved to the start of the syllable. */
function moveRa<T extends Unit>(letters: T[], script: IndicScript, pref: (ra: T) => T | undefined): T[] {
  const at = letters.findIndex((item, k) => k > 0 && codeOf(item) === viramaOf(script) && codeOf(letters[k + 1]) === script.pref);
  const made = at > 0 ? pref(letters[at + 1]!) : undefined;
  return made ? [made, ...letters.slice(0, at), ...letters.slice(at + 2)] : letters;
}

/** The vowel signs that move after the base: those of the block from ా to ౌ, not vocalic r nor the length marks. */
function movesToBase(code: number, script: IndicScript): boolean {
  const at = code - script.from;
  return at >= 0x3e && at <= 0x4c && at !== 0x43 && at !== 0x44;
}

/** Telugu and Kannada: the vowel signs after the first consonant, before the forms below that follow it. */
function signsToBase<T extends Unit>(letters: T[], script: IndicScript): T[] {
  if (!isConsonant(codeOf(letters[0]))) return letters;
  const signs = letters.filter((item, k) => k > 0 && movesToBase(codeOf(item), script));
  return [letters[0]!, ...signs, ...letters.slice(1).filter((item) => !signs.includes(item))];
}

/** One syllable in the order it is drawn: the reph moved to its place, the vowel signs drawn before go first. */
function reorder<T extends Unit>(syllable: T[], movers: Movers<T>): T[] {
  let letters = [...syllable];
  const script = indicOf(codeOf(letters[0]));
  if (!script) return letters;
  if (script.dotReph !== undefined && codeOf(letters[0]) === script.dotReph && letters.length > 1) letters = [letters[1]!, letters[0]!, ...letters.slice(2)];
  const tail = script.rephTail ?? [viramaOf(script)];
  const codes = letters.map(codeOf);
  const isReph = script.ras.includes(codes[0]!) && tail.every((code, k) => codes[k + 1] === code) && isConsonant(codes[tail.length + 1] ?? -1);
  const made = isReph ? movers.reph(letters[0]!) : undefined;
  if (made) {
    const rest = letters.slice(1 + tail.length);
    const after = script.rephLast ? -1 : rest.findIndex((item) => /\p{Mc}/u.test(item.char) && !script.prebase.includes(codeOf(item)));
    letters = after < 0 ? [...rest, made] : [...rest.slice(0, after), made, ...rest.slice(after)];
  }
  if (script.pref !== undefined) letters = moveRa(letters, script, movers.pref);
  if (script.signsAfterBase) letters = signsToBase(letters, script);
  // The signs drawn before the consonant, in the order the script lists them (Myanmar ေ then ြ).
  const before = letters.filter((item, k) => k > 0 && script.prebase.includes(codeOf(item)));
  before.sort((a, b) => script.prebase.indexOf(codeOf(a)) - script.prebase.indexOf(codeOf(b)));
  return before.length > 0 ? [...before, ...letters.filter((item) => !before.includes(item))] : letters;
}

/**
 * The letters of a line in the order they are drawn: in each Indic syllable, a ra and virama before a consonant become
 * the reph (when the font has one) at its place, a Malayalam ra after a virama its form before the consonant, and a
 * vowel sign drawn before its consonant goes first.
 */
export function reorderIndic<T extends Unit>(items: T[], movers: Movers<T>): T[] {
  return syllables(items).flatMap((syllable) => reorder(syllable, movers));
}
