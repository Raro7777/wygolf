import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createServerSupabase();
  const [{ count: pendingPhotos }, { count: rounds }] = await Promise.all([
    supabase
      .from("round_photos")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("rounds").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">대시보드</h1>
      <p className="mt-2 text-sm text-neutral-400">
        회원 추가, 핸디·포인트, 라운드·공지·사진 승인을 진행하세요.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <Link
            href="/admin/photos"
            className="block rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-amber-700/50"
          >
            <span className="font-medium text-amber-300">사진 승인 대기</span>
            <span className="mt-1 block text-2xl tabular-nums text-white">
              {pendingPhotos ?? 0}
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/rounds"
            className="block rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-emerald-700/50"
          >
            <span className="font-medium text-emerald-300">라운드 수</span>
            <span className="mt-1 block text-2xl tabular-nums text-white">
              {rounds ?? 0}
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/points"
            className="block rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-cyan-700/50"
          >
            <span className="font-medium text-cyan-300">포인트 입력</span>
            <span className="mt-1 block text-sm text-neutral-400">
              일괄 가감 · 이력
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
