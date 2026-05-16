/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { resolveDateExpression } from '../../../src/financial/dates';

const TZ = 'America/Sao_Paulo';
// noon UTC — safely 2026-05-09 in any reasonable timezone
const REF = new Date('2026-05-09T12:00:00Z');

describe('resolveDateExpression', () => {
  it('resolves "hoje" to the reference date', () => {
    expect(resolveDateExpression('hoje', REF, TZ)).toEqual({
      from: '2026-05-09',
      to: '2026-05-09',
    });
  });

  it('resolves "ontem" to the day before the reference date', () => {
    expect(resolveDateExpression('ontem', REF, TZ)).toEqual({
      from: '2026-05-08',
      to: '2026-05-08',
    });
  });

  it('resolves "anteontem" to two days before the reference date', () => {
    expect(resolveDateExpression('anteontem', REF, TZ)).toEqual({
      from: '2026-05-07',
      to: '2026-05-07',
    });
  });

  it('resolves "amanhã" to the day after the reference date', () => {
    expect(resolveDateExpression('amanhã', REF, TZ)).toEqual({
      from: '2026-05-10',
      to: '2026-05-10',
    });
  });

  it('resolves "essa semana" to Mon–Sun of the reference week (2026-05-09 is Saturday)', () => {
    expect(resolveDateExpression('essa semana', REF, TZ)).toEqual({
      from: '2026-05-04',
      to: '2026-05-10',
    });
  });

  it('resolves "esse mês" to the full calendar month of the reference date', () => {
    expect(resolveDateExpression('esse mês', REF, TZ)).toEqual({
      from: '2026-05-01',
      to: '2026-05-31',
    });
  });

  it('resolves an ISO date string "2026-04-15" to itself', () => {
    expect(resolveDateExpression('2026-04-15', REF, TZ)).toEqual({
      from: '2026-04-15',
      to: '2026-04-15',
    });
  });

  it('resolves "15/04" (DD/MM) using the reference year', () => {
    expect(resolveDateExpression('15/04', REF, TZ)).toEqual({
      from: '2026-04-15',
      to: '2026-04-15',
    });
  });

  it('returns null for unrecognized expression "xyz"', () => {
    expect(resolveDateExpression('xyz', REF, TZ)).toBeNull();
  });

  it('respects timezone when computing "hoje" across a midnight boundary', () => {
    // 2026-05-10T02:00:00Z = May 9 23:00 in Sao Paulo, May 10 in UTC
    const crossMidnight = new Date('2026-05-10T02:00:00Z');
    expect(resolveDateExpression('hoje', crossMidnight, 'America/Sao_Paulo')).toEqual({
      from: '2026-05-09',
      to: '2026-05-09',
    });
    expect(resolveDateExpression('hoje', crossMidnight, 'UTC')).toEqual({
      from: '2026-05-10',
      to: '2026-05-10',
    });
  });
});
