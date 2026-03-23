import Link from "next/link";
import { notFound } from "next/navigation";
import {
  setRoundParticipantsForm,
  upsertScore,
} from "@/app/admin/actions";
import { RegenerateTokenButton } from "@/components/RegenerateTokenButton";
import { createServerSupabase } from "@/lib/supabase/server";
import { CLUB_ID } from "@/lib/constants";

export default async function AdminRoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: round, error: re } = await supabase
    .from("rounds")
    .select("id, date, course_name, status")
    .eq("id", id)
    .single();
  if (re || !round) notFound();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("club_id", CLUB_ID)
    .order("display_name");

  const { data: parts } = await supabase
    .from("round_participants")
    .select("profile_id")
    .eq("round_id", id);
  const selected = new Set((parts ?? []).map((p) => p.profile_id));

  const { data: scores } = await supabase
    .from("scores")
    .select("profile_id, gross")
    .eq("round_id", id);
  const scoreByProfile = new Map(
    (scores ?? []).map((s) => [s.profile_id, s.gross])
  );

  return (
    <div>
      <Link
        href="/admin/rounds"
        className="text-sm text-neutral-500 hover:text-neutral-300"
      >
        ← 라운드 목록
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">
        {round.course_name || "라운드"}
      </h1>
      <p className="mt-2 text-sm text-neutral-400">
        {new Date(round.date).toLocaleString("ko-KR")} · {round.status}
      </p>

      <div className="mt-6">
        <RegenerateTokenButton roundId={id} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-emerald-400">참석 명단</h2>
        <form
          action={setRoundParticipantsForm}
          className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-neutral-800 p-3"
        >
          <input type="hidden" name="round_id" value={id} />
          <ul className="flex flex-col gap-2 text-sm">
            {(profiles ?? []).map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name="profile_id"
                    value={p.id}
                    defaultChecked={selected.has(p.id)}
                  />
                  {p.display_name}
                </label>
              </li>
            ))}
          </ul>
          <button
            type="submit"
            className="mt-4 rounded bg-emerald-600 px-3 py-1.5 text-sm text-white"
          >
            참석 저장
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-emerald-400">스코어 입력</h2>
        <div className="mt-3 space-y-4">
          {(profiles ?? [])
            .filter((p) => selected.has(p.id))
            .map((p) => (
              <form
                key={p.id}
                action={upsertScore}
                className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-800 p-3"
              >
                <input type="hidden" name="round_id" value={id} />
                <input type="hidden" name="profile_id" value={p.id} />
                <span className="min-w-[6rem] text-sm">{p.display_name}</span>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-neutral-500">Gross</span>
                  <input
                    name="gross"
                    type="number"
                    required
                    defaultValue={scoreByProfile.get(p.id) ?? ""}
                    className="w-24 rounded border border-neutral-700 bg-neutral-950 px-2 py-1"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded bg-neutral-700 px-2 py-1 text-sm text-white"
                >
                  저장
                </button>
              </form>
            ))}
          {selected.size === 0 && (
            <p className="text-sm text-neutral-500">
              참석자를 먼저 저장하면 스코어를 입력할 수 있습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
