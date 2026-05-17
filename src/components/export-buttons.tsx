import type { ReactElement } from 'react';

export type ExportButtonsProps = {
  filter: { type?: string; categoryId?: string; from?: string; to?: string };
};

function buildHref(format: 'csv' | 'pdf', filter: ExportButtonsProps['filter']): string {
  const params = new URLSearchParams();
  if (filter.type) params.set('type', filter.type);
  if (filter.categoryId) params.set('categoryId', filter.categoryId);
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  const qs = params.toString();
  return `/api/export/${format}${qs ? `?${qs}` : ''}`;
}

export function ExportButtons({ filter }: ExportButtonsProps): ReactElement {
  return (
    <div className="flex gap-2">
      <a
        href={buildHref('csv', filter)}
        download
        className="rounded-md border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--border)]"
      >
        Exportar CSV
      </a>
      <a
        href={buildHref('pdf', filter)}
        download
        className="rounded-md border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--border)]"
      >
        Exportar PDF
      </a>
    </div>
  );
}
