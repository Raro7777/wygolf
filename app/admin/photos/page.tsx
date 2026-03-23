import Link from "next/link";
import {
  approvePhotoForm,
  deletePhotoForm,
  rejectPhotoForm,
} from "@/app/admin/actions";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AdminPhotosPage() {
  const supabase = await createServerSupabase();
  const { data: photos, error } = await supabase
    .from("round_photos")
    .select(
      `
      id,
      status,
      caption,
      uploader_label,
      created_at,
      rounds (id, course_name, date)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-red-400">{error.message}</p>;
  }

  const list = photos ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">사진 승인</h1>
      <p className="mt-2 text-sm text-neutral-400">
        대기 중인 사진을 승인하면 공개 라운드 페이지에 표시됩니다.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((ph) => {
          const r = ph.rounds as unknown as {
            id: string;
            course_name: string | null;
            date: string;
          } | null;
          return (
            <div
              key={ph.id}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photos/${ph.id}`}
                alt=""
                className="aspect-video w-full bg-neutral-900 object-contain"
              />
              <div className="space-y-1 p-3 text-xs text-neutral-400">
                <div>
                  상태:{" "}
                  <span
                    className={
                      ph.status === "approved"
                        ? "text-emerald-400"
                        : ph.status === "rejected"
                          ? "text-red-400"
                          : "text-amber-300"
                    }
                  >
                    {ph.status}
                  </span>
                </div>
                {r && (
                  <Link
                    href={`/admin/rounds/${r.id}`}
                    className="block text-emerald-400 hover:underline"
                  >
                    {r.course_name || "라운드"} ·{" "}
                    {new Date(r.date).toLocaleDateString("ko-KR")}
                  </Link>
                )}
                {ph.uploader_label && <div>올린 사람: {ph.uploader_label}</div>}
                {ph.caption && <div>메모: {ph.caption}</div>}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-neutral-800 p-3">
                {ph.status === "pending" && (
                  <>
                    <form action={approvePhotoForm}>
                      <input type="hidden" name="id" value={ph.id} />
                      <button
                        type="submit"
                        className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white"
                      >
                        승인
                      </button>
                    </form>
                    <form action={rejectPhotoForm}>
                      <input type="hidden" name="id" value={ph.id} />
                      <button
                        type="submit"
                        className="rounded bg-amber-800 px-3 py-1.5 text-sm text-white"
                      >
                        거절
                      </button>
                    </form>
                  </>
                )}
                <form action={deletePhotoForm}>
                  <input type="hidden" name="id" value={ph.id} />
                  <button
                    type="submit"
                    className="rounded bg-red-900/60 px-3 py-1.5 text-sm text-red-200"
                  >
                    삭제
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
      {list.length === 0 && (
        <p className="mt-8 text-neutral-500">사진이 없습니다.</p>
      )}
    </div>
  );
}
