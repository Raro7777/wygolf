import { addMember } from "@/app/admin/actions";
import { createServerSupabase } from "@/lib/supabase/server";
import { CLUB_ID } from "@/lib/constants";

export default async function AdminMembersPage() {
  const supabase = await createServerSupabase();
  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name")
    .eq("club_id", CLUB_ID)
    .order("name");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">회원 추가</h1>
      <p className="mt-2 text-sm text-neutral-400">
        명단에 사람을 추가하고 리그·핸디 정보를 넣습니다.
      </p>
      <form
        action={addMember}
        className="mt-8 max-w-lg flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">이름</span>
          <input
            name="display_name"
            required
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">성별 (선택)</span>
          <select
            name="gender"
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          >
            <option value="">—</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">리그</span>
          <select
            name="league_id"
            required
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          >
            <option value="">선택</option>
            {(leagues ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">번호 (NO)</span>
          <input
            name="sort_no"
            type="number"
            defaultValue={0}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">기준타수</span>
          <input
            name="base_score"
            type="number"
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">핸디</span>
          <input
            name="handicap"
            type="number"
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">포인트</span>
          <input
            name="points"
            type="number"
            defaultValue={0}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">비고</span>
          <input
            name="remarks"
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500"
        >
          추가
        </button>
      </form>
    </div>
  );
}
