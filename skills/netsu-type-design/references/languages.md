# Languages

`languages` names, per language, what `compose` can make and what has to be drawn. This page
is how to draw what it asks for. Numbers for an em of 1000 and the sheet of `construction.md`.

## 1. Marks

Draw each once, without unicode, anywhere: `compose` centres it on the base, and the checks
leave marks alone. `compose` of Greek accented letters (ά έ) needs `acute` drawn first.

| Mark | Where (lowercase) | Shape |
|---|---|---|
| acute, grave | y 560–700 | a stroke 0.8 × stem wide, 30–40° from vertical; grave the mirror |
| circumflex, caron | y 560–690 | two strokes of 0.75 × stem meeting in a point; caron upside down |
| dieresis, dotaccent | y 570–660 | dots as wide as the dot of i, 1.5 stems apart (dieresis) |
| tilde | y 570–670 | an S on its side: two arcs |
| macron | y 600–660 | a bar as wide as the o's counter |
| breve | y 560–680 | the bottom half of a ring |
| ring | y 560–740 | a small ring, stroke 0.6 × stem |
| hungarumlaut | y 560–700 | two acutes, steeper, close |
| hookabove | y 560–720 | a small question mark without its dot (Vietnamese) |
| horn | y 380–560, right of the base | a short hook (Vietnamese ơ ư) |
| cedilla | y −200–0 | a small hook that starts at the bottom of c, s, t |
| ogonek | y −200–0 | a hook curling left, 1.6 stems wide; `compose` sets its right edge on the base's (Polish ą ę, Lithuanian į) |
| commaaccent | y −220–−60 | a small comma (Romanian ș ț, Latvian ķ ļ ņ) |
| dotbelow | y −160–−60 | the dot of i (Vietnamese ạ ẹ) |

- Capitals: draw `acute.case`, `grave.case`… flatter and lower, placed above the cap height
  (y 740–850). Without them `compose` raises the lowercase marks by capHeight − xHeight. Both
  may pass the ascender: the file's line height follows its tallest glyph.
- `dotlessi` (ı) is i without its dot: `copy_glyph` i, then redraw without the ellipse. j's
  accents sit on `uni0237`, j without its dot, drawn the same way.
- After `compose`, `proof` the accented letters: a mark that touches its base or a mark of the
  line above is fixed in the mark, never in each letter.

## 2. Latin languages: what is particular

