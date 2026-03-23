import { createNotice, deleteNotice } from "@/app/admin/actions";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AdminNoticesPage() {
  const supabase = await createServerSupabase();
  const { data: notices, error } = await supabase
    .from("notices")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-red-400">{error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-white">공지</h1>
        <ul className="mt-6 space-y-2">
          {(notices ?? []).map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3"
            >
              <div>
                <span className="font-medium">{n.title}</span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {n.created_at
                    ? new Date(n.created_at).toLocaleString("ko-KR")
                    : ""}
                </span>
              </div>
              <form action={deleteNotice}>
                <input type="hidden" name="id" value={n.id} />
                <button
                  type="submit"
                  className="text-sm text-red-400 hover:underline"
                >
                  삭제
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full shrink-0 lg:w-96">
        <h2 className="text-lg font-medium text-white">새 공지</h2>
        <form
          action={createNotice}
          className="mt-4 flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">제목</span>
            <input
              name="title"
              required
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">본문</span>
            <textarea
              name="body"
              required
              rows={8}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 py-2 font-medium text-white"
          >
            등록
          </button>
        </form>
      </div>
    </div>
  );
}
