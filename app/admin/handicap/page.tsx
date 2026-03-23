import { updateLeagueMember } from "@/app/admin/actions";
import { createServerSupabase } from "@/lib/supabase/server";

type Row = {
  id: string;
  sort_no: number;
  base_score: number | null;
  handicap: number | null;
  points: number | null;
  remarks: string | null;
  profiles: { display_name: string } | null;
  leagues: { name: string } | null;
};

export default async function AdminHandicapPage() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("league_members")
    .select(
      `
      id,
      sort_no,
      base_score,
      handicap,
      points,
      remarks,
      profiles (display_name),
      leagues (name)
    `
    )
    .order("sort_no", { ascending: true });

  if (error) {
    return <p className="text-red-400">{error.message}</p>;
  }

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">핸디 편집</h1>
      <p className="mt-2 text-sm text-neutral-400">
        각 행을 저장하면 공개 핸디 현황에 반영됩니다.
      </p>
      <div className="mt-8 space-y-6">
        {rows.map((r) => (
          <form
            key={r.id}
            action={updateLeagueMember}
            className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4"
          >
            <input type="hidden" name="id" value={r.id} />
            <div className="mb-3 text-sm font-medium text-emerald-400">
              {r.leagues?.name ?? "리그"} · {r.profiles?.display_name ?? "—"}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-neutral-500">NO</span>
                <input
                  name="sort_no"
                  type="number"
                  defaultValue={r.sort_no}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-neutral-500">기준타수</span>
                <input
                  name="base_score"
                  type="number"
                  defaultValue={r.base_score ?? ""}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-neutral-500">핸디</span>
                <input
                  name="handicap"
                  type="number"
                  defaultValue={r.handicap ?? ""}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-neutral-500">포인트</span>
                <input
                  name="points"
                  type="number"
                  defaultValue={r.points ?? 0}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs sm:col-span-2 lg:col-span-1">
                <span className="text-neutral-500">비고</span>
                <input
                  name="remarks"
                  defaultValue={r.remarks ?? ""}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-3 rounded bg-neutral-700 px-3 py-1.5 text-sm text-white hover:bg-neutral-600"
            >
              저장
            </button>
          </form>
        ))}
        {rows.length === 0 && (
          <p className="text-neutral-500">
            회원이 없습니다. 회원 추가에서 먼저 등록하세요.
          </p>
        )}
      </div>
    </div>
  );
}
