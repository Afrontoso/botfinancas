import type { ReactElement } from 'react';

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}): ReactElement {
  return (
    <header>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {subtitle ? <p className="text-sm text-[var(--muted)]">{subtitle}</p> : null}
    </header>
  );
}
