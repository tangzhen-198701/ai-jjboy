import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { initialPersona, type WorkspaceState } from '@ai-douyin/shared';

export class WorkspaceStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async read(): Promise<WorkspaceState> {
    try {
      const state = JSON.parse(await readFile(this.filePath, 'utf8')) as WorkspaceState;
      if (!state.persona || !Array.isArray(state.memories) || !Array.isArray(state.messages)) {
        throw new Error('Invalid workspace data; restore from a backup.');
      }
      return state;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return { persona: { ...initialPersona }, memories: [], messages: [] };
      }
      throw error;
    }
  }

  async snapshot(): Promise<WorkspaceState> {
    await this.queue;
    return this.read();
  }

  update<T>(change: (state: WorkspaceState) => T | Promise<T>): Promise<T> {
    const task = this.queue.then(async () => {
      const state = await this.read();
      const result = await change(state);
      await mkdir(dirname(this.filePath), { recursive: true });
      const temporaryPath = `${this.filePath}.${randomUUID()}.tmp`;
      await writeFile(temporaryPath, JSON.stringify(state, null, 2), { mode: 0o600 });
      await rename(temporaryPath, this.filePath);
      return result;
    });
    this.queue = task.catch(() => undefined);
    return task;
  }
}
