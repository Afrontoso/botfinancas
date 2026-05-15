import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Botfinancas",
  description: "Bot pessoal de finanças via Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
