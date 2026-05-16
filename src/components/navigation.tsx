import Link from 'next/link';
import type { ReactElement } from 'react';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/transactions', label: 'Transações', icon: '💸' },
  { href: '/categories', label: 'Categorias', icon: '🏷️' },
  { href: '/invoices', label: 'Faturas', icon: '🧾' },
];

export function Navigation(): ReactElement {
  return (
    <nav className="flex h-screen w-56 flex-col gap-1 border-r border-[var(--border)] bg-[#0a0c10] p-4 text-sm">
      <div className="mb-6 px-2 py-3">
        <h1 className="text-lg font-semibold">Botfinanças</h1>
        <p className="text-xs text-[var(--muted)]">Pessoal · Telegram</p>
      </div>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="flex items-center gap-3 rounded-md px-3 py-2 transition hover:bg-[var(--border)]"
        >
          <span aria-hidden>{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
