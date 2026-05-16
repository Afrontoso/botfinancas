/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { loadPrompt } from '../../src/ai/prompt-loader';

describe('loadPrompt', () => {
  it('loads template and interpolates USER_MESSAGE', () => {
    const result = loadPrompt('transaction-extraction.v1', {
      USER_MESSAGE: 'Gastei 50 no mercado',
    });
    expect(result).toContain('Gastei 50 no mercado');
    expect(result).not.toContain('{{USER_MESSAGE}}');
  });

  it('throws if template file does not exist', () => {
    expect(() =>
      loadPrompt('template-inexistente', { USER_MESSAGE: 'teste' }),
    ).toThrow();
  });

  it('throws if a placeholder remains unsubstituted', () => {
    expect(() => loadPrompt('transaction-extraction.v1', {})).toThrow();
  });
});
