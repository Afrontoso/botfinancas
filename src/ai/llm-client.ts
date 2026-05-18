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

/**
 * Cliente REST direto pra Google Gemini (sem SDK pra evitar dep pesada).
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=API_KEY
 */
export class GeminiLlmClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'gemini-2.5-flash',
  ) {}

  async complete(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`GeminiLlmClient: HTTP ${res.status} ${body}`);
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      throw new Error(`GeminiLlmClient: resposta sem texto (${JSON.stringify(data).slice(0, 200)})`);
    }
    return text;
  }
}

/**
 * Selector de runtime: prefere Gemini quando GEMINI_API_KEY estiver definido,
 * cai pra Ollama caso contrário (dev local). Lança se nenhum estiver disponível.
 */
export function makeLlmClient(): LlmClient {
  const geminiKey = process.env['GEMINI_API_KEY'];
  if (geminiKey) {
    return new GeminiLlmClient(geminiKey, process.env['GEMINI_MODEL'] ?? 'gemini-2.5-flash');
  }
  const ollamaUrl = process.env['OLLAMA_BASE_URL'];
  const ollamaModel = process.env['OLLAMA_TEXT_MODEL'];
  if (ollamaUrl && ollamaModel) {
    return new OllamaLlmClient(ollamaUrl, ollamaModel);
  }
  throw new Error(
    'makeLlmClient: nenhum LLM configurado — defina GEMINI_API_KEY ou OLLAMA_BASE_URL+OLLAMA_TEXT_MODEL',
  );
}
