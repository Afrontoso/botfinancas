// @vitest-environment jsdom
/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { CategoriesView } from '../../src/components/categories-view';

describe('CategoriesView', () => {
  it('renders empty state for both sections when no data', () => {
    render(
      <CategoriesView periodLabel="Período: mai/2026" expenses={[]} income={[]} />,
    );
    expect(screen.getByText('Categorias')).toBeInTheDocument();
    expect(screen.getByText('Período: mai/2026')).toBeInTheDocument();
    expect(screen.getAllByText(/Sem registros no período/)).toHaveLength(2);
  });

  it('renders expenses sorted desc with percentage and total', () => {
    render(
      <CategoriesView
        periodLabel="Período: mai/2026"
        expenses={[
          { categoryName: 'Alimentação', total: 80, count: 2 },
          { categoryName: 'Transporte', total: 20, count: 1 },
        ]}
        income={[]}
      />,
    );
    expect(screen.getByText('Total: R$ 100.00')).toBeInTheDocument();
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText(/2 transações · 80\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/1 transação · 20\.0%/)).toBeInTheDocument();
  });

  it('renders income breakdown when provided', () => {
    render(
      <CategoriesView
        periodLabel="Período: mai/2026"
        expenses={[]}
        income={[{ categoryName: 'Salário', total: 3000, count: 1 }]}
      />,
    );
    expect(screen.getByText('Salário')).toBeInTheDocument();
    expect(screen.getByText('R$ 3000.00')).toBeInTheDocument();
  });
});
