// Devanagari: what a text engine reorders in a syllable before it applies the font's features. The browser does this
// itself with the exported font; `proof` does it here so that both show the same thing.

export const VIRAMA = 0x94d;
export const VIRAMA_NAME = 'uni094D';
/** The vowel sign i, written after its consonant and drawn before it. */
const PREBASE_MATRA = 0x93f;

export const isDevanagari = (code: number): boolean => code >= 0x900 && code <= 0x97f;
export const isConsonant = (code: number): boolean => (code >= 0x915 && code <= 0x939) || (code >= 0x958 && code <= 0x95f);
const isIndependentVowel = (code: number): boolean => code >= 0x904 && code <= 0x914;

interface Unit {
  char: string;
}

/** The syllables of a run: a new one starts at a consonant not joined by a virama, at a vowel, or out of the script. */
function syllables<T extends Unit>(items: T[]): T[][] {
  const out: T[][] = [];
  items.forEach((item, i) => {
    const code = item.char.codePointAt(0)!;
    const before = i > 0 ? items[i - 1]!.char.codePointAt(0)! : -1;
    const starts = !isDevanagari(code) || !isDevanagari(before) || isIndependentVowel(code) || (isConsonant(code) && before !== VIRAMA);
    if (starts || out.length === 0) out.push([item]);
    else out[out.length - 1]!.push(item);
  });
  return out;
}

/**
 * The letters of a line in the order they are drawn: in each Devanagari syllable, a ra and virama before a consonant
 * become the reph (`reph`, when the font has one) at the end of the syllable, and the vowel sign i goes first.
 */
export function reorderIndic<T extends Unit>(items: T[], reph: ((ra: T) => T) | undefined): T[] {
  return syllables(items).flatMap((syllable) => {
    let letters = [...syllable];
    const [first, second, third] = letters.map((item) => item.char.codePointAt(0)!);
    if (reph && first === 0x930 && second === VIRAMA && third !== undefined && isConsonant(third)) letters = [...letters.slice(2), reph(letters[0]!)];
    const at = letters.findIndex((item) => item.char.codePointAt(0) === PREBASE_MATRA);
    if (at > 0) letters = [letters[at]!, ...letters.slice(0, at), ...letters.slice(at + 1)];
    return letters;
  });
}
