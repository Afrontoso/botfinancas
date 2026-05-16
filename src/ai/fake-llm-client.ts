import type { LlmClient } from './llm-client';

export class FakeLlmClient implements LlmClient {
  private readonly queue: string[];

  constructor(responses: string[]) {
    this.queue = [...responses];
  }

  async complete(_prompt: string): Promise<string> {
    const next = this.queue.shift();
    if (next === undefined) {
      throw new Error('FakeLlmClient: fila de respostas esgotada');
    }
    return next;
  }
}
