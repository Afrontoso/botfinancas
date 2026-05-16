/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaLlmClient } from '../../src/ai/llm-client';

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
