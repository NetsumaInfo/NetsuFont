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
| tr | ı (dotless i), İ (I with dotaccent), ğ (breve), ş ç (cedilla) |
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
- **Hebrew (he)**: right to left, no case. Letters sit on the baseline and rise to a height
  between the x-height and the cap height (about 560); horizontal strokes thicker than vertical
  ones (the reverse of Latin). Final forms ך ן ף ץ go down to the descender. The app's text view
  sets it right to left; `proof` does not.
- **Not possible yet**: Arabic, Persian, Urdu, the Indic scripts, Thai, Khmer (letters change
  with their neighbours: GSUB, not written by NetsuFont yet); Chinese, Japanese, Korean
  (thousands of glyphs). Say so; never draw isolated forms and call it Arabic.

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
```
