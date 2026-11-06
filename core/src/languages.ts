import { formsOf, LAM_ALEF } from './arabic';
import { glyphName } from './names';
import type { FontDoc } from './types';

export type Script = 'latin' | 'greek' | 'cyrillic' | 'armenian' | 'georgian' | 'hebrew' | 'arabic' | 'devanagari' | 'thai' | 'lao';

/**
 * The letters each language needs beyond the basic Latin set, lowercase then uppercase, and its own punctuation.
 * Basic Latin (A–Z, a–z, digits, ASCII punctuation) is needed by every language written in Latin script.
 */
export interface Language {
  code: string;
  script: Script;
  chars: string;
}

const LATIN_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?\'"-()/&';
const QUOTES = '’“”–—…';

/** The characters from one code point to another, both included. */
const span = (from: number, to: number): string => String.fromCodePoint(...Array.from({ length: to - from + 1 }, (_, i) => from + i));

const RU = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const CYRILLIC_PUNCT = '0123456789.,:;!?-()«»„“’–—…№';
const HEBREW = 'אבגדהוזחטיךכלםמןנסעףפץצקרשת0123456789.,:;!?-()"\'׳״–—…₪';
const ARABIC_PUNCT = '،؛؟.:!()«»–—…';
const DEVANAGARI = 'अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहािीुूृेैोौंःँ़्।॥०१२३४५६७८९.,:;!?-()–—…';
/** The consonants of Devanagari that take a half form before another consonant. The others keep their virama. */
const HALF = 'कखगघचजझञणतथधनपफबभमयलवशषस';

