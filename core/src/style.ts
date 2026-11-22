// What a style name says to the apps that list fonts: its weight, whether it is italic, and the names that group it
// with the other styles of its family. Windows groups four styles under one name (Regular, Bold, Italic, Bold
// Italic); any other weight is a family of its own there ("Fulgur Light"), and the typographic names (16, 17) put
// it back in the family for apps that read them.

const WEIGHTS: [RegExp, number, string][] = [
  [/(hairline|thin)/, 100, 'Thin'],
  [/(extra|ultra)\s*light/, 200, 'ExtraLight'],
  [/light/, 300, 'Light'],
  [/medium/, 500, 'Medium'],
  [/(semi|demi)\s*bold/, 600, 'SemiBold'],
  [/(extra|ultra)\s*bold/, 800, 'ExtraBold'],
  [/(black|heavy)/, 900, 'Black'],
  [/bold/, 700, 'Bold'],
];

export interface StyleNames {
  /** usWeightClass of OS/2: 100 to 900. */
  weight: number;
  italic: boolean;
  /** Name IDs 1 and 2: the family and the style Windows groups by. */
  family: string;
  subfamily: string;
  /** Name IDs 16 and 17, when they differ from 1 and 2. */
  typographic?: { family: string; subfamily: string };
  /** fsSelection of OS/2 and macStyle of head. */
  fsSelection: number;
  macStyle: number;
}

/** The names and flags of a style of a family: "Bold Italic" is weight 700, italic, and one of the four. */
export function styleNames(family: string, style: string): StyleNames {
  const lower = style.toLowerCase();
  const italic = /(italic|oblique)/.test(lower);
  const found = WEIGHTS.find(([pattern]) => pattern.test(lower));
  const weight = found?.[1] ?? 400;
  const linked = weight === 400 || weight === 700;
  const subfamily = [weight === 700 ? 'Bold' : '', italic ? 'Italic' : ''].filter(Boolean).join(' ') || 'Regular';
  const names = linked ? { family, subfamily } : { family: `${family} ${found![2]}`, subfamily: italic ? 'Italic' : 'Regular' };
  const bold = linked && weight === 700;
  return {
    weight,
    italic,
    ...names,
    ...(names.family !== family || names.subfamily !== style ? { typographic: { family, subfamily: style } } : {}),
    fsSelection: (italic ? 1 : 0) | (bold ? 32 : 0) | (!italic && !bold ? 64 : 0),
    macStyle: (bold ? 1 : 0) | (italic ? 2 : 0),
  };
}
