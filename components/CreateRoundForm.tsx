"use client";

import { useActionState } from "react";
import { createRound, type CreateRoundState } from "@/app/admin/actions";

function baseUrl() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function CreateRoundForm() {
  const [state, formAction, pending] = useActionState<
    CreateRoundState,
    FormData
  >(createRound, null);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <h2 className="mb-3 text-sm font-medium text-neutral-300">새 라운드</h2>
      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">날짜·시간</span>
          <input
            type="datetime-local"
            name="date"
            required
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">코스명 (선택)</span>
          <input
            name="course_name"
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "만드는 중…" : "라운드 만들기"}
        </button>
      </form>
      {state?.ok === false && (
        <p className="mt-3 text-sm text-red-400">{state.error}</p>
      )}
      {state?.ok === true && (
        <div className="mt-4 rounded-lg border border-emerald-700/50 bg-emerald-950/30 p-3 text-sm">
          <p className="font-medium text-emerald-300">업로드 링크 (한 번만 복사해 두세요)</p>
          <p className="mt-2 break-all text-neutral-200">
            {`${baseUrl()}/r/${state.roundId}/upload?token=${encodeURIComponent(state.uploadToken)}`}
          </p>
          <button
            type="button"
            className="mt-2 text-xs text-emerald-400 underline"
            onClick={() => {
              void navigator.clipboard.writeText(
                `${baseUrl()}/r/${state.roundId}/upload?token=${encodeURIComponent(state.uploadToken)}`
              );
            }}
          >
            클립보드에 복사
          </button>
        </div>
      )}
    </div>
  );
}
