import type { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import {
  confirmLink,
  LinkCodeInvalidError,
  LinkCodeExpiredError,
} from '../../../financial/link-account';
import { PageHeader } from '../../../components/ui/page-header';

async function linkAction(formData: FormData): Promise<void> {
  'use server';

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect('/signin');
  }

  const code = String(formData.get('code') ?? '').trim();
  if (!/^\d{6}$/.test(code)) {
    redirect('/dashboard/link?error=format');
  }

  // Pega o Account NextAuth (Google) do usuário logado
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
  });
  if (!account) {
    redirect('/dashboard/link?error=no_account');
  }

  try {
    await confirmLink(prisma, code, account.id);
  } catch (err) {
    if (err instanceof LinkCodeInvalidError) {
      redirect('/dashboard/link?error=invalid');
    }
    if (err instanceof LinkCodeExpiredError) {
      redirect('/dashboard/link?error=expired');
    }
    throw err;
  }

  redirect('/dashboard?linked=1');
}

const ERROR_MESSAGES: Record<string, string> = {
  format: 'Código deve ter 6 dígitos.',
  invalid: 'Código inválido. Confira no Telegram e tente de novo.',
  expired: 'Código expirado. Peça um novo no Telegram com /vincular.',
  no_account: 'Faça login com Google antes de vincular.',
};

export default async function LinkPage({
  searchParams,
}: {
  searchParams: { error?: string };
}): Promise<ReactElement> {
  const errorMsg = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <div className="max-w-md space-y-6">
      <PageHeader
        title="Vincular Telegram"
        subtitle="Digite o código de 6 dígitos que o bot enviou após o comando /vincular."
      />

      {errorMsg ? (
        <p className="rounded-md border border-[var(--negative)] px-3 py-2 text-sm text-[var(--negative)]">
          {errorMsg}
        </p>
      ) : null}

      <form action={linkAction} className="space-y-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--muted)]">Código</span>
          <input
            type="text"
            name="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="123456"
            className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 font-mono tracking-widest"
            required
          />
        </label>
        <button
          type="submit"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--border)]"
        >
          Vincular
        </button>
      </form>
    </div>
  );
}
