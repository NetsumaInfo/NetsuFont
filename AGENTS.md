# AGENTS.md — NetsuFont

Instructions for any coding agent working on this repo. `CLAUDE.md` points here: **this file is the single source**.

An app to make fonts with an AI agent. The agent draws and spaces the glyphs through MCP with small targeted operations; the user watches the font change live and tries it as real text. NetsuFont is built on the model of [NetsuIcon](https://github.com/NetsumaInfo/NetsuIcon).

## Status (2026-10-25, first slice, shapes, languages, skill)

- `core/`: the font document, the ops, validation, shapes (rect, ellipse, ring, arc, line, polygon turned into paths), checks (a counter not cut, ink outside the advance or the lines), languages (23 languages, how each character is made) and `compose` (accented letters from base and marks; Greek and Cyrillic letters shaped as Latin ones), layout with kerning, SVG pictures (glyph sheet, text proof), coverage of character sets, OTF export (opentype.js, CFF outlines, plus a `kern` table written by `core/src/sfnt.ts`), and import of a TTF or OTF. Unit tested.
- `server/`: local HTTP server. `/mcp` is the MCP endpoint (stateless streamable HTTP); `/api/fonts` and `/api/events` feed the app. Fonts are files in `fonts/`.
- `app/`: web front (Vite, React, Tailwind v4). Read only. The list of fonts, the glyph grid or one glyph on its lines, a text proof set by the browser with the font compiled to OTF, and a panel (glyph, metrics, coverage, kerning). The choice is in the address (`#/netsu-pixel/g`). English and French.
- `fonts/netsu-pixel.nfont.json` is drawn by `server/scripts/seed.ts` through the tools (en, fr, es, de, nl). `galet` (fr, pl) and `rivet` (en, ru, el) were drawn by agents that had only the skill.
- The method of drawing a font is a skill, `netsu-type-design`, in `skills/`. `server/src/guide.ts` holds the format; the skill holds the method. The NetsuSkills repository publishes a copy.
- Not yet: styles shared by a family (weights), scripts that need GSUB (Arabic, Indic), a lint of the style, GPOS kerning, TTF and WOFF2 export, ligatures and other features, editing by hand in the app. See `docs/STATUS.md`.

## Read first

`docs/STATUS.md`: decisions, what is verified and what is not, what comes next. A decision is not reopened without saying so.

## Structure

```
core/src/      # pure TypeScript, no DOM, no Node: types, path, validate, outline (components, layout), ops, shapes, check, svg, charset,
               # languages, accents (compose), otf, sfnt, doc
server/src/    # store.ts (only code that touches the disk), tools.ts (MCP tools), reply.ts (what a tool answers), guide.ts (what the agent is told), main.ts (HTTP)
server/scripts/  # seed.ts (the example font), mcp.ts (one tool call from a shell), agent.ts (their client)
app/src/       # components/, lib/ (useFonts, events, picked, fontFace), locales/ (fr is the source, en)
fonts/         # <name>.nfont.json, one per font; exports/ (git-ignored) holds the .otf files
skills/        # netsu-type-design: written for an agent that has only its folder and the guide
docs/          # STATUS.md
```

## Commands

```bash
pnpm install
pnpm dev        # server on 127.0.0.1:6220 and app on http://localhost:1450
pnpm check      # types everywhere + same locale keys
pnpm test       # vitest: core and the MCP tools
pnpm --filter @netsufont/server seed        # the example font, needs the server running
pnpm --filter @netsufont/server mcp proof '{"name":"netsu-pixel","text":"Hamburg"}' out.png   # any tool, from a shell
```

Ports: app **1450**, server **6220** (1420, 1430 and 1440 belong to other Netsu apps; 6210 is NetsuIcon).

## Rules

- Everything written in the repository is in **English**, in simple sentences. Only the conversation with the maintainer may be in French.
- **Say what is measured or verified and what is not.**
- Licenses: MIT, Apache, BSD, MPL only. FontForge and Fontra are GPL: they are not used. A font brought in with `import_font` keeps its own license; the user checks it.
- File ≤ 300 lines (ceiling 400), function ≤ 40, React component ≤ 200. No dead code.
- No hard-coded visible text: `app/src/locales/fr/` (the source for wording), then every other language, same change.
- Every change of a font goes through `applyOps` (`core/src/ops.ts`): all or nothing, validated. A document that is saved can always be drawn and exported.
- Coordinates are font units, y up, as in the font file. Only the SVG pictures turn y down (`writePath(…, true)`).
- An MCP tool is a thin adapter over `core`. When the format or an op changes, update `server/src/guide.ts` in the same change: it is all the agent knows, and every agent pays for each of its lines.
- The skill in `skills/` changes with the guide: a rule lives in one of the two, never both. A number in the skill's references was drawn and proofed before it was written there. After a change, copy the folder to NetsuSkills, where its tests are recorded.
- A language is supported when `languages` reports it complete, never because a few of its letters exist. Scripts the format cannot shape (Arabic, Indic, Thai) are said to be unsupported, never drawn as isolated forms.
- What a tool answers is paid for at every call: the outline gives each glyph's advance and side bearings, not its path.
- The app shows the ids the agent uses (font, glyph, metric names) in a monospace face.
- `core` stays free of DOM and Node APIs: it runs in the browser, in the server and in tests.
- The server listens on 127.0.0.1 only and refuses a foreign `Host` or `Origin`. Never loosen this.
- Pure logic gets a unit test next to it.

## Git

- Commit and push only when the user asks. Short conventional messages in English.
- Never a `Co-Authored-By` trailer. Never change `user.name` / `user.email`, never use `--author`.
