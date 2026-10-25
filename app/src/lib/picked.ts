import { useCallback, useEffect, useState } from 'react';

/** What the user chose to see: a font, and maybe one of its glyphs. */
export interface Picked {
  font?: string;
  glyph?: string;
}

/** The choice as the end of the address: `#/netsu-pixel`, `#/netsu-pixel/A`. */
export function toHash({ font, glyph }: Picked): string {
  if (font === undefined) return '';
  return `#/${[font, ...(glyph === undefined ? [] : [glyph])].map(encodeURIComponent).join('/')}`;
}

export function fromHash(hash: string): Picked {
  const [font, glyph] = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return { font, glyph };
}

/** The choice, kept in the address: a reload stays on the same glyph, and a link opens it. */
export function usePicked(): [Picked, (picked: Picked) => void] {
  const [picked, setPicked] = useState<Picked>(() => fromHash(window.location.hash));

  useEffect(() => {
    const read = (): void => setPicked(fromHash(window.location.hash));
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const pick = useCallback((next: Picked): void => {
    window.location.hash = toHash(next);
  }, []);

  return [picked, pick];
}
