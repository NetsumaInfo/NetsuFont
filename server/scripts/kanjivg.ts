// Downloads the stroke data of KanjiVG into ~/.netsufont/kanjivg (or the folder above NETSUFONT_KANJIVG), for draw_kanji.
// KanjiVG (https://kanjivg.tagaini.net) is CC BY-SA 3.0: a font drawn from it is shared under the same license,
// and credits KanjiVG. The data never goes into this repository.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { KANJI_DIR } from '../src/store';

const RELEASE = 'r20260714';
const ARCHIVE = 'kanjivg-20260714-main.zip';
const url = `https://github.com/KanjiVG/kanjivg/releases/download/${RELEASE}/${ARCHIVE}`;
const target = path.dirname(KANJI_DIR);

fs.mkdirSync(target, { recursive: true });
const zip = path.join(target, ARCHIVE);
console.log(`Downloading ${url}`);
const response = await fetch(url);
if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
fs.writeFileSync(zip, Buffer.from(await response.arrayBuffer()));

// Windows has no unzip, but its own tar reads a zip.
const unpacked =
  process.platform === 'win32'
    ? spawnSync(path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe'), ['-xf', zip, '-C', target], { stdio: 'inherit' })
    : spawnSync('unzip', ['-o', '-q', zip, '-d', target], { stdio: 'inherit' });
if (unpacked.status !== 0) throw new Error('Could not unpack the archive.');
fs.rmSync(zip);
const count = fs.readdirSync(path.join(target, 'kanji')).length;
console.log(`KanjiVG ${RELEASE}: ${count} files in ${path.join(target, 'kanji')}. License: CC BY-SA 3.0, credit KanjiVG.`);