export const LANGUAGES: Language[] = [
  { code: 'en', script: 'latin', chars: QUOTES },
  { code: 'fr', script: 'latin', chars: `àâæçéèêëîïôœùûüÿÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ«»${QUOTES}` },
  { code: 'es', script: 'latin', chars: `áéíñóúüÁÉÍÑÓÚÜ¿¡«»${QUOTES}` },
  { code: 'pt', script: 'latin', chars: `àáâãçéêíóôõúÀÁÂÃÇÉÊÍÓÔÕÚ«»${QUOTES}` },
  { code: 'it', script: 'latin', chars: `àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ«»${QUOTES}` },
  { code: 'ca', script: 'latin', chars: `àçèéíïòóúüÀÇÈÉÍÏÒÓÚÜ·«»${QUOTES}` },
  { code: 'gl', script: 'latin', chars: `áéíñóúüÁÉÍÑÓÚÜ¿¡«»${QUOTES}` },
  { code: 'eu', script: 'latin', chars: `ñÑ«»${QUOTES}` },
  { code: 'de', script: 'latin', chars: `äöüßÄÖÜ„‚‘«»${QUOTES}` },
  { code: 'nl', script: 'latin', chars: `áéíóúëïöüÁÉÍÓÚËÏÖÜ${QUOTES}` },
  { code: 'af', script: 'latin', chars: `áéèêëíîïóôöúûüÁÉÈÊËÍÎÏÓÔÖÚÛÜ${QUOTES}` },
  { code: 'sv', script: 'latin', chars: `åäöÅÄÖ${QUOTES}` },
  { code: 'da', script: 'latin', chars: `æøåÆØÅ„«»${QUOTES}` },
  { code: 'nb', script: 'latin', chars: `æøåÆØÅ«»${QUOTES}` },
  { code: 'fi', script: 'latin', chars: `äöåÄÖÅ${QUOTES}` },
  { code: 'is', script: 'latin', chars: `áéíóúýðþæöÁÉÍÓÚÝÐÞÆÖ„${QUOTES}` },
  { code: 'fo', script: 'latin', chars: `áíóúýæøðÁÍÓÚÝÆØÐ„${QUOTES}` },
  { code: 'ga', script: 'latin', chars: `áéíóúÁÉÍÓÚ${QUOTES}` },
  { code: 'cy', script: 'latin', chars: `âêîôûŵŷáéíóúàèìòùäëïöüÂÊÎÔÛŴŶÁÉÍÓÚÀÈÌÒÙÄËÏÖÜ${QUOTES}` },
  { code: 'pl', script: 'latin', chars: `ąćęłńóśźżĄĆĘŁŃÓŚŹŻ„«»${QUOTES}` },
  { code: 'cs', script: 'latin', chars: `áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ„‚‘»«${QUOTES}` },
  { code: 'sk', script: 'latin', chars: `áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ„${QUOTES}` },
  { code: 'sl', script: 'latin', chars: `čšžČŠŽ„»«${QUOTES}` },
  { code: 'hr', script: 'latin', chars: `čćđšžČĆĐŠŽ„»«${QUOTES}` },
  { code: 'bs', script: 'latin', chars: `čćđšžČĆĐŠŽ„»«${QUOTES}` },
  { code: 'hu', script: 'latin', chars: `áéíóöőúüűÁÉÍÓÖŐÚÜŰ„»«${QUOTES}` },
  { code: 'ro', script: 'latin', chars: `ăâîșțĂÂÎȘȚ„«»${QUOTES}` },
  { code: 'sq', script: 'latin', chars: `çëÇË«»„${QUOTES}` },
  { code: 'et', script: 'latin', chars: `äöõüšžÄÖÕÜŠŽ„${QUOTES}` },
  { code: 'lv', script: 'latin', chars: `āčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ„«»${QUOTES}` },
  { code: 'lt', script: 'latin', chars: `ąčęėįšųūžĄČĘĖĮŠŲŪŽ„${QUOTES}` },
  { code: 'mt', script: 'latin', chars: `ċġħżàèìòùĊĠĦŻÀÈÌÒÙ${QUOTES}` },
  { code: 'tr', script: 'latin', chars: `çğıöşüâîûÇĞİÖŞÜÂÎÛ«»‘${QUOTES}` },
  { code: 'az', script: 'latin', chars: `çəğıöşüÇƏĞİÖŞÜ«»${QUOTES}` },
  { code: 'eo', script: 'latin', chars: `ĉĝĥĵŝŭĈĜĤĴŜŬ${QUOTES}` },
  { code: 'id', script: 'latin', chars: QUOTES },
  { code: 'ms', script: 'latin', chars: QUOTES },
  { code: 'sw', script: 'latin', chars: QUOTES },
  { code: 'tl', script: 'latin', chars: `ñÑ${QUOTES}` },
  { code: 'vi', script: 'latin', chars: `àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ${QUOTES}` },
  { code: 'el', script: 'greek', chars: 'αβγδεζηθικλμνξοπρσςτυφχψωάέήίόύώϊϋΐΰΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩΆΈΉΊΌΎΏΪΫ0123456789.,:;!«»’–—…·' },
  { code: 'ru', script: 'cyrillic', chars: RU + CYRILLIC_PUNCT },
  { code: 'uk', script: 'cyrillic', chars: `абвгґдеєжзиіїйклмнопрстуфхцчшщьюяАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ${CYRILLIC_PUNCT}` },
  { code: 'be', script: 'cyrillic', chars: `абвгдеёжзійклмнопрстуўфхцчшыьэюяАБВГДЕЁЖЗІЙКЛМНОПРСТУЎФХЦЧШЫЬЭЮЯ${CYRILLIC_PUNCT}` },
  { code: 'bg', script: 'cyrillic', chars: `абвгдежзийклмнопрстуфхцчшщъьюяАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ${CYRILLIC_PUNCT}` },
  { code: 'sr', script: 'cyrillic', chars: `абвгдђежзијклљмнњопрстћуфхцчџшАБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ${CYRILLIC_PUNCT}` },
  { code: 'mk', script: 'cyrillic', chars: `абвгдѓежзѕијклљмнњопрстќуфхцчџшАБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ${CYRILLIC_PUNCT}` },
  { code: 'kk', script: 'cyrillic', chars: `${RU}әғқңөұүһіӘҒҚҢӨҰҮҺІ${CYRILLIC_PUNCT}` },
  { code: 'hy', script: 'armenian', chars: `${span(0x531, 0x556)}${span(0x561, 0x587)}0123456789.,:-()։՝՞՛«»—…` },
  { code: 'ka', script: 'georgian', chars: `${span(0x10d0, 0x10f0)}0123456789.,:;!?-()„“–—…` },
  { code: 'he', script: 'hebrew', chars: HEBREW },
  { code: 'yi', script: 'hebrew', chars: `${HEBREW}װױײִַָּֿ` },
  { code: 'hi', script: 'devanagari', chars: DEVANAGARI },
  { code: 'mr', script: 'devanagari', chars: `${DEVANAGARI}ळ` },
  { code: 'ne', script: 'devanagari', chars: DEVANAGARI },
  { code: 'th', script: 'thai', chars: `${span(0xe01, 0xe3a)}${span(0xe3f, 0xe4e)}${span(0xe50, 0xe59)}0123456789.,:;!?-()"'–—…` },
  { code: 'lo', script: 'lao', chars: 'ກຂຄງຈຊຍດຕຖທນບປຜຝພຟມຢຣລວສຫອຮໜໝະັາຳິີຶືຸູົຼຽເແໂໃໄໆ່້໊໋໌ໍ໐໑໒໓໔໕໖໗໘໙0123456789.,:;!?-()–—…' },
  { code: 'ar', script: 'arabic', chars: `ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىي٠١٢٣٤٥٦٧٨٩${ARABIC_PUNCT}` },
  { code: 'fa', script: 'arabic', chars: `ءآأؤئابپةتثجچحخدذرزژسشصضطظعغفقکگلمنهوی۰۱۲۳۴۵۶۷۸۹${ARABIC_PUNCT}` },
  { code: 'ur', script: 'arabic', chars: `ءآأؤئابپتٹثجچحخدڈذرڑزژسشصضطظعغفقکگلمںنوہھیے۰۱۲۳۴۵۶۷۸۹۔${ARABIC_PUNCT}` },
];

