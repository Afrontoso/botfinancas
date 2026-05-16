export interface LlmClient {
  complete(prompt: string): Promise<string>;
}

export class OllamaLlmClient implements LlmClient {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async complete(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt, stream: false }),
    });
    if (!res.ok) {
      throw new Error(`OllamaLlmClient: HTTP ${res.status}`);
    }
    const data = (await res.json()) as { response: string };
    return data.response;
  }
}
