import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Store } from './store';
import { buildServer } from './tools';

interface Result {
  isError?: boolean;
  content: { type: string; text?: string; data?: string; mimeType?: string }[];
}

let dir: string;
let client: Client;

async function call(name: string, args: Record<string, unknown> = {}): Promise<Result> {
  return (await client.callTool({ name, arguments: args })) as Result;
}

const said = (result: Result): string => result.content.map((part) => part.text ?? '').join('\n');

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'netsufont-'));
  const [near, far] = InMemoryTransport.createLinkedPair();
  await buildServer(new Store(dir)).connect(far);
  client = new Client({ name: 'test', version: '0' });
  await client.connect(near);
});

afterEach(async () => {
  await client.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('the MCP tools', () => {
  it('sends the guide as instructions', () => {
    expect(client.getInstructions()).toContain('{op:"set_glyph"');
  });

  it('creates, edits, shows, exports and imports a font', async () => {
    expect((await call('create_font', { name: 'demo', family: 'Demo' })).isError).toBeUndefined();
    const edit = await call('edit_font', { name: 'demo', ops: [{ op: 'set_glyph', glyph: 'I', unicode: 73, advance: 300, path: 'M100 0H200V700H100Z' }] });
    expect(said(edit)).toContain('changed: I "I" 300 [100 100]');
    expect(said(edit)).toContain('uppercase 1/26');

    const look = await call('look_glyphs', { name: 'demo', chars: 'I' });
    expect(look.content[1]?.mimeType).toBe('image/png');
    expect(said(await call('proof', { name: 'demo', text: 'II x' }))).toContain('"x"');

    const exported = said(await call('export_font', { name: 'demo' }));
    const file = exported.match(/written: (.+\.otf)/)![1]!;
    expect(fs.existsSync(file)).toBe(true);
    const imported = await call('import_font', { file, name: 'again' });
    expect(said(imported)).toContain('I "I" 300');
  });

  it('gives back a sentence, not a crash, for a bad op', async () => {
    await call('create_font', { name: 'demo', family: 'Demo' });
    const bad = await call('edit_font', { name: 'demo', ops: [{ op: 'set_glyph', glyph: 'A', path: 'L0 0' }] });
    expect(bad.isError).toBe(true);
    expect(said(bad)).toContain('starts with M');
    expect(said(await call('list_fonts'))).not.toContain('"A"');
  });
});
