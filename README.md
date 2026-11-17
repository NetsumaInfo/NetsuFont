# NetsuFont

Make your own font by talking to an AI agent. The agent draws and spaces each glyph through small operations over MCP; you watch the font change live and try it as real text. When it is ready, export an `.otf` file you can install.

NetsuFont works like [NetsuIcon](https://github.com/NetsumaInfo/NetsuIcon), its sister app for animated icons.

## What it does

- **Draw from zero**: the agent creates a font and draws its glyphs as outlines, in font units.
- **Change a font**: bring in a TTF or OTF file (check that its license allows changes; OFL does) and ask for a new style.
- **Build from shapes**: rects, rings, arcs and strokes become outlines, turned the right way.
- **Many languages and scripts**: 74 are counted, in Latin, Greek, Cyrillic, Armenian, Georgian, Hebrew, Arabic, Devanagari, Bengali, Gurmukhi, Gujarati, Odia, Tamil, Malayalam, Thai, Lao, Japanese, Chinese and Korean script (French, Polish, Vietnamese, Russian, Serbian, Armenian, Georgian, Hebrew, Biblical Hebrew with its accents, Yiddish, Arabic, Persian, Urdu, Hindi, Marathi, Nepali, Bengali, Assamese, Punjabi, Gujarati, Odia, Tamil, Malayalam, Thai, Lao, Japanese, simplified and traditional Chinese, Korean…). Accented letters are made from their base and their accent; Arabic letters from their skeleton and dots, with their joining forms. Marks (accents, vowel signs, Hebrew points, Arabic harakat) are drawn once and placed on every letter by the font itself (GPOS). Text runs right to left where it should; Indic syllables are reordered as text engines do, with conjuncts, half forms, the reph and the forms below and after. Thousands of characters are drawn from their strokes with the pen of the font, in one call: Japanese kana and kanji (KanjiVG, CC BY-SA, downloaded once), Chinese hanzi, simplified and traditional (Make Me a Hanzi, Arphic Public License, downloaded once), and Korean Hangul, its syllables composed from letters written for NetsuFont. Telugu, Kannada, Khmer and Myanmar are not possible yet.
- **OpenType features from glyph names**: Arabic joining forms and lam-alef, ligatures (`f_i`), stylistic sets (`a.ss01`) and alternates are written to the font; the app has a switch for each optional one.
- **Space and kern**: side bearings and kerning pairs, checked on words.
- **See it**: the glyphs on their metric lines, one glyph large with its points, and your own text set with the compiled font.
- **Export**: an OpenType file with CFF outlines, kerning and features, and a WOFF2 file for web pages.

## Start

```bash
pnpm install
pnpm dev
```

The app opens on http://localhost:1450. Link the agent of your code editor to the server:

```bash
claude mcp add --transport http netsufont http://127.0.0.1:6220/mcp
```

Then ask, for instance: "draw a rounded sans-serif font, capitals first".

Two example fonts are in `fonts/`. Netsu Pixel (en, fr, es, de, nl) is drawn by a script: `pnpm --filter @netsufont/server seed` while the server runs. Galet (fr, pl) and Rivet (en, ru, el) were drawn by agents that had only the skill below.

## The skill

`skills/netsu-type-design` is the method an agent follows to draw a font: a brief, a style sheet in numbers, five control glyphs, the font family by family, spacing in words, languages, kerning, export. It is also published in [NetsuSkills](https://github.com/NetsumaInfo/NetsuSkills).

## The tools

`guide`, `list_fonts`, `get_font`, `create_font`, `edit_font`, `look_glyphs`, `proof`, `languages`, `import_font`, `export_font`, `set_language`.

## Status

A first slice. See [docs/STATUS.md](docs/STATUS.md) for what is verified and what comes next.

## License

MIT. Fonts you make are yours.
