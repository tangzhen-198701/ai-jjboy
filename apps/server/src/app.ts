import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import { buildChatPrompt } from '@ai-douyin/agent';
import { MockTextGenerationAdapter } from '@ai-douyin/adapters';
import { defaultPolicy, type ChatMessage, type Persona } from '@ai-douyin/shared';
import type { WorkspaceStore } from './store.js';

class RequestError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    length += buffer.length;
    if (length > 16_384) throw new RequestError(413, '请求内容过大');
    chunks.push(buffer);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  try {
    const value: unknown = JSON.parse(body);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new RequestError(400, '请提交有效的 JSON 对象'); }
}

function text(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new RequestError(400, `文本不能为空，且不能超过 ${maximum} 字符`);
  }
  return value.trim();
}

export function createApp(store: WorkspaceStore) {
  const adapter = new MockTextGenerationAdapter();
  return createServer((request, response) => {
    const handle = async (): Promise<void> => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      // Local-only service: no CORS, and block cross-site browser writes.
      const site = request.headers['sec-fetch-site'];
      const origin = request.headers.origin;
      if (site === 'cross-site' || (origin && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))) {
        throw new RequestError(403, '仅接受本机同站请求');
      }
      const path = request.url ?? '';
      const method = request.method;
      let result: unknown;
      if (method === 'GET' && path === '/health') {
        result = { status: 'ok', mode: 'mock', policy: defaultPolicy };
      } else if (method === 'GET' && path === '/api/workspace') {
        result = await store.snapshot();
      } else if (method === 'PUT' && path === '/api/persona') {
        const body = await readBody(request);
        const persona: Omit<Persona, 'version'> = {
          name: text(body['name'], 40), description: text(body['description'], 1000), style: text(body['style'], 1000),
        };
        result = await store.update(state => {
          state.persona = { ...persona, version: state.persona.version + 1 };
          return state.persona;
        });
      } else if (method === 'POST' && path === '/api/memories') {
        const body = await readBody(request);
        const content = text(body['content'], 500);
        result = await store.update(state => {
          if (state.memories.length >= 200) throw new RequestError(409, '记忆已达 200 条，请先整理');
          const memory = { id: randomUUID(), content, createdAt: new Date().toISOString(), source: 'manual' as const };
          state.memories.push(memory);
          return memory;
        });
      } else if (method === 'DELETE' && path.startsWith('/api/memories/')) {
        const id = path.slice('/api/memories/'.length);
        await store.update(state => {
          if (!state.memories.some(item => item.id === id)) throw new RequestError(404, '记忆不存在');
          state.memories = state.memories.filter(item => item.id !== id);
        });
        result = { deleted: true };
      } else if (method === 'DELETE' && path === '/api/messages') {
        await store.update(state => { state.messages = []; });
        result = { deleted: true };
      } else if (method === 'POST' && path === '/api/chat') {
        const body = await readBody(request);
        const content = text(body['content'], 2000);
        result = await store.update(async state => {
          const user: ChatMessage = { id: randomUUID(), role: 'user', content, createdAt: new Date().toISOString(), personaVersion: state.persona.version };
          const generated = await adapter.generateText({ prompt: buildChatPrompt(state.persona, state.memories, [...state.messages, user]) });
          const assistant: ChatMessage = { ...user, id: randomUUID(), role: 'assistant', content: generated.text, createdAt: new Date().toISOString() };
          state.messages = [...state.messages, user, assistant].slice(-100);
          return { messages: [user, assistant], provider: generated.provider };
        });
      } else { throw new RequestError(404, '接口不存在'); }
      response.end(JSON.stringify(result));
    };
    void handle().catch((error: unknown) => {
      response.statusCode = error instanceof RequestError ? error.status : 500;
      response.end(JSON.stringify({ error: error instanceof RequestError ? error.message : '本地数据处理失败，请检查数据文件和服务日志' }));
      if (!(error instanceof RequestError)) console.error(error);
    });
  });
}
