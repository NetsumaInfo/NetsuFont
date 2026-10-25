import { useEffect, useState } from 'react';
import { exportOtf, type FontDoc } from '@netsufont/core';

let count = 0;

/**
 * The font, compiled to an OTF in the browser and loaded as a web font: the text proof is set by the
 * browser's own text engine, as the font will be once installed. Returns the CSS family name, or
 * undefined while it loads or when it could not be built.
 */
export function useFontFace(doc: FontDoc | undefined): { family?: string; error?: string } {
  const [state, setState] = useState<{ family?: string; error?: string }>({});

  useEffect(() => {
    if (!doc) return;
    let face: FontFace | undefined;
    let alive = true;
    try {
      count += 1;
      const family = `netsufont-${count}`;
      const bytes = exportOtf(doc);
      face = new FontFace(family, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
      const loaded = face;
      void loaded.load().then(
        () => {
          if (!alive) return;
          document.fonts.add(loaded);
          setState({ family });
        },
        (error: unknown) => alive && setState({ error: String(error) }),
      );
    } catch (error) {
      setState({ error: String(error) });
    }
    return () => {
      alive = false;
      if (face) document.fonts.delete(face);
    };
  }, [doc]);

  return state;
}