| Language | Draw or check |
|---|---|
| fr | œ Œ æ Æ (two letters joined, sharing a stem), « » with a thin space inside, ’ |
| de | ß (a long s joined to a z or an s), „ “ ‚ ‘ quotes, the capital ẞ is optional |
| es | ¿ ¡ (? ! turned, hanging below the baseline), ñ: the tilde a little wider |
| pt, it, nl | nothing beyond marks; nl: the pair ij is spaced as one letter |
| nordic | å Å (ring touching or close above A), ø Ø (a stroke through o, 20° from vertical), æ |
| pl | the acute (kreska) steeper and shorter; ł Ł (a stroke across the stem, 20° up); ogonek on the foot of a e |
| cs, sk | ď ť ľ Ľ: the caron becomes a small apostrophe to the right of the ascender: draw `caron.alt`, then fix those four with `set_glyph` components |
| hu | ő ű: hungarumlaut, never a dieresis |
| ro | ș ț with commaaccent, never cedilla |
| hr | đ Đ (a bar across the ascender, or the D's stem) |
| tr, az | ı (dotless i), İ (I with dotaccent), ğ (breve), ş ç (cedilla); az: ə Ə (an e turned) |
| lv | ķ ļ ņ Ķ Ļ Ņ Ģ with commaaccent; ģ with `commaturnedabove` (a small comma above, turned); macrons ā ē ī ū |
| lt, et | ė į ų (dotaccent, ogonek on i and u); et: õ (tilde) |
| is, fo | ð Ð (d with a bar across the ascender; Ð = Đ), þ Þ (a stem through a bowl, ascender to descender) |
| mt, cy, eo | ħ Ħ (bar across the ascender); ŵ ŷ (circumflex); ĉ ĝ ĥ ĵ ŝ ŭ |
| vi | two marks stacked (ấ ầ ẩ ẫ ậ): `compose` stacks them; check the circumflex + acute pair, often set side by side instead. ơ ư with horn |

## 3. Other scripts

Build the letters that are not Latin from the parts you already have:

| Letter | From |
|---|---|
| б в ь ъ ы | the b bowl at x-height (в: two bowls, ε-style), with a flat top stroke for б |
| г п т л д | small capitals at the x-height: Γ Π Τ shrunk; л and д take a leg bent to the left; д ц щ a short descender (−120) under the right foot |
| и й я | N and R turned: `copy_glyph` then `transform {scale:[-1,1]}` and `set_spacing` again |
| ж ф ш щ ю | wide: ж = к and its mirror sharing the stem; ф = o around a stem from descender to ascender; ш = three stems and a base; ю = stem, bar, o |
| з э є | the s method (one band shared by two arcs); э = c turned, with a bar |
| Γ Δ Λ Π Σ Ω Ξ | Γ = F without the middle arm; Δ Λ = A without and with its bar; Π = H with a top bar; Σ = a zigzag E; Ω = O open at the bottom on two short feet |
| α β γ δ ζ η θ λ ξ π σ ς φ χ ψ ω | α = o + a tail to the right; η = n with a long right stem going down; θ = O with a bar; π = Π small; σ = o + a top stroke to the right; ω = two u; ζ ξ ς: a hook under the baseline, the s method for their curves |

- **Greek (el)**: `compose` makes the letters shaped like Latin ones (Α Β Ε Ζ Η Ι Κ Μ Ν Ο Ρ Τ Υ Χ ο).
  Draw α β γ δ ε ζ η θ ι κ λ μ ν ξ π ρ σ ς τ υ φ χ ψ ω and Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω. Lowercase Greek is
  rounder than Latin: α as an o with a tail, ε as a 3 turned, ι without a dot, ς final sigma with a
  descender. The tonos of ά έ is an acute, steeper.
- **Cyrillic (ru, uk)**: `compose` makes а е о р с у х і ј ѕ and А В Е К М Н О Р С Т Х. Draw the
  rest. Lowercase в г к л м н п т are small capitals at the x-height, not Latin shapes; д ц щ have a
  short descender at the bottom; и й are N turned; ж ф ш щ ы ю are wide (m width or more); я is R
  turned. ё = е + dieresis, й = и + breve (composed). Ukrainian ґ (г with an up-turn), є, ї.
  Belarusian ў (у + breve). Serbian and Macedonian ђ ћ џ љ њ ѓ ќ: ђ ћ = h with a bar, џ = ц with
  the descender in the middle, љ њ = л н + ь. Kazakh ә ғ қ ң ө ұ ү һ (һ and ә made from h and ə).
- **Armenian (hy)**: 38 letters with case; lowercase on the x-height, many with ascenders or
  descenders (բ գ դ ե զ է ը թ ժ ի լ...); uppercase on the cap height. Strokes rounded, few
  diagonals. ։ is the full stop (two dots, as a colon), ՝ ՞ ՛ sit above the line.
- **Georgian (ka)**: 33 letters, no case. Round bodies on the x-height; many letters have an
  ascender (ბ ზ თ ი...) or a descender (გ დ ე ვ...), rarely both. Draw the x-height body once and
  build each letter from it: one circle language, like o.
- **Biblical Hebrew (hbo)**: the points, and the accents of cantillation (te'amim, U+0591 to
  U+05AF) as marks of advance 0, small and lighter than the letters. Draw each where it
  sits over or under a letter; the font puts it on every letter. Pashta ֙, zarqa ֮ and telisha qetana
  ֩ go past the left edge of the letter, telisha gedola ֠ past its right edge, yetiv ֚ and dehi ֭
  below and right. Maqaf ־ is a high hyphen, paseq ׀ a thin upright, sof pasuq ׃ a colon: all three
  spacing glyphs. Proof with Genesis 1:1 below.
- **Yiddish (yi)**: Hebrew letters, ײ װ ױ (two letters joined, drawn as one), and points as marks
  with advance 0: patah ַ  kamatz ָ  hiriq ִ  under the letter, dagesh ּ  in it, rafe ֿ  over it.
  Draw the shin dot ׁ over the right arm of ש, where it goes: it stays where drawn.
- **Thai (th), Lao (lo)**: no case; letters on the baseline at about the x-height, with a small
  loop at the start of most strokes. Vowel signs and tones above or below are marks of advance 0
  (ิ ี ึ ื ั ็ ่ ้ ๊ ๋ ์, ุ ู ฺ): the font sets each on its letter, a tone on top of a vowel sign
  above. Vowels before or after the letter (เ แ โ ใ ไ ะ า ำ) are spacing glyphs.
- **Hebrew (he)**: right to left, no case. Letters sit on the baseline and rise to a height
  between the x-height and the cap height (about 560); horizontal strokes thicker than vertical
  ones (the reverse of Latin). Final forms ך ן ף ץ go down to the descender. `proof` and the app
  set it right to left.
- **Devanagari (hi, mr, ne)**: trace a model (step 7; Windows has Nirmala UI, a .ttc: `index`
  0; else Noto Sans Devanagari, OFL). Measured in Nirmala UI, scaled to an em of 1000 with Latin
  caps at 700 (2026-11-06): the headline's top at 728, its ink 17 past both edges so words join
  (side bearings −17 and −17: `set_spacing` with 0 leaves gaps);
  bodies from 0 to the headline, as wide as their shape asks (र 489, न 607, ग 624, म 673, क 863);
  ा 260; े above from 714 to 1035; ु below from −250; ascender 1079, descender −251. Set the
  ascender and descender so before drawing: the marks pass the usual 800 and −200, and the checks
  say lines collide. A headline at 600 beside Latin caps of 700 looked too small. A stem at the
  right ends about 90 inside the advance, the headline running past it (measured on the model in a
  blind run). A model keeps its own em: `list_fonts` gives its advances in its units (Nirmala UI:
  2048), while `look_glyphs` scales it to your cap height. Families, in
  this order: the consonants with a full stem at their right (ग घ च ज ञ ण त थ ध न प ब भ म य ल व
  श ष स, then क ख फ), those without (ङ छ ट ठ ड ढ द ह र), the vowels अ आ इ ई उ ऊ ऋ ए ऐ ओ औ, the
  spacing signs ा ि ी ो ौ (ि with its headline: the text engine draws it before its consonant),
  the marks े ै ं ँ above and ु ू ृ ् ़ below (advance 0), the digits ०–९ (their own shapes, from
  the model, not the Latin figures).
  Then the forms: `<consonant>.half` (for a consonant with its stem at the right, the letter
  without its stem, narrower; क ख फ keep their stem and lose their right part: trace each), `uni0930.rphf` (a hook above, advance 0, ink left of x 0), `uni0930.blwf` (a short
  stroke under the stem, advance 0), the conjuncts क्ष `uni0915_uni094D_uni0937` and ज्ञ
  `uni091C_uni094D_uni091E` (त्र श्र are welcome, named the same way). The model keeps its half
  forms, reph and conjuncts under these names: trace them with `look_glyphs {glyphs:
  ["uni0915_uni094D_uni0937", "uni0915.half"], model}`. Conjuncts look nothing like their parts. A conjunct made of components (`.half` and the full
  letter) passes `languages`; a drawn shape, as in the model, reads better. `languages` names
  the rest.
- **Bengali and Assamese (bn, as), Gurmukhi (pa), Gujarati (gu), Tamil (ta)**: trace a model as
  for Devanagari; Nirmala UI (index 0) draws all four. Measured in it, scaled to Latin caps at 700
  (2026-11-16): Bengali and Gurmukhi hang from a headline whose top is at 728, its ink 17 past
  both edges, as Devanagari. Bengali: headline 656 to 728, stems about 70 wide; letters wide (ক
  878, ন 689, র ব 608, ম 726, ল 721, া 251 advance); ং is a spacing sign (advance 466, a ring
  and tail from −59 to 645, under the headline), as ঃ; the reph sits on the headline, from 728 to
  1080 and x −487 to −129 (set the ascender to 1080 first); the ya-phala is a spacing glyph with
  its headline (advance 329). A blind run (Nodi, 2026-11-17) drew letters 560 wide, then had to
  rescale them; it made ং a mark, and its conjuncts were two letters squeezed side by side: they
  pass `languages` and read as nothing. The model keeps the conjuncts, রু রূ, the reph and the
  phalas by these names (Nirmala UI has them all since 2026-11-17): trace each with
  `look_glyphs {glyphs, model}`, and spend the budget on two passes per family. A second run
  (Padma, about 90 calls, every letter traced) read as text at large sizes; ঙ ঞ শ ম ল stayed weak
  and its conjuncts were still squeezed letters, drawn before the model had them. Gujarati has
  no headline, its bodies from 0 to about 712 and their side bearings open (ક ink 47 to 529 on 585); Tamil has none either, its bodies from
  0 to 584 (Latin x-height 512), some with a tail to −209 (ந ர), and wide: க 885, ட 851, ம 959,
  ர 708, ன 1255, ண 1687, ா 709, ெ 889, ை 1221 (advances). In the model ி is spacing (advance
  261, its loop reaching back to −248 over the letter) and ீ ு ூ ் are marks of advance 0. A
  consonant with ு or ூ is one wider glyph with its own foot (கு 1058, மு 1248, down to −209): the
  model draws all 36, trace each; a consonant with one generic foot added reads poorly (Tamarai,
  blind run of 2026-11-17). Vowel signs drawn before their
  consonant are spacing glyphs: ি ে ৈ, ਿ, િ, ெ ே ை. Signs in two parts (ো ৌ ொ ோ ௌ): draw their
  parts (ে া ৗ, ெ ே ா ௗ) and `compose` makes the whole. Forms, as `languages` names them:
  Bengali the reph `uni09B0.rphf` (Assamese `uni09F0.rphf`), ra-phala `uni09B0.blwf`, ya-phala
  `uni09AF.pstf` (a spacing hook after the letter), ten common conjuncts and রু রূ; Gurmukhi
  ra, ha and va below (`uni0A30.blwf`, `uni0A39.blwf`, `uni0A35.blwf`); Gujarati as Devanagari
  (half forms, reph, ra below, ક્ષ જ્ઞ) and રુ રૂ; Tamil each consonant with ு and ூ drawn as one
  (கு `uni0B95_uni0BC1`, 36 glyphs, their shapes differ: trace each), டி டீ, க்ஷ, ஸ்ரீ. The
  Tamil pulli ் sits above the letter. Only Bengali has been drawn blind (once); the others not yet.
- **Odia (or), Malayalam (ml)**: trace Nirmala UI too (2026-11-17, measured). Odia was drawn
  blind once (Mahanadi, 2026-11-22, about 50 calls, by hand with `stroke`): it read as Odia text;
  ଝ ଞ ହ ୟ ଯ ଙ ଘ ଗ and the vowels ଇ ଈ ଉ ଊ were weak, and its conjuncts, scaled copies stacked
  with components, did not look like Odia ones: draw each as one shape. Odia: round tops at 728, no headline, letters about 683 wide with side bearings of 39;
  ି is a mark above (772 to 909), the reph sits from 728 to 1015 and left of x 0. Malayalam:
  bodies to 712 and wide (ക 1179, ന 1016, ര 824, ാ 565); ു is spacing (advance 375, down to
  −251); ് and the dot reph ൎ are marks above (767 to 1019); the ra before its consonant
  `uni0D30.pref` is a narrow spacing glyph (advance 287), the ya-phala `uni0D2F.pstf` advance
  532. The model has most conjuncts by name; in Odia it lacks eight of the ten `languages`
  counts and in Malayalam three, ണ്ണ ല്ല സ്ത (it builds them another way), and the va-phala
  `uni0D35.pstf`: draw those as the shapes they are, not two letters side by side.
- **Telugu (te), Kannada (kn)**: trace Nirmala UI (2026-11-17, measured, not drawn here yet).
  Telugu bodies from 0 to about 600, the head stroke (talakattu) up to 853; క 583, మ 1178, ర 733
  wide; the signs ి ె ా are marks above, ink left of x 0 (ి 541 to 881); ు is spacing (487). Kannada
  bodies to about 600, the head up to 798; ಕ 723, ಮ 1289; ಾ spacing (618), ಿ ೆ marks above. Each
  consonant's form below (`.blwf`, the vattu or ottu) hangs to about −225. Draw each consonant,
  then its `.base` without the head stroke, then the signs; `compose {syllables}` makes the
  hundreds of syllables (కి is base and sign side by side); look at a family in `proof` and redraw
  by hand the few that do not join (the model draws each one: `look_glyphs {glyphs, model}`).
  The Kannada reph `uni0CB0.rphf` comes after the syllable. Telugu writes no reph: ర్క is ra
  with ka below.
- **Sinhala (si)**: trace Nirmala UI (2026-11-22, measured, not drawn here yet). Round bodies
  from 0 to about 595, wide (ක 1036, ග 920, ම 835), some rising to 862 (ර); ා is spacing (406),
  ෙ ෛ are drawn before the consonant (ෙ 684); ි ් above and ු below are marks. Each consonant
  with the al-lakuna ් and with ු ූ is one glyph in the model (ක් කු): draw `.base` where the
  sign changes the letter, then `compose {syllables:"si"}`, and redraw by hand those that join
  in their own way. Conjuncts joined by ZWJ (ක්‍ෂ) are not shaped: the text shows the al-lakuna.
- **Not possible yet**: Khmer, Myanmar, Tibetan. Say so.
  Japanese, Chinese and Korean: load `references/cjk.md`.

## 3b. Arabic, Persian, Urdu

Right to left, no case, every letter on a baseline stroke that runs through the word. Look at a
model first (Noto Kufi Arabic or Noto Naskh Arabic, OFL; Windows often has them). Measured in Noto
Kufi Arabic, Latin x-height 536, caps 714 (2026-11-06): teeth of ب س and the bodies of ع م at
475–517; alef, lam and kaf at 760; descending tails (ر و م ع) to −240 or −320; `.init` and `.medi`
forms draw their joining stroke 10 past the edge they join by; ٮ isolated 778 wide, `.init` 301,
`.medi` 341, `.fina` 821. Order:

1. **Skeletons with their forms**, one `edit_font`: ا د ر و (isolated + `.fina`), and ٮ uni066E,
   ں uni06BA, ى uni0649, ح س ص ط ع ڡ uni06A1 ٯ uni066F ه ل م ك (isolated + `.init` `.medi` `.fina`).
   `.init` is the start of a word: its baseline stroke reaches x 0 (left). `.fina` reaches the
   advance (right); `.medi` both. The checks name a form that does not touch its edge.
2. **Lam-alef**: uni0644_uni0627 and its `.fina` (lam and alef as one shape: lam on the right, read
   first, alef on the left; the `.fina` joins by the right, the lam's side), then the same with
   أ إ آ (uni0623 uni0625 uni0622): `set_glyph` with components, the ligature and the hamza or madda.
3. **Dots as marks**, then one `compose` of every letter with dots (ب ت ث ن ي ج خ ذ ز ش ض ظ غ ف ق ة
   أ إ آ ؤ ئ, and پ چ ژ ی for Persian, ٹ ڈ ڑ for Urdu): it makes each letter and all its forms.
   ج چ: their dots sit inside the bowl; fix those with `set_glyph` components after.
4. **Draw** ء ك ه (and ھ ہ ے for Urdu, with their forms), the Arabic-Indic digits ٠–٩ (ar) or ۰–۹ (fa, ur), and ، ؛ ؟.

Measured in a monoline test (2026-11-06, stroke 70, `proof` and the app): teeth of ب س 200–250
high, alef 700, lam 750; dots squares of 80, above at y 330–410, below at y −230 to −150;
`.init` and `.medi` of ٮ 200 wide. `compose` keeps a dot at the height it is drawn and lifts it only
when it would touch a taller letter: draw dots at their place over a tooth.

5. **Harakat** (optional, for teaching texts and the Quran): fatha, kasra, damma, sukun, shadda and
   the tanwin (U+064B to U+0652) as marks of advance 0; the font sets them on each letter and form.

## 4. Pangrams for proof

```
en  The quick brown fox jumps over the lazy dog
fr  Portez ce vieux whisky au juge blond qui fume. Ça déçoit l’œuvre « où » ÎLE
es  El veloz murciélago hindú comía feliz cardillo y kiwi. ¿Año? ¡Sí!
pt  Luís argüia à Júlia que «brações, fé, chá, óxido, pôr, zângão» eram palavras
it  Quel vituperabile xenofobo zelante assaggia il whisky ed esclama: alleluja!
de  Zwölf Boxkämpfer jagen Viktor quer über den großen Sylter Deich
nl  Pa’s wijze lynx bezag vroom het fikse aquaduct
sv  Flygande bäckasiner söka hwila på mjuka tuvor
da  Høj bly gom vandt fræk sexquiz på wc
pl  Pchnąć w tę łódź jeża lub ośm skrzyń fig
cs  Příliš žluťoučký kůň úpěl ďábelské ódy
sk  Kŕdeľ šťastných ďatľov učí pri ústí Váhu mĺkveho koňa obhrýzať kôru
hu  Árvíztűrő tükörfúrógép
ro  Înjurând pițigăiat, zoofobul comandă vexat whisky și tequila
hr  Gojazni đačić s biciklom drži hmelj i finu vatu u džepu nošnje
tr  Pijamalı hasta yağız şoföre çabucak güvendi. İstanbul
vi  Tiếng Việt có dấu: ấm áp, đường phố, người ơi, ưu tiên
el  Ξεσκεπάζω την ψυχοφθόρα βδελυγμία
ru  Съешь же ещё этих мягких французских булок, да выпей чаю
uk  Чуєш їх, доцю, га? Кумедна ж ти, прощайся без ґольфів!
he  דג סקרן שט בים מאוכזב ולפתע מצא חברה
yi  ייִדיש איז אַ שפּראַך (sample, not a pangram)
hbo בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃ (sample)
ca  Jove xef, porti whisky amb quinze glaçons d’hidrogen, coi!
is  Kæmi ný öxi hér, ykist þjófum nú bæði víl og ádrepa
lv  Glāžšķūņa rūķīši dzērumā čiepj Baha koncertflīģeļu vākus
lt  Įlinkdama fechtuotojo špaga sublykčiojusi pragręžė apvalų arbūzą
bg  Ах, чудна българска земьо, полюшвай цъфтящи жита
sr  Фијуче ветар у шибљу, леди пасаже и куће иза њих и гунђа у оџацима
hy  Բարեւ, աշխարհ։ (sample)
ka  ქართული ენა — სწრაფი ყავისფერი მელა (sample)
ar  نص حكيم له سر قاطع وذو شأن عظيم مكتوب على ثوب أخضر ومغلف بجلد أزرق
fa  بر اثر چنین تلقین و شستشوی مغزی جامعی، سطح و پایه‌ی ذهن و فهم و نظر بعضی اشخاص
hi  ऋषियों को सताने वाले दुष्ट राक्षसों के राजा रावण का सर्वनाश करने वाले विष्णुवतार भगवान श्रीराम
bn  বাংলা ভাষা পৃথিবীর অন্যতম প্রধান ভাষা। ক্ষমা, রুমাল, বর্ষা, কৌতুক, বাক্য, প্রেম (sample)
pa  ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਗੁਰਮੁਖੀ ਲਿਪੀ ਵਿੱਚ ਲਿਖੀ ਜਾਂਦੀ ਹੈ। ਪ੍ਰੇਮ (sample)
gu  ગુજરાતી ભાષા ગુજરાતી લિપિમાં લખાય છે. ક્ષમા, ધર્મ, પ્રેમ (sample)
si  සිංහල භාෂාව ශ්‍රී ලංකාවේ භාෂාවකි. කුමක්, ගෙදර (sample)
te  తెలుగు భాష ఒక ద్రావిడ భాష. కృష్ణ, సత్యం, ప్రేమ (sample)
kn  ಕನ್ನಡ ಒಂದು ದ್ರಾವಿಡ ಭಾಷೆ. ಕೃಷ್ಣ, ಸತ್ಯ, ಪ್ರೀತಿ (sample)
or  ଓଡ଼ିଆ ଭାଷା ଏକ ପ୍ରାଚୀନ ଭାଷା। କ୍ଷମା, ଧର୍ମ, ସତ୍ୟ (sample)
ml  മലയാളം ഒരു ദ്രാവിഡ ഭാഷയാണ്. ക്രമം, സത്യം, കേരളം (sample)
ta  தமிழ் மொழி உலகின் மிகப் பழமையான மொழிகளில் ஒன்று. கூட்டம், டிசம்பர், ஸ்ரீ (sample)
th  เป็นมนุษย์สุดประเสริฐเลิศคุณค่า กว่าบรรดาฝูงสัตว์เดรัจฉาน
lo  ພາສາລາວ (sample)
ur  ٹھنڈ میں، ایک قحط زدہ گاؤں سے گذرتے وقت ایک چڑچڑے، باأثر و فارغ شخص کو بعض جل پری نما اژدہے نظر آئے
```
