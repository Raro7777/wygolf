import Link from "next/link";
import { CreateRoundForm } from "@/components/CreateRoundForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { CLUB_ID } from "@/lib/constants";

export default async function AdminRoundsPage() {
  const supabase = await createServerSupabase();
  const { data: rounds, error } = await supabase
    .from("rounds")
    .select("id, date, course_name, status")
    .eq("club_id", CLUB_ID)
    .order("date", { ascending: false });

  if (error) {
    return <p className="text-red-400">{error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-white">라운드</h1>
        <ul className="mt-6 flex flex-col gap-2">
          {(rounds ?? []).map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/rounds/${r.id}`}
                className="block rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3 hover:border-neutral-600"
              >
                <span className="font-medium">
                  {r.course_name || "라운드"}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {new Date(r.date).toLocaleString("ko-KR")} · {r.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {(!rounds || rounds.length === 0) && (
          <p className="mt-6 text-neutral-500">라운드가 없습니다.</p>
        )}
      </div>
      <div className="w-full shrink-0 lg:w-80">
        <CreateRoundForm />
      </div>
    </div>
  );
}
