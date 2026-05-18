/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  OllamaLlmClient,
  GeminiLlmClient,
  makeLlmClient,
} from '../../src/ai/llm-client';

describe('OllamaLlmClient', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ response: 'resposta do ollama' }), {
        status: 200,
      }),
    );
  });

  it('calls Ollama /api/generate and returns response text', async () => {
    const client = new OllamaLlmClient('http://localhost:11434', 'llama3.1');
    const result = await client.complete('meu prompt');
    expect(result).toBe('resposta do ollama');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }));
    const client = new OllamaLlmClient('http://localhost:11434', 'llama3.1');
    await expect(client.complete('prompt')).rejects.toThrow('OllamaLlmClient: HTTP 500');
  });
});

describe('GeminiLlmClient', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'resposta do gemini' }] } }],
        }),
        { status: 200 },
      ),
    );
  });

  it('chama o endpoint correto e retorna o texto da primeira candidate', async () => {
    const client = new GeminiLlmClient('chave-fake', 'gemini-2.5-flash');
    const result = await client.complete('meu prompt');
    expect(result).toBe('resposta do gemini');
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(String(url)).toContain('models/gemini-2.5-flash:generateContent?key=chave-fake');
    expect(init).toMatchObject({ method: 'POST' });
  });

  it('lança em status não-2xx incluindo o body do erro', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('quota exceeded', { status: 429 }),
    );
    const client = new GeminiLlmClient('chave-fake');
    await expect(client.complete('prompt')).rejects.toThrow(/HTTP 429.*quota exceeded/);
  });

  it('lança quando a resposta não tem texto', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );
    const client = new GeminiLlmClient('chave-fake');
    await expect(client.complete('prompt')).rejects.toThrow(/sem texto/);
  });
});

describe('makeLlmClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefere Gemini quando GEMINI_API_KEY está definido', () => {
    vi.stubEnv('GEMINI_API_KEY', 'chave-x');
    vi.stubEnv('GEMINI_MODEL', 'gemini-2.5-flash');
    const client = makeLlmClient();
    expect(client).toBeInstanceOf(GeminiLlmClient);
  });

  it('cai pra Ollama quando só ele está configurado', () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('OLLAMA_BASE_URL', 'http://localhost:11434');
    vi.stubEnv('OLLAMA_TEXT_MODEL', 'llama3.1');
    const client = makeLlmClient();
    expect(client).toBeInstanceOf(OllamaLlmClient);
  });

  it('lança quando nenhum LLM está configurado', () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('OLLAMA_BASE_URL', '');
    vi.stubEnv('OLLAMA_TEXT_MODEL', '');
    expect(() => makeLlmClient()).toThrow(/nenhum LLM configurado/);
  });
});
