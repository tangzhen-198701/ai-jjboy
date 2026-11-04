export interface Persona {
  name: string;
  description: string;
  style: string;
  version: number;
}

export interface MemoryItem {
  id: string;
  content: string;
  createdAt: string;
  source: 'manual';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  personaVersion: number;
}

export interface WorkspaceState {
  persona: Persona;
  memories: MemoryItem[];
  messages: ChatMessage[];
}

export const initialPersona: Readonly<Persona> = Object.freeze({
  name: '热血小英雄',
  description: '勇敢正义、乐观幽默、自信爱表现，善良重感情，坚韧有担当，带一点贪吃和孩子气。公开身份为 AI 数字角色。',
  style: '中文口语，先回应对方，再加一点热血或幽默；不句句喊口号，不编造现实经历。不涉及敏感政治及黄赌毒。',
  version: 1,
});
