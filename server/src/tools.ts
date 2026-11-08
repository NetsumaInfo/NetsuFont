import fs from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { applyOps, charsOf, composeNeeds, exportOtf, FontError, glyphSheet, importFont, languageCoverage, LANGUAGES as SCRIPTS, newFont, OP_NAMES, proofSvg, recipe, UNSUPPORTED_SCRIPTS, type FontDoc, type Glyph, type LanguageCoverage, type Op } from '@netsufont/core';
import { z } from 'zod';
import { GUIDE } from './guide';
import { afterEdit, guarded, outline, png, summary, text } from './reply';
import { LANGUAGES, type Store } from './store';

const name = z.string().describe('Name of the font: lowercase letters, digits and dashes.');
const glyphs = z.array(z.string()).optional().describe('Glyph names. Leave out for every glyph.');
const chars = z.string().optional().describe('Or the characters to show, such as "Hamburg".');

/** The glyphs to show: those named, those of the characters, or all of them. */
function pick(doc: FontDoc, names: string[] | undefined, characters: string | undefined): Glyph[] {
  if (characters !== undefined) {
    return [...new Set(characters)].flatMap((char) => doc.glyphs.filter((glyph) => glyph.unicode === char.codePointAt(0)));
  }
  if (names === undefined) return doc.glyphs;
  return names.map((wanted) => {
    const glyph = doc.glyphs.find((g) => g.name === wanted);
    if (!glyph) throw new FontError('glyph_not_found', `No glyph named "${wanted}".`);
    return glyph;
  });
}

/** Every font in one line each; the glyphs only of the font named. */
function listing(store: Store, font: string | undefined): string {
  if (font !== undefined) return outline(store.read(font));
  const said = store.all().map(summary).join('\n') || 'No font yet. Create one with create_font, or bring one in with import_font.';
  return `app language: ${store.language()}\n${said}\nlist_fonts {name}: one font with its glyphs and checks`;
}

/** The lines of one language: what compose can make from glyphs already planned, what has to be drawn. */
function languageLines(entry: LanguageCoverage, detail: boolean): string[] {
  const head = `${entry.code} ${entry.has}/${entry.of}`;
  if (!detail) return [head];
  const built = entry.missing.filter((char) => recipe(char).base !== undefined);
  const drawn = entry.missing.filter((char) => recipe(char).base === undefined).map((char) => `${char} ${recipe(char).name}`);
  // A form of a letter that compose makes (ب from ٮ) comes with that letter; the others are drawn.
  const composed = new Set(charsOf(SCRIPTS.find((l) => l.code === entry.code)!).filter((char) => recipe(char).base !== undefined).map((char) => recipe(char).name));
  const forms = entry.forms.filter((name) => !composed.has(name.split('.')[0]!));
  return [
    head,
    ...(built.length > 0 ? [`  compose: ${built.join('')}`] : []),
    ...(drawn.length > 0 ? [`  draw: ${drawn.join(', ')}`] : []),
    ...(forms.length > 0 ? [`  draw forms and ligatures: ${forms.join(', ')}`] : []),
  ];
}

/** What each language lacks, and how to make each missing character: built from base and marks, or drawn. */
function languages(doc: FontDoc, codes: string[] | undefined): string {
  const entries = languageCoverage(doc, codes);
  const lines = entries.flatMap((entry) => languageLines(entry, codes !== undefined));
  const needs = composeNeeds(doc, entries.flatMap(({ missing }) => missing).join(''));
  return [...lines, ...(needs.length > 0 ? [`draw before compose (bases, skeletons and their forms, marks): ${needs.join(', ')}`] : []), `not possible yet: ${UNSUPPORTED_SCRIPTS}`].join('\n');
}

