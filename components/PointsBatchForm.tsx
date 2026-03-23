"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyPointEntries } from "@/app/admin/actions";

export type MemberOption = {
  id: string;
  label: string;
  points: number;
};

type Row = { lmId: string; delta: string; memo: string };

export function PointsBatchForm({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([
    { lmId: "", delta: "", memo: "" },
  ]);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  function addRow() {
    setRows((r) => [...r, { lmId: "", delta: "", memo: "" }]);
  }

  function removeRow(i: number) {
    setRows((r) => (r.length <= 1 ? r : r.filter((_, j) => j !== i)));
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const entries = rows
      .filter((row) => row.lmId && row.delta.trim() !== "")
      .map((row) => ({
        league_member_id: row.lmId,
        delta: Number(row.delta),
        memo: row.memo.trim() || undefined,
      }));
    if (entries.length === 0) {
      setMsg({
        type: "err",
        text: "회원을 선택하고 포인트(0 제외 정수)를 입력한 행이 필요합니다.",
      });
      return;
    }
    setPending(true);
    try {
      await applyPointEntries(entries);
      setMsg({ type: "ok", text: `${entries.length}건 반영되었습니다.` });
      setRows([{ lmId: "", delta: "", memo: "" }]);
      router.refresh();
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "저장에 실패했습니다.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs">
              <span className="text-neutral-500">이름 (리그 · 현재 포인트)</span>
              <select
                value={row.lmId}
                onChange={(e) => updateRow(i, { lmId: e.target.value })}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-white"
              >
                <option value="">선택…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex w-full flex-col gap-1 text-xs sm:w-28">
              <span className="text-neutral-500">포인트 (+/−)</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="예: 10 / -5"
                value={row.delta}
                onChange={(e) => updateRow(i, { delta: e.target.value })}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm tabular-nums"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs sm:min-w-[140px]">
              <span className="text-neutral-500">메모 (선택)</span>
              <input
                type="text"
                placeholder="사유 등"
                value={row.memo}
                onChange={(e) => updateRow(i, { memo: e.target.value })}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              행 삭제
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          + 행 추가
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "일괄 반영"}
        </button>
      </div>

      {msg && (
        <p
          className={
            msg.type === "ok" ? "text-sm text-emerald-400" : "text-sm text-red-400"
          }
        >
          {msg.text}
        </p>
      )}

      <p className="text-xs text-neutral-500">
        저장 시 각 행마다 <strong className="text-neutral-400">입력 관리자</strong>와{" "}
        <strong className="text-neutral-400">일시</strong>가 이력에 남고, 개인
        누적 포인트에 더해집니다. 마이너스(차감)도 가능합니다.
      </p>
    </form>
  );
}
