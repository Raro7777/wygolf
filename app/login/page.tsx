import Link from "next/link";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const sp = await searchParams;
  const redirectTo = sp.redirect ?? "/admin";
  const err = sp.error;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 text-white">
      <p className="mb-2 text-center text-[10px] uppercase tracking-[0.35em] text-white/35">
        Yeowoo Golf
      </p>
      <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight text-[var(--yw-gold)]">
        관리자 로그인
      </h1>
      {err === "auth" && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          이메일 또는 비밀번호가 올바르지 않습니다.
        </p>
      )}
      {err === "empty" && (
        <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          이메일과 비밀번호를 입력해 주세요.
        </p>
      )}
      <form action={signIn} className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirectTo} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">이메일</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">비밀번호</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-600"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500"
        >
          로그인
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-neutral-500">
        <Link href="/" className="underline hover:text-neutral-300">
          홈으로
        </Link>
      </p>
    </main>
  );
}
