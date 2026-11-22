// The languages written in an Indic script: their characters, and the forms a font needs to set them (half forms,
// reph, forms below and after, conjuncts, a letter and its vowel drawn as one). Each form is a glyph name features
// are read from (see `features.ts`). A list of conjuncts is the common ones, not every one a language can write.
import { splitVowels } from './indic';
import { glyphName } from './names';

const PUNCT = '.,:;!?-()–—…';
const DANDA = '।॥';

export const DEVANAGARI = `अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहािीुूृेैोौंःँ़्${DANDA}०१२३४५६७८९${PUNCT}`;
const BENGALI_LETTERS = 'অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযলশষসহড়ঢ়য়ৎ';
const BENGALI_SIGNS = `ািীুূৃেৈোৌংঃঁ়্ৗ০১২৩৪৫৬৭৮৯${DANDA}${PUNCT}`;
const GURMUKHI = `ੳਅੲਆਇਈਉਊਏਐਓਔਸਹਕਖਗਘਙਚਛਜਝਞਟਠਡਢਣਤਥਦਧਨਪਫਬਭਮਯਰਲਵੜਸ਼ਖ਼ਗ਼ਜ਼ਫ਼ਲ਼ਾਿੀੁੂੇੈੋੌਂੰੱ਼੍੦੧੨੩੪੫੬੭੮੯${DANDA}${PUNCT}`;
const GUJARATI = `અઆઇઈઉઊઋએઐઓઔઍઑકખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળાિીુૂૃેૈોૌૅૉંઃઁ઼્૦૧૨૩૪૫૬૭૮૯${PUNCT}`;
const ODIA = `ଅଆଇଈଉଊଋଏଐଓଔକଖଗଘଙଚଛଜଝଞଟଠଡଢଣତଥଦଧନପଫବଭମଯରଲଳଶଷସହୟୱଡ଼ଢ଼ାିୀୁୂୃେୈୋୌଂଃଁ଼୍ୖୗ୦୧୨୩୪୫୬୭୮୯${DANDA}${PUNCT}`;
const MALAYALAM = `അആഇഈഉഊഋഎഏഐഒഓഔകഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹളഴറൺൻർൽൾൿാിീുൂൃെേൈൊോൌ്ംഃൗൎ0123456789${PUNCT}`;
const TELUGU_CONSONANTS = 'కఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరఱలళవశషసహ';
const KANNADA_CONSONANTS = 'ಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲಳವಶಷಸಹ';
const TELUGU = `అఆఇఈఉఊఋఎఏఐఒఓఔ${TELUGU_CONSONANTS}ాిీుూృెేైొోౌంఃఁ్ౕౖ0123456789${PUNCT}`;
const KANNADA = `ಅಆಇಈಉಊಋಎಏಐಒಓಔ${KANNADA_CONSONANTS}ಾಿೀುೂೃೆೇೈೊೋೌಂಃ್ೕೖ0123456789${PUNCT}`;
const SINHALA_CONSONANTS = 'කඛගඝඞඟචඡජඣඤඥඦටඨඩඪණඬතථදධනඳපඵබභමඹයරලවශෂසහළෆ';
const SINHALA = `අආඇඈඉඊඋඌඍඑඒඓඔඕඖ${SINHALA_CONSONANTS}ාැෑිීුූෘෙේෛොෝෞෟ්ංඃ0123456789${PUNCT}`;
const KHMER_CONSONANTS = 'កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយរលវឝឞសហឡអ';
const KHMER = `${KHMER_CONSONANTS}ឥឦឧឩឪឫឬឭឮឯឰឱឲឳាិីឹឺុូួើឿៀេែៃោៅំះៈ៉៊់៌៍៎៏័្។៕៖ៗ០១២៣៤៥៦៧៨៩${PUNCT}`;
const MYANMAR_CONSONANTS = 'ကခဂဃငစဆဇဈဉညဋဌဍဎဏတထဒဓနပဖဗဘမယရလဝသဟဠအ';
const MYANMAR = `${MYANMAR_CONSONANTS}ဣဤဥဦဧဩဪဿါာိီုူေဲံ့း်ျြွှ္၀၁၂၃၄၅၆၇၈၉၊။၌၍၎၏${PUNCT}`;
const TAMIL = `அஆஇஈஉஊஎஏஐஒஓஔஃகஙசஞடணதநபமயரலவழளறனஜஷஸஹாிீுூெேைொோௌ்ௗ0123456789${PUNCT}`;

export const INDIC_CHARS: Record<string, string> = {
  hi: DEVANAGARI,
  mr: `${DEVANAGARI}ळ`,
  ne: DEVANAGARI,
  bn: `${BENGALI_LETTERS}র${BENGALI_SIGNS}`,
  as: `${BENGALI_LETTERS}ৰৱ${BENGALI_SIGNS}`,
  pa: GURMUKHI,
  gu: GUJARATI,
  ta: TAMIL,
  or: ODIA,
  ml: MALAYALAM,
  te: TELUGU,
  kn: KANNADA,
  si: SINHALA,
  km: KHMER,
  my: MYANMAR,
};

/** The consonants that take a half form before another consonant (Devanagari, Gujarati). The others keep their virama. */
const HALF: Record<string, string> = { deva: 'कखगघचजझञणतथधनपफबभमयलवशषस', gujr: 'કખગઘચજઝઞણતથધનપફબભમયલવશષસળ' };
const TAMIL_CONSONANTS = 'கஙசஞடணதநபமயரலவழளறன';

