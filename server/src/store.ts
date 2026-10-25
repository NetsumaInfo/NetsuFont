import fs from 'node:fs';
import path from 'node:path';
import { FONT_NAME, FontError, validate, type FontDoc } from '@netsufont/core';

const SUFFIX = '.nfont.json';
const SETTINGS_FILE = 'settings.json';

/** The languages the app speaks. The first one is the one it starts in. */
export const LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];

function saveJson(file: string, value: unknown): void {
  const draft = `${file}.tmp`;
  fs.writeFileSync(draft, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(draft, file);
}

/** The folder of fonts: one `<name>.nfont.json` per font. The only place that touches the disk. */
export class Store {
  constructor(readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  private file(name: string): string {
    if (!FONT_NAME.test(name)) throw new FontError('bad_name', 'The name of a font is lowercase letters, digits and dashes.');
    return path.join(this.dir, name + SUFFIX);
  }

  names(): string[] {
    return fs
      .readdirSync(this.dir)
      .filter((entry) => entry.endsWith(SUFFIX))
      .map((entry) => entry.slice(0, -SUFFIX.length))
      .sort();
  }

  exists(name: string): boolean {
    return fs.existsSync(this.file(name));
  }

  read(name: string): FontDoc {
    const file = this.file(name);
    if (!fs.existsSync(file)) throw new FontError('font_not_found', `No font named "${name}". Existing: ${this.names().join(', ') || 'none'}.`);
    const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as FontDoc;
    // A file changed by hand, or written by an older version: said as an error, not met later as a crash.
    validate(doc);
    return doc;
  }

  /** The fonts that can be read; a file that cannot is skipped, not fatal. */
  all(): FontDoc[] {
    return this.names().flatMap((name) => {
      try {
        return [this.read(name)];
      } catch {
        return [];
      }
    });
  }

  /** Saves the font, unless it is not valid. */
  write(doc: FontDoc): void {
    validate(doc);
    saveJson(this.file(doc.name), doc);
  }

  /** Writes an exported font file in `exports/` (git-ignored). Returns its path. */
  writeExport(fileName: string, bytes: Uint8Array): string {
    const folder = path.join(this.dir, 'exports');
    fs.mkdirSync(folder, { recursive: true });
    const file = path.join(folder, path.basename(fileName));
    fs.writeFileSync(file, bytes);
    return file;
  }

  language(): Language {
    try {
      const found = (JSON.parse(fs.readFileSync(path.join(this.dir, SETTINGS_FILE), 'utf8')) as { language?: unknown }).language;
      return LANGUAGES.includes(found as Language) ? (found as Language) : LANGUAGES[0];
    } catch {
      return LANGUAGES[0];
    }
  }

  setLanguage(language: unknown): Language {
    if (!LANGUAGES.includes(language as Language)) throw new FontError('bad_language', `The app speaks ${LANGUAGES.join(', ')}.`);
    saveJson(path.join(this.dir, SETTINGS_FILE), { language });
    return language as Language;
  }

  /** Calls `onChange` when a font or the settings change. Returns how to stop. */
  watch(onChange: () => void): () => void {
    let timer: NodeJS.Timeout | undefined;
    const watcher = fs.watch(this.dir, (_event, file) => {
      if (!file || !(file.endsWith(SUFFIX) || file === SETTINGS_FILE)) return;
      clearTimeout(timer);
      timer = setTimeout(onChange, 50);
    });
    return () => {
      clearTimeout(timer);
      watcher.close();
    };
  }
}
