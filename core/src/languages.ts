import { formsOf, LAM_ALEF } from './arabic';
import { HANS_PUNCTUATION, HANT_PUNCTUATION, HANZI_1, HANZI_TRADITIONAL } from './chinese';
import { JAPANESE_PUNCTUATION, JOYO, KANA } from './japanese';
import { INDIC_CHARS, indicForms } from './indicLanguages';
import { HANGUL_KSX, JAMO } from './korean';
import { glyphName } from './names';
import type { FontDoc } from './types';

export type Script =
  | 'latin' | 'greek' | 'cyrillic' | 'armenian' | 'georgian' | 'hebrew' | 'arabic' | 'devanagari' | 'bengali' | 'gurmukhi' | 'gujarati' | 'odia' | 'tamil' | 'malayalam'
  | 'thai' | 'lao' | 'japanese' | 'chinese' | 'korean';

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

export const LANGUAGES: Language[] = [
  { code: 'en', script: 'latin', chars: QUOTES },
  { code: 'fr', script: 'latin', chars: 'àâæçéèêëîïôœùûüÿÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ«»’–—…' },
  { code: 'es', script: 'latin', chars: 'áéíñóúüÁÉÍÑÓÚÜ¿¡«»’“”–—…' },
  { code: 'pt', script: 'latin', chars: 'àáâãçéêíóôõúÀÁÂÃÇÉÊÍÓÔÕÚ«»’“”–—…' },
  { code: 'it', script: 'latin', chars: 'àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ«»’“”–—…' },
  { code: 'ca', script: 'latin', chars: `àçèéíïòóúüÀÇÈÉÍÏÒÓÚÜ·«»${QUOTES}` },
  { code: 'gl', script: 'latin', chars: `áéíñóúüÁÉÍÑÓÚÜ¿¡«»${QUOTES}` },
  { code: 'eu', script: 'latin', chars: `ñÑ«»${QUOTES}` },
  { code: 'de', script: 'latin', chars: 'äöüßÄÖÜ„“”‚‘’«»–—…' },
  { code: 'nl', script: 'latin', chars: 'áéíóúëïöüÁÉÍÓÚËÏÖÜ’“”–—…' },
  { code: 'af', script: 'latin', chars: `áéèêëíîïóôöúûüÁÉÈÊËÍÎÏÓÔÖÚÛÜ${QUOTES}` },
  { code: 'sv', script: 'latin', chars: 'åäöÅÄÖ”’–—…' },
  { code: 'da', script: 'latin', chars: 'æøåÆØÅ„“«»’–—…' },
  { code: 'nb', script: 'latin', chars: 'æøåÆØÅ«»’“”–—…' },
  { code: 'fi', script: 'latin', chars: 'äöåÄÖÅ”’–—…' },
  { code: 'is', script: 'latin', chars: `áéíóúýðþæöÁÉÍÓÚÝÐÞÆÖ„${QUOTES}` },
  { code: 'fo', script: 'latin', chars: `áíóúýæøðÁÍÓÚÝÆØÐ„${QUOTES}` },
  { code: 'ga', script: 'latin', chars: `áéíóúÁÉÍÓÚ${QUOTES}` },
  { code: 'cy', script: 'latin', chars: `âêîôûŵŷáéíóúàèìòùäëïöüÂÊÎÔÛŴŶÁÉÍÓÚÀÈÌÒÙÄËÏÖÜ${QUOTES}` },
  { code: 'pl', script: 'latin', chars: 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ„”«»’–—…' },
  { code: 'cs', script: 'latin', chars: 'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ„“‚‘»«–—…' },
  { code: 'sk', script: 'latin', chars: 'áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ„“–—…' },
  { code: 'sl', script: 'latin', chars: `čšžČŠŽ„»«${QUOTES}` },
  { code: 'hr', script: 'latin', chars: 'čćđšžČĆĐŠŽ„”»«–—…' },
  { code: 'bs', script: 'latin', chars: `čćđšžČĆĐŠŽ„»«${QUOTES}` },
  { code: 'hu', script: 'latin', chars: 'áéíóöőúüűÁÉÍÓÖŐÚÜŰ„”»«–—…' },
  { code: 'ro', script: 'latin', chars: 'ăâîșțĂÂÎȘȚ„”«»–—…' },
  { code: 'sq', script: 'latin', chars: `çëÇË«»„${QUOTES}` },
  { code: 'et', script: 'latin', chars: `äöõüšžÄÖÕÜŠŽ„${QUOTES}` },
  { code: 'lv', script: 'latin', chars: `āčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ„«»${QUOTES}` },
  { code: 'lt', script: 'latin', chars: `ąčęėįšųūžĄČĘĖĮŠŲŪŽ„${QUOTES}` },
  { code: 'mt', script: 'latin', chars: `ċġħżàèìòùĊĠĦŻÀÈÌÒÙ${QUOTES}` },
  { code: 'tr', script: 'latin', chars: 'çğıöşüâîûÇĞİÖŞÜÂÎÛ“”‘’«»–—…' },
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
  // Biblical Hebrew: the points (niqqud), the accents of cantillation (te'amim), maqaf, paseq and sof pasuq.
  { code: 'hbo', script: 'hebrew', chars: `${HEBREW}${span(0x591, 0x5af)}${span(0x5b0, 0x5bc)}־ֿ׀ׁׂ׃ׇ` },
  { code: 'hi', script: 'devanagari', chars: INDIC_CHARS.hi! },
  { code: 'mr', script: 'devanagari', chars: INDIC_CHARS.mr! },
  { code: 'ne', script: 'devanagari', chars: INDIC_CHARS.ne! },
  { code: 'bn', script: 'bengali', chars: INDIC_CHARS.bn! },
  { code: 'as', script: 'bengali', chars: INDIC_CHARS.as! },
  { code: 'pa', script: 'gurmukhi', chars: INDIC_CHARS.pa! },
  { code: 'gu', script: 'gujarati', chars: INDIC_CHARS.gu! },
  { code: 'or', script: 'odia', chars: INDIC_CHARS.or! },
  { code: 'ta', script: 'tamil', chars: INDIC_CHARS.ta! },
  { code: 'ml', script: 'malayalam', chars: INDIC_CHARS.ml! },
  { code: 'th', script: 'thai', chars: `${span(0xe01, 0xe3a)}${span(0xe3f, 0xe4e)}${span(0xe50, 0xe59)}0123456789.,:;!?-()"'–—…` },
  { code: 'lo', script: 'lao', chars: 'ກຂຄງຈຊຍດຕຖທນບປຜຝພຟມຢຣລວສຫອຮໜໝະັາຳິີຶືຸູົຼຽເແໂໃໄໆ່້໊໋໌ໍ໐໑໒໓໔໕໖໗໘໙0123456789.,:;!?-()–—…' },
  // Japanese: the kana, the punctuation and the 2,136 kanji for general use. draw_kanji draws the kanji from KanjiVG.
  { code: 'ja', script: 'japanese', chars: `${KANA}${JAPANESE_PUNCTUATION}${JOYO}` },
  // Chinese: the 3,500 characters in common use (level 1 of the 2013 table), simplified or in their traditional forms,
  // and the digits. draw_kanji draws them from Make Me a Hanzi.
  { code: 'zh-Hans', script: 'chinese', chars: `${HANS_PUNCTUATION}0123456789${HANZI_1}` },
  { code: 'zh-Hant', script: 'chinese', chars: `${HANT_PUNCTUATION}0123456789${HANZI_TRADITIONAL}` },
  // Korean: the 2,350 syllables of KS X 1001 and the letters; draw_kanji composes them. Punctuation is the Latin one.
  { code: 'ko', script: 'korean', chars: `${HANGUL_KSX}${JAMO}0123456789.,:;!?'"-()~·“”‘’…` },
  { code: 'ar', script: 'arabic', chars: `ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىي٠١٢٣٤٥٦٧٨٩${ARABIC_PUNCT}` },
  { code: 'fa', script: 'arabic', chars: `ءآأؤئابپةتثجچحخدذرزژسشصضطظعغفقکگلمنهوی۰۱۲۳۴۵۶۷۸۹${ARABIC_PUNCT}` },
  { code: 'ur', script: 'arabic', chars: `ءآأؤئابپتٹثجچحخدڈذرڑزژسشصضطظعغفقکگلمںنوہھیے۰۱۲۳۴۵۶۷۸۹۔${ARABIC_PUNCT}` },
];

/** Scripts the format cannot serve yet, and why. */
export const UNSUPPORTED_SCRIPTS =
  'Telugu and Kannada (each consonant drawn again with each vowel sign: hundreds of glyphs, not counted yet), Sinhala, Khmer, Myanmar, Tibetan: each shapes its own way, not written yet.';

/** Every character a language needs: basic Latin first for a Latin language, then its own. */
export function charsOf(language: Language): string[] {
  return [...new Set([...(language.script === 'latin' ? LATIN_BASE : ''), ...language.chars])];
}

/** The glyphs a language needs besides those of its characters: Arabic joining forms and lam-alef, Indic forms. */
export function formsNeeded(language: Language): string[] {
  const indic = indicForms(language.code);
  if (indic.length > 0) return indic;
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
