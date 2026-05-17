// @vitest-environment jsdom
/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { ExportButtons } from '../../src/components/export-buttons';

describe('ExportButtons', () => {
  it('renders CSV and PDF links without query string when no filter', () => {
    render(<ExportButtons filter={{}} />);
    expect(screen.getByText('Exportar CSV')).toHaveAttribute('href', '/api/export/csv');
    expect(screen.getByText('Exportar PDF')).toHaveAttribute('href', '/api/export/pdf');
  });

  it('marks anchors with the download attribute so the browser triggers a save', () => {
    render(<ExportButtons filter={{}} />);
    expect(screen.getByText('Exportar CSV')).toHaveAttribute('download');
    expect(screen.getByText('Exportar PDF')).toHaveAttribute('download');
  });

  it('forwards filter params into the href query string', () => {
    render(
      <ExportButtons
        filter={{ type: 'expense', categoryId: 'c1', from: '2026-05-01', to: '2026-05-31' }}
      />,
    );
    expect(screen.getByText('Exportar CSV')).toHaveAttribute(
      'href',
      '/api/export/csv?type=expense&categoryId=c1&from=2026-05-01&to=2026-05-31',
    );
    expect(screen.getByText('Exportar PDF')).toHaveAttribute(
      'href',
      '/api/export/pdf?type=expense&categoryId=c1&from=2026-05-01&to=2026-05-31',
    );
  });
});
