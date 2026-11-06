import { ARABIC_PARTS, FORM_OF } from './arabic';
import { nameOf } from './charset';

/** The spacing accent drawn for each combining mark, by its usual glyph name. */
export const MARKS: Record<number, string> = {
  0x300: 'grave', 0x301: 'acute', 0x302: 'circumflex', 0x303: 'tilde', 0x304: 'macron', 0x306: 'breve', 0x307: 'dotaccent',
  0x308: 'dieresis', 0x309: 'hookabove', 0x30a: 'ring', 0x30b: 'hungarumlaut', 0x30c: 'caron', 0x31b: 'horn', 0x323: 'dotbelow',
  0x326: 'commaaccent', 0x327: 'cedilla', 0x328: 'ogonek',
};

/** Marks that hang below the baseline, or sit at the right of the letter, instead of above it. */
export const BELOW = new Set(['dotbelow', 'commaaccent', 'cedilla', 'ogonek']);
export const RIGHT = new Set(['horn']);

/** Letters with no decomposition, by their usual glyph name. */
const NAMED: Record<string, string> = {
  ß: 'germandbls', æ: 'ae', Æ: 'AE', œ: 'oe', Œ: 'OE', ø: 'oslash', Ø: 'Oslash', ł: 'lslash', Ł: 'Lslash', đ: 'dcroat', Đ: 'Dcroat',
  ı: 'dotlessi', ð: 'eth', Ð: 'Eth', þ: 'thorn', Þ: 'Thorn', ħ: 'hbar', Ħ: 'Hbar', ŋ: 'eng', Ŋ: 'Eng', '«': 'guillemotleft',
  '»': 'guillemotright', '¿': 'questiondown', '¡': 'exclamdown', '‘': 'quoteleft', '’': 'quoteright', '‚': 'quotesinglbase',
  '“': 'quotedblleft', '”': 'quotedblright', '„': 'quotedblbase', '–': 'endash', '—': 'emdash', '…': 'ellipsis',
  '·': 'periodcentered', '€': 'Euro', '‹': 'guilsinglleft', '›': 'guilsinglright',
};

/** Latvian writes a comma under k l n and over g where Unicode says cedilla. */
const COMMA_FOR_CEDILLA: Record<string, string> = { ķ: 'commaaccent', Ķ: 'commaaccent', ļ: 'commaaccent', Ļ: 'commaaccent', ņ: 'commaaccent', Ņ: 'commaaccent', Ģ: 'commaaccent', ģ: 'commaturnedabove' };

const hex = (code: number): string => `uni${code.toString(16).toUpperCase().padStart(4, '0')}`;

/** Greek and Cyrillic letters drawn as a Latin one: made as a component of it, the same shape under another code. */
const LOOKALIKE: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x', і: 'i', ј: 'j', ѕ: 's', һ: 'h', А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M',
  Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X', І: 'I', Ј: 'J', Ѕ: 'S', Һ: 'H', Ә: 'Ə', ә: 'ə', Α: 'A',
  Β: 'B', Ε: 'E', Ζ: 'Z', Η: 'H', Ι: 'I', Κ: 'K', Μ: 'M', Ν: 'N', Ο: 'O', Ρ: 'P', Τ: 'T', Υ: 'Y', Χ: 'X', ο: 'o',
};

/** The glyph name of any character: its usual name, else uniXXXX. */
export function glyphName(char: string): string {
  const plain = nameOf(char) ?? NAMED[char];
  if (plain) return plain;
  const [baseChar, ...rest] = [...char.normalize('NFD')];
  const mark = rest.length === 1 ? MARKS[rest[0]!.codePointAt(0)!] : undefined;
  const code = char.codePointAt(0)!;
  // The Latin letters with one accent keep their usual names: eacute, scaron, zdotaccent.
  return mark && baseChar && nameOf(baseChar) && code <= 0x24f ? `${nameOf(baseChar)}${mark}` : hex(code);
}

export interface Recipe {
  name: string;
  unicode: number;
  /** The glyph it is built on, when it is not drawn on its own. */
  base?: string;
  marks?: string[];
}

/** An Arabic letter made of a skeleton and dots, or a Persian yeh made of other letters' forms. */
function arabicRecipe(char: string, name: string, unicode: number): Recipe | undefined {
  const parts = ARABIC_PARTS[char];
  if (parts) return { name, unicode, base: glyphName(parts[0]), marks: [parts[1]] };
  const forms = FORM_OF[char];
  if (forms?.base) return { name, unicode, base: glyphName(forms.base), marks: [] };
  return undefined;
}

/**
 * How a character is made: its glyph name and, when it is not drawn on its own, its base and its marks (an
 * accented letter, an Arabic letter with dots), or its base alone (a Greek or Cyrillic letter shaped as a Latin one).
 */
export function recipe(char: string): Recipe {
  const unicode = char.codePointAt(0)!;
  const name = glyphName(char);
  const same = LOOKALIKE[char];
  if (same) return { name, unicode, base: glyphName(same), marks: [] };
  const arabic = arabicRecipe(char, name, unicode);
  if (arabic) return arabic;
  const [baseChar, ...rest] = [...char.normalize('NFD')];
  const marks = rest.map((mark) => COMMA_FOR_CEDILLA[char] ?? MARKS[mark.codePointAt(0)!]);
  if (rest.length === 0 || !baseChar || marks.some((mark) => mark === undefined)) return { name, unicode };
  // An accent above an i or a j replaces its dot.
  const below = marks.every((mark) => BELOW.has(mark!));
  const base = !below && (baseChar === 'i' || baseChar === 'і') ? 'dotlessi' : !below && baseChar === 'j' ? 'uni0237' : glyphName(baseChar);
  return { name, unicode, base, marks: marks as string[] };
}
