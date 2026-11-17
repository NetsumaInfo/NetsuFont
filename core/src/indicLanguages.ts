// The languages written in an Indic script: their characters, and the forms a font needs to set them (half forms,
// reph, forms below and after, conjuncts, a letter and its vowel drawn as one). Each form is a glyph name features
// are read from (see `features.ts`). A list of conjuncts is the common ones, not every one a language can write.
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
};

/** The consonants that take a half form before another consonant (Devanagari, Gujarati). The others keep their virama. */
const HALF: Record<string, string> = { deva: 'कखगघचजझञणतथधनपफबभमयलवशषस', gujr: 'કખગઘચજઝઞણતથધનપફબભમયલવશષસળ' };
const TAMIL_CONSONANTS = 'கஙசஞடணதநபமயரலவழளறன';

/** A glyph name of letters typed in a row: a conjunct (क्ष is uni0915_uni094D_uni0937) or a letter and its vowel. */
const joined = (text: string): string => [...text].map(glyphName).join('_');
const forms = (chars: string, suffix: string): string[] => [...chars].map((char) => `${glyphName(char)}.${suffix}`);

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
  if (code === 'ta') {
    const vowels = [...TAMIL_CONSONANTS].flatMap((c) => [joined(`${c}ு`), joined(`${c}ூ`)]);
    return [...vowels, joined('டி'), joined('டீ'), joined('க்ஷ'), joined('ஸ்ரீ')];
  }
  return [];
}