/** Scripts the format cannot serve yet, and why. */
export const UNSUPPORTED_SCRIPTS =
  'Bengali, Tamil, Telugu and the other Indic scripts beyond Devanagari, Khmer, Myanmar, Tibetan, Sinhala: each reorders its own way (split vowels, other pre-base signs), not written yet. Chinese, Japanese, Korean: thousands of glyphs.';

/** Every character a language needs: basic Latin first for a Latin language, then its own. */
export function charsOf(language: Language): string[] {
  return [...new Set([...(language.script === 'latin' ? LATIN_BASE : ''), ...language.chars])];
}

/** The glyphs a language needs besides those of its characters: the joining forms and ligatures of Arabic. */
export function formsNeeded(language: Language): string[] {
  if (language.script === 'devanagari') {
    const halves = [...HALF, ...(language.code === 'mr' ? 'ळ' : '')].map((char) => `${glyphName(char)}.half`);
    return [...halves, 'uni0930.rphf', 'uni0930.blwf', 'uni0915_uni094D_uni0937', 'uni091C_uni094D_uni091E'];
  }
  if (language.script !== 'arabic') return [];
  const forms = charsOf(language).flatMap((char) => formsOf(char).map((form) => `${glyphName(char)}.${form}`));
  return [...forms, ...LAM_ALEF.flatMap((name) => [name, `${name}.fina`])];
}

export interface LanguageCoverage {
  code: string;
  has: number;
  of: number;
  /** Characters without a glyph. */
  missing: string[];
  /** Glyphs without a character that the language needs: Arabic forms and ligatures, by name. */
  forms: string[];
}

/** What a font covers of each language, the missing characters and forms named. */
export function languageCoverage(doc: FontDoc, codes?: string[]): LanguageCoverage[] {
  const drawn = new Set(doc.glyphs.flatMap((glyph) => (glyph.unicode === undefined ? [] : [glyph.unicode])));
  const names = new Set(doc.glyphs.map((glyph) => glyph.name));
  return LANGUAGES.filter((language) => codes === undefined || codes.includes(language.code)).map((language) => {
    const chars = charsOf(language);
    const needed = formsNeeded(language);
    const missing = chars.filter((char) => !drawn.has(char.codePointAt(0)!));
    const forms = needed.filter((name) => !names.has(name));
    return { code: language.code, has: chars.length + needed.length - missing.length - forms.length, of: chars.length + needed.length, missing, forms };
  });
}