function registerRead(server: McpServer, store: Store): void {
  server.registerTool('guide', { description: 'The font format, the ops and a method for drawing a typeface. Read it once before editing.' }, () => text(GUIDE));

  server.registerTool(
    'list_fonts',
    { description: 'Every font in one line. With name: that font, its metrics, coverage, each glyph in short and its checks.', inputSchema: { name: name.optional() } },
    (args) => guarded(() => text(listing(store, args.name))),
  );

  server.registerTool(
    'get_font',
    { description: 'The document of a font as JSON: every glyph with its path, or only those named.', inputSchema: { name, glyphs } },
    (args) =>
      guarded(() => {
        const doc = store.read(args.name);
        const shown = args.glyphs === undefined ? doc : { ...doc, glyphs: pick(doc, args.glyphs, undefined), kerning: doc.kerning.filter((k) => args.glyphs!.includes(k.left) || args.glyphs!.includes(k.right)) };
        return text(JSON.stringify(shown));
      }),
  );

  server.registerTool(
    'languages',
    {
      description: 'What the font covers of each language. With languages: the characters each lacks, those compose can make and those to draw.',
      inputSchema: { name, languages: z.array(z.enum(SCRIPTS.map((l) => l.code) as [string, ...string[]])).optional().describe('Language codes, such as ["fr","es","pl"].') },
    },
    (args) => guarded(() => text(languages(store.read(args.name), args.languages))),
  );

  server.registerTool(
    'look_glyphs',
    {
      description: 'A picture of glyphs on their metric lines (baseline, x-height, cap height, ascender, descender) with their advance. With model: another font\'s glyph of each character in blue, filled under it and outlined over it, as on tracing paper.',
      inputSchema: {
        name,
        glyphs,
        chars,
        columns: z.number().int().min(1).max(16).optional(),
        model: z.string().optional().describe('A font id to draw under each glyph, scaled to the same cap height, such as "model-deva".'),
      },
    },
    (args) =>
      guarded(() => {
        const doc = store.read(args.name);
        const model = args.model === undefined ? undefined : store.read(args.model);
        // With a model, a character not drawn yet shows the model alone: the cell to draw in.
        const shown = model && args.chars !== undefined ? [...new Set(args.chars)].map((char) => doc.glyphs.find((g) => g.unicode === char.codePointAt(0)) ?? { name: recipe(char).name, unicode: char.codePointAt(0)!, advance: 0, path: '' }) : pick(doc, args.glyphs, args.chars);
        if (shown.length === 0) throw new FontError('nothing_to_show', 'None of these glyphs exists yet.');
        const columns = args.columns ?? Math.min(8, shown.length);
        return png(glyphSheet(doc, shown, { columns, ...(model ? { under: model } : {}) }), Math.min(1600, columns * 200), `${shown.map((g) => g.name).join(' ')}`);
      }),
  );

  server.registerTool(
    'proof',
    {
      description: 'Text set with the font at several sizes, with its advances and kerning: for judging spacing and rhythm.',
      inputSchema: {
        name,
        text: z.string().min(1).max(600).describe('"\\n" starts a new line.'),
        sizes: z.array(z.number().min(6).max(300)).max(6).optional(),
        features: z.array(z.string().regex(/^[a-z0-9]{4}$/)).max(8).optional().describe('Optional features to turn on, such as ["ss01"].'),
      },
    },
    (args) =>
      guarded(() => {
        const { svg, missing, cut, fits } = proofSvg(store.read(args.name), args.text, { ...(args.sizes ? { sizes: args.sizes } : {}), ...(args.features ? { features: args.features } : {}) });
        const said = [missing.length > 0 ? `not drawn yet, left out: ${JSON.stringify(missing.join(''))}` : 'every character drawn', ...(cut ? [`a line is too long at the largest size and is cut: about ${fits} characters fit, split it with \\n`] : [])];
        return png(svg, Number(/width="(\d+)"/.exec(svg)?.[1] ?? 1200), said.join('\n'));
      }),
  );
}

function registerWrite(server: McpServer, store: Store): void {
  server.registerTool(
    'create_font',
    { description: 'A new empty font of 1000 units with the usual metrics and a space.', inputSchema: { name, family: z.string().describe('The family name, such as "Netsu Pixel".'), style: z.string().optional() } },
    (args) =>
      guarded(() => {
        if (store.exists(args.name)) throw new FontError('font_exists', `A font named "${args.name}" exists already.`);
        const doc = newFont(args.name, args.family, args.style);
        store.write(doc);
        return text(outline(doc));
      }),
  );

  server.registerTool(
    'edit_font',
    { description: `Applies ops to a font, all or none. Ops: ${OP_NAMES.join(', ')}. See guide.`, inputSchema: { name, ops: z.array(z.object({ op: z.enum(OP_NAMES) }).passthrough()).min(1) } },
    (args) =>
      guarded(() => {
        const before = store.read(args.name);
        const doc = applyOps(before, args.ops as unknown as Op[]);
        store.write(doc);
        return text(afterEdit(before, doc));
      }),
  );

  server.registerTool(
    'import_font',
    { description: 'Brings a TTF, OTF or TTC font in as a new font: to change (its license must allow it; OFL does), or only to look at as a model for a script you draw.', inputSchema: { file: z.string().describe('Absolute path of the .ttf, .otf or .ttc file.'), name, index: z.number().int().min(0).optional().describe('Which font of a .ttc collection, from 0.') } },
    (args) =>
      guarded(() => {
        if (store.exists(args.name)) throw new FontError('font_exists', `A font named "${args.name}" exists already.`);
        if (!/\.(ttf|otf|ttc)$/i.test(args.file) || !fs.existsSync(args.file)) throw new FontError('file_not_found', 'Give the absolute path of a .ttf, .otf or .ttc file that exists.');
        const { doc, skipped } = importFont(new Uint8Array(fs.readFileSync(args.file)), args.name, args.index ?? 0);
        store.write(doc);
        return text(`${summary(doc)}\nnot brought in: ${skipped.join(', ')}\nlist_fonts {name} for its glyphs; look_glyphs {name, chars} to see them`);
      }),
  );

  server.registerTool('remove_font', { description: 'Takes a font out of the list, such as a model brought in to look at. Its file goes to fonts/.trash.', inputSchema: { name } }, (args) =>
    guarded(() => text(`removed: ${args.name}, kept in ${path.resolve(store.remove(args.name))}`)),
  );

  server.registerTool('export_font', { description: 'Writes the font as an .otf file the user can install, and says where.', inputSchema: { name } }, (args) =>
    guarded(() => {
      const doc = store.read(args.name);
      const file = store.writeExport(`${doc.family.replace(/[^A-Za-z0-9]+/g, '')}-${doc.style.replace(/[^A-Za-z0-9]+/g, '')}.otf`, exportOtf(doc));
      return text(`written: ${path.resolve(file)} (${fs.statSync(file).size} bytes)`);
    }),
  );

  server.registerTool('set_language', { description: 'The language of the app. Set it to the language the user speaks to you.', inputSchema: { language: z.enum(LANGUAGES) } }, (args) =>
    guarded(() => text(`app language: ${store.setLanguage(args.language)}`)),
  );
}

export function buildServer(store: Store): McpServer {
  const server = new McpServer({ name: 'netsufont', version: '0.1.0' }, { instructions: GUIDE });
  registerRead(server, store);
  registerWrite(server, store);
  return server;
}
