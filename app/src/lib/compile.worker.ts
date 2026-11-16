// Compiles a font to an OTF away from the page: a font of thousands of glyphs takes seconds, and the page stays
// usable meanwhile. It answers with the bytes, or the error, under the id it was asked with.
import { exportOtf, type FontDoc } from '@netsufont/core';

addEventListener('message', (event: MessageEvent<{ id: number; doc: FontDoc }>) => {
  const { id, doc } = event.data;
  try {
    const bytes = exportOtf(doc);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    postMessage({ id, buffer }, { transfer: [buffer] });
  } catch (error) {
    postMessage({ id, error: String(error) });
  }
});
