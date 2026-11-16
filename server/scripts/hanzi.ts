// Downloads the stroke data of Make Me a Hanzi into ~/.netsufont/hanzi (or NETSUFONT_HANZI), for draw_kanji.
// Its graphics.txt comes from the Arphic fonts: Arphic Public License. A font drawn from it is shared under that
// license. The data never goes into this repository.
import fs from 'node:fs';
import path from 'node:path';
import { HANZI_FILE } from '../src/store';

// A fixed commit, so that every machine draws the same characters.
const COMMIT = 'bddc96d41bef78427ed0e034e9f7e31d71fd1b92';
const url = `https://raw.githubusercontent.com/skishore/makemeahanzi/${COMMIT}/graphics.txt`;

fs.mkdirSync(path.dirname(HANZI_FILE), { recursive: true });
console.log(`Downloading ${url}`);
const response = await fetch(url);
if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
const text = await response.text();
fs.writeFileSync(HANZI_FILE, text);
const count = text.split('\n').filter(Boolean).length;
console.log(`Make Me a Hanzi: ${count} characters in ${HANZI_FILE}. License: Arphic Public License.`);
