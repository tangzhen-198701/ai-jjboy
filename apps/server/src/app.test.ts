import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import type { WorkspaceState } from '@ai-douyin/shared';
import { createApp } from './app.js';
import { WorkspaceStore } from './store.js';

await test('local workspace preserves edits, handles concurrency and deletes memories', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ai-douyin-'));
  const filePath = join(directory, 'workspace.json');
  const server = createApp(new WorkspaceStore(filePath));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  async function request(path: string, method = 'GET', body?: unknown) {
    return fetch(`${base}/api/${path}`, {
      method, headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  try {
    const initial = await (await request('workspace')).json() as WorkspaceState;
    assert.equal(initial.persona.version, 1);
    const invalid = await request('persona', 'PUT', { name: '' });
    assert.equal(invalid.status, 400);
    await request('persona', 'PUT', { name: '小勇', description: '热血乐观', style: '简短幽默' });
    const memory = await (await request('memories', 'POST', { content: '我喜欢散步' })).json() as { id: string };
    const replies = await Promise.all(['你记得什么', '今天失败了'].map(content => request('chat', 'POST', { content })));
    assert.ok(replies.every(reply => reply.ok));
    const saved = await new WorkspaceStore(filePath).snapshot();
    assert.equal(saved.persona.name, '小勇');
    assert.equal(saved.persona.version, 2);
    assert.equal(saved.messages.length, 4);
    assert.ok(saved.messages.some(message => message.role === 'assistant' && message.content.includes('我喜欢散步')));
    assert.ok(saved.messages.every(message => message.personaVersion === 2));
    assert.equal((await request(`memories/${memory.id}`, 'DELETE')).status, 200);
    assert.equal((await request(`memories/${memory.id}`, 'DELETE')).status, 404);
    const after = await new WorkspaceStore(filePath).snapshot();
    assert.equal(after.memories.length, 0);
    assert.equal(after.messages.length, 4);
    await request('messages', 'DELETE');
    assert.equal((await new WorkspaceStore(filePath).snapshot()).messages.length, 0);
    const crossSite = await fetch(`${base}/api/memories`, {
      method: 'POST', headers: { origin: 'https://example.com', 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'unexpected' }),
    });
    assert.equal(crossSite.status, 403);
    const malformed = await fetch(`${base}/api/chat`, { method: 'POST', body: '{' });
    assert.equal(malformed.status, 400);
    assert.equal((await request('chat', 'POST', { content: 'x'.repeat(2001) })).status, 400);
    assert.equal((await request('chat', 'POST', { content: 'x'.repeat(17000) })).status, 413);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
