/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { detectIntent } from '../../src/ai/intent';

describe('detectIntent', () => {
  it('classifies "Gastei 50 no mercado" as create_transaction', () => {
    expect(detectIntent('Gastei 50 no mercado')).toBe('create_transaction');
  });

  it('classifies "Recebi 3000" as create_transaction', () => {
    expect(detectIntent('Recebi 3000')).toBe('create_transaction');
  });

  it('classifies "Quanto gastei hoje?" as query', () => {
    expect(detectIntent('Quanto gastei hoje?')).toBe('query');
  });

  it('classifies "Me mostra meus gastos" as query', () => {
    expect(detectIntent('Me mostra meus gastos')).toBe('query');
  });

  it('defaults to create_transaction for ambiguous text', () => {
    expect(detectIntent('alguma coisa aleatória')).toBe('create_transaction');
  });

  it('classifies "Todo dia 5 pago aluguel" as create_recurring', () => {
    expect(detectIntent('Todo dia 5 pago 1500 de aluguel')).toBe('create_recurring');
  });

  it('classifies "Todo mês recebo salário" as create_recurring', () => {
    expect(detectIntent('Todo mês recebo 5000 de salário')).toBe('create_recurring');
  });

  it('recurring takes priority over query in ambiguous cases', () => {
    expect(detectIntent('me mostra todo mês')).toBe('create_recurring');
  });
});
