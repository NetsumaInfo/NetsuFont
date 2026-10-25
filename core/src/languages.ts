import { nameOf } from './charset';
import type { FontDoc } from './types';

/**
 * The letters each language needs beyond the basic Latin set, lowercase then uppercase, and its own punctuation.
 * Basic Latin (A–Z, a–z, digits, ASCII punctuation) is needed by every language written in Latin script.
 */
export interface Language {
  code: string;
  script: 'latin' | 'greek' | 'cyrillic' | 'hebrew';
  chars: string;
}

const LATIN_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?\'"-()/&';

export const LANGUAGES: Language[] = [
  { code: 'en', script: 'latin', chars: '’‘“”–—…' },
  { code: 'fr', script: 'latin', chars: 'àâæçéèêëîïôœùûüÿÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ«»’–—…' },
  { code: 'es', script: 'latin', chars: 'áéíñóúüÁÉÍÑÓÚÜ¿¡«»’“”–—…' },
  { code: 'pt', script: 'latin', chars: 'àáâãçéêíóôõúÀÁÂÃÇÉÊÍÓÔÕÚ«»’“”–—…' },
  { code: 'it', script: 'latin', chars: 'àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ«»’“”–—…' },
  { code: 'de', script: 'latin', chars: 'äöüßÄÖÜ„“”‚‘’«»–—…' },
  { code: 'nl', script: 'latin', chars: 'áéíóúëïöüÁÉÍÓÚËÏÖÜ’“”–—…' },
  { code: 'sv', script: 'latin', chars: 'åäöÅÄÖ”’–—…' },
  { code: 'da', script: 'latin', chars: 'æøåÆØÅ„“«»’–—…' },
  { code: 'nb', script: 'latin', chars: 'æøåÆØÅ«»’“”–—…' },
  { code: 'fi', script: 'latin', chars: 'äöåÄÖÅ”’–—…' },
  { code: 'pl', script: 'latin', chars: 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ„”«»’–—…' },
  { code: 'cs', script: 'latin', chars: 'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ„“‚‘»«–—…' },
  { code: 'sk', script: 'latin', chars: 'áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ„“–—…' },
  { code: 'hu', script: 'latin', chars: 'áéíóöőúüűÁÉÍÓÖŐÚÜŰ„”»«–—…' },
  { code: 'ro', script: 'latin', chars: 'ăâîșțĂÂÎȘȚ„”«»–—…' },
  { code: 'hr', script: 'latin', chars: 'čćđšžČĆĐŠŽ„”»«–—…' },
  { code: 'tr', script: 'latin', chars: 'çğıöşüâîûÇĞİÖŞÜÂÎÛ“”‘’«»–—…' },
  { code: 'vi', script: 'latin', chars: 'àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ“”–—…' },
  { code: 'el', script: 'greek', chars: 'αβγδεζηθικλμνξοπρσςτυφχψωάέήίόύώϊϋΐΰΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩΆΈΉΊΌΎΏΪΫ0123456789.,:;!«»’–—…·;' },
  { code: 'ru', script: 'cyrillic', chars: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789.,:;!?-()«»„“–—…№' },
  { code: 'uk', script: 'cyrillic', chars: 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюяАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ0123456789.,:;!?-()«»„“’–—…№' },
  { code: 'he', script: 'hebrew', chars: 'אבגדהוזחטיךכלםמןנסעףפץצקרשת0123456789.,:;!?-()"\'׳״–—…₪' },
];

/** Scripts the format cannot serve yet: their letters change shape with their neighbours, which needs GSUB. */
export const UNSUPPORTED_SCRIPTS = 'Arabic, Persian, Urdu, Hindi and the other Indic scripts, Thai, Khmer: their letters change shape with their neighbours (GSUB), not written yet. Chinese, Japanese, Korean: thousands of glyphs.';

/** Every character a language needs: basic Latin first for a Latin language, then its own. */
export function charsOf(language: Language): string[] {
  return [...new Set([...(language.script === 'latin' ? LATIN_BASE : ''), ...language.chars])];
}

/** What a font covers of each language, the missing characters named. */
export function languageCoverage(doc: FontDoc, codes?: string[]): { code: string; has: number; of: number; missing: string[] }[] {
  const drawn = new Set(doc.glyphs.flatMap((glyph) => (glyph.unicode === undefined ? [] : [glyph.unicode])));
  return LANGUAGES.filter((language) => codes === undefined || codes.includes(language.code)).map((language) => {
    const chars = charsOf(language);
    const missing = chars.filter((char) => !drawn.has(char.codePointAt(0)!));
    return { code: language.code, has: chars.length - missing.length, of: chars.length, missing };
  });
}

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
  ı: 'dotlessi', ð: 'eth', Ð: 'Eth', þ: 'thorn', Þ: 'Thorn', '«': 'guillemotleft', '»': 'guillemotright', '¿': 'questiondown',
  '¡': 'exclamdown', '‘': 'quoteleft', '’': 'quoteright', '‚': 'quotesinglbase', '“': 'quotedblleft', '”': 'quotedblright',
  '„': 'quotedblbase', '–': 'endash', '—': 'emdash', '…': 'ellipsis', '·': 'periodcentered', '€': 'Euro', '₪': 'uni20AA', '№': 'uni2116',
};

const hex = (code: number): string => `uni${code.toString(16).toUpperCase().padStart(4, '0')}`;

/** Greek and Cyrillic letters drawn as a Latin one: made as a component of it, the same shape under another code. */
const LOOKALIKE: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x', і: 'i', ј: 'j', ѕ: 's', А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H',
  О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X', І: 'I', Ј: 'J', Ѕ: 'S', Α: 'A', Β: 'B', Ε: 'E', Ζ: 'Z', Η: 'H', Ι: 'I', Κ: 'K', Μ: 'M',
  Ν: 'N', Ο: 'O', Ρ: 'P', Τ: 'T', Υ: 'Y', Χ: 'X', ο: 'o',
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

/**
 * How a character is made: its glyph name and, when it is not drawn on its own, its base and its marks (an
 * accented letter), or its base alone (a Greek or Cyrillic letter shaped as a Latin one).
 */
export function recipe(char: string): { name: string; unicode: number; base?: string; marks?: string[] } {
  const unicode = char.codePointAt(0)!;
  const name = glyphName(char);
  const same = LOOKALIKE[char];
  if (same) return { name, unicode, base: same, marks: [] };
  const [baseChar, ...rest] = [...char.normalize('NFD')];
  const marks = rest.map((mark) => MARKS[mark.codePointAt(0)!]);
  if (rest.length === 0 || !baseChar || marks.some((mark) => mark === undefined)) return { name, unicode };
  // An accent above an i or a j replaces its dot.
  const below = marks.every((mark) => BELOW.has(mark!));
  const base = !below && (baseChar === 'i' || baseChar === 'і') ? 'dotlessi' : !below && baseChar === 'j' ? 'uni0237' : glyphName(baseChar);
  return { name, unicode, base, marks: marks as string[] };
}
