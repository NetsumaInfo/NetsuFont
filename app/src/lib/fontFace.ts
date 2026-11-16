import { useEffect, useState } from 'react';
import type { FontDoc } from '@netsufont/core';

let count = 0;
let faces = 0;
let worker: Worker | undefined;

/** The one worker that compiles fonts, made on first use. */
function compiler(): Worker {
  worker ??= new Worker(new URL('./compile.worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

/** The font compiled to OTF bytes by the worker. */
function compile(doc: FontDoc): Promise<ArrayBuffer> {
  count += 1;
  const id = count;
  return new Promise((resolve, reject) => {
    const answer = (event: MessageEvent<{ id: number; buffer?: ArrayBuffer; error?: string }>): void => {
      if (event.data.id !== id) return;
      compiler().removeEventListener('message', answer);
      if (event.data.buffer) resolve(event.data.buffer);
      else reject(new Error(event.data.error));
    };
    compiler().addEventListener('message', answer);
    compiler().postMessage({ id, doc });
  });
}

/** How long the font must stay still before it is compiled: an agent's ops come in bursts. */
const QUIET_MS = 300;

/**
 * The font, compiled to an OTF in a worker and loaded as a web font: the text proof is set by the browser's own text
 * engine, as the font will be once installed. Returns the CSS family name, or undefined while the first one loads
 * or when it could not be built. While a new version compiles, the last one stays shown.
 */
export function useFontFace(doc: FontDoc | undefined): { family?: string; error?: string } {
  const [state, setState] = useState<{ family?: string; error?: string }>({});

  useEffect(() => {
    if (!doc) return;
    let face: FontFace | undefined;
    let alive = true;
    const timer = setTimeout(() => {
      compile(doc).then(
        async (buffer) => {
          if (!alive) return;
          faces += 1;
          const family = `netsufont-${faces}`;
          face = new FontFace(family, buffer);
          await face.load();
          if (!alive) return;
          document.fonts.add(face);
          setState({ family });
        },
        (error: unknown) => alive && setState({ error: String(error) }),
      );
    }, QUIET_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
      // The face stays a moment so that the text does not flash while the next one compiles.
      const old = face;
      if (old) setTimeout(() => document.fonts.delete(old), 5000);
    };
  }, [doc]);

  return state;
}
