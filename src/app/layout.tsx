import type { Metadata } from 'next';
import { Navigation } from '../components/navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Botfinancas',
  description: 'Bot pessoal de finanças via Telegram',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="pt-BR">
      <body className="flex h-screen overflow-hidden">
        <Navigation />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </body>
    </html>
  );
}
