import type { ReactElement } from 'react';
import { signIn } from '../../lib/auth';

export default function SignInPage(): ReactElement {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-96 rounded-lg border border-[var(--border)] bg-[#0a0c10] p-8 text-center">
        <h1 className="text-2xl font-semibold">Botfinanças</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Entre com sua conta Google para acessar o dashboard.
        </p>
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/dashboard' });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--border)]"
          >
            Entrar com Google
          </button>
        </form>
      </div>
    </div>
  );
}