/** A glyph name of letters typed in a row: a conjunct (क्ष is uni0915_uni094D_uni0937) or a letter and its vowel. */
const joined = (text: string): string => [...text].map(glyphName).join('_');
const forms = (chars: string, suffix: string): string[] => [...chars].map((char) => `${glyphName(char)}.${suffix}`);

/**
 * The vowel signs a Telugu, Kannada or Sinhala consonant is drawn again with, as one glyph (కి, ಕಿ, කු, ක්), and the
 * Tibetan ra drawn short over the letters written under it (རྐ): the font's consonant
 * loses its head stroke and takes the sign. Kannada ೀ ೇ ೈ ೋ are these and a length mark the engine adds after.
 */
const SYLLABLE_VOWELS: Record<string, [string, string]> = { te: [TELUGU_CONSONANTS, 'ాిీుూెేైొోౌ'], kn: [KANNADA_CONSONANTS, 'ಾಿುೃೆೊೌ'], si: [SINHALA_CONSONANTS, '්ුූ'], bo: ['ར', 'ྐྒྔྗྙྟྡྣྦྨྩྫ'] };

export interface Syllable {
  /** The glyph's name: the consonant and the parts of its vowel sign, as the engine splits it (uni0C15_uni0C46_uni0C56). */
  name: string;
  consonant: string;
  signs: string[];
}

/** Every consonant with every vowel sign it is drawn again with, for a language that has them (te, kn). */
export function syllablesOf(code: string): Syllable[] {
  const found = SYLLABLE_VOWELS[code];
  if (!found) return [];
  return [...found[0]].flatMap((c) => [...found[1]].map((v) => {
    const signs = [...splitVowels(v)].map(glyphName);
    return { name: [glyphName(c), ...signs].join('_'), consonant: glyphName(c), signs };
  }));
}

/** The forms each Indic language needs, by language code. */
export function indicForms(code: string): string[] {
  if (code === 'hi' || code === 'ne' || code === 'mr') {
    return [...forms(`${HALF.deva}${code === 'mr' ? 'ळ' : ''}`, 'half'), 'uni0930.rphf', 'uni0930.blwf', joined('क्ष'), joined('ज्ञ')];
  }
  if (code === 'bn' || code === 'as') {
    const ra = code === 'as' ? 'ৰ' : 'র';
    const conjuncts = ['ক্ষ', 'জ্ঞ', 'ক্ত', 'ঙ্গ', 'ত্ত', 'ন্ত', 'ন্দ', 'স্ত', 'ষ্ট', 'ম্প'];
    return [...forms(ra, 'rphf'), ...forms(ra, 'blwf'), ...forms('য', 'pstf'), ...conjuncts.map(joined), joined(`${ra}ু`), joined(`${ra}ূ`)];
  }
  if (code === 'pa') return forms('ਰਹਵ', 'blwf');
  if (code === 'gu') return [...forms(HALF.gujr!, 'half'), 'uni0AB0.rphf', 'uni0AB0.blwf', joined('ક્ષ'), joined('જ્ઞ'), joined('રુ'), joined('રૂ')];
  if (code === 'or') {
    const conjuncts = ['କ୍ଷ', 'ଜ୍ଞ', 'ଙ୍କ', 'ନ୍ତ', 'ନ୍ଦ', 'ଣ୍ଡ', 'ତ୍ତ', 'ଷ୍ଟ', 'ସ୍ତ', 'ମ୍ପ'];
    return ['uni0B30.rphf', 'uni0B30.blwf', 'uni0B2F.pstf', ...conjuncts.map(joined)];
  }
  if (code === 'ml') {
    const doubled = [...'കങചഞടണതനപമയലവള'].map((c) => joined(`${c}്${c}`));
    const conjuncts = ['ന്ത', 'ങ്ക', 'ഞ്ച', 'ണ്ട', 'മ്പ', 'ക്ഷ', 'ന്ദ', 'സ്ത'];
    return ['uni0D30.pref', 'uni0D2F.pstf', 'uni0D35.pstf', ...doubled, ...conjuncts.map(joined)];
  }
  if (code === 'si' || code === 'bo') return syllablesOf(code).map((s) => s.name);
  // Khmer: every consonant written under another (coeng), and ro written before it.
  if (code === 'km') return [...forms(KHMER_CONSONANTS, 'blwf'), 'uni179A.pref'];
  // Myanmar: every consonant stacked under another, and the kinzi.
  if (code === 'my') return [...forms(MYANMAR_CONSONANTS, 'blwf'), 'uni1004.rphf'];
  if (code === 'te' || code === 'kn') {
    const [consonants] = SYLLABLE_VOWELS[code]!;
    const conjuncts = code === 'te' ? ['క్ష', 'జ్ఞ'] : ['ಕ್ಷ', 'ಜ್ಞ'];
    return [...forms(consonants, 'blwf'), ...(code === 'kn' ? ['uni0CB0.rphf'] : []), ...conjuncts.map(joined), ...syllablesOf(code).map((s) => s.name)];
  }
  if (code === 'ta') {
    const vowels = [...TAMIL_CONSONANTS].flatMap((c) => [joined(`${c}ு`), joined(`${c}ூ`)]);
    return [...vowels, joined('டி'), joined('டீ'), joined('க்ஷ'), joined('ஸ்ரீ')];
  }
  return [];
}
