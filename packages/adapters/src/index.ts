export interface TextGenerationRequest {
  prompt: string;
}

export interface TextGenerationResult {
  text: string;
  provider: 'mock';
}

export interface TextGenerationAdapter {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
}

// Deterministic responses only. This is not an intelligent or moderation model.
export class MockTextGenerationAdapter implements TextGenerationAdapter {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    const input = JSON.parse(request.prompt) as {
      persona: { name: string };
      memories: string[];
      messages: { role: string; content: string }[];
    };
    const message = input.messages.at(-1)?.content ?? '';
    let text = `我是${input.persona.name}！热血已经就位。现在还是模拟聊天，我会先把你的话接住：咱们挑一件能开始的小事，先拿下一分！`;
    if (/记得|记忆/.test(message)) {
      text = input.memories.length > 0
        ? `你明确保存的记忆有：${input.memories.join('；')}。这是本地记录，我不会把猜测当事实！`
        : '还没有明确保存的记忆。你可以在记忆面板添加，我可不能靠吹牛假装记得！';
    } else if (/难过|失败|做不好/.test(message)) {
      text = '先别给自己判输。休息一下，再挑一个十分钟能完成的小目标，咱们从这一分开始！';
    } else if (/政治|色情|赌博|毒品/.test(message)) {
      text = '这个话题超出了我们设定的交流范围，换个日常话题吧。';
    }
    return Promise.resolve({ text: `[模拟回复] ${text}`, provider: 'mock' });
  }
}
