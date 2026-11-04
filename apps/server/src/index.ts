import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { WorkspaceStore } from './store.js';

const port = Number(process.env['PORT'] ?? 3100);
const dataPath = process.env['WORKSPACE_DATA_PATH'] ?? fileURLToPath(new URL('../../../data/workspace.json', import.meta.url));
const server = createApp(new WorkspaceStore(dataPath));
server.listen(port, '127.0.0.1', () => {
  console.info(`Local server: http://127.0.0.1:${port}/health`);
});
