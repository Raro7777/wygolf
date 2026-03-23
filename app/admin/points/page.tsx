import { PointsBatchForm } from "@/components/PointsBatchForm";
import { CLUB_ID } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

type LmRow = {
  id: string;
  points: number | null;
  profiles: { display_name: string; club_id?: string } | null;
  leagues: { name: string } | null;
};

type LedgerRow = {
  id: string;
  delta: number;
  memo: string | null;
  created_at: string;
  league_member_id: string;
  created_by: string;
};

export default async function AdminPointsPage() {
  const supabase = await createServerSupabase();

  const { data: lmRaw, error: lmError } = await supabase
    .from("league_members")
    .select(
      "id, points, profiles(display_name, club_id), leagues(name)"
    )
    .order("sort_no", { ascending: true });

  if (lmError) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-white">포인트 입력</h1>
        <p className="mt-2 text-red-400">{lmError.message}</p>
      </div>
    );
  }

  const lmAll = (lmRaw ?? []) as unknown as LmRow[];
  const members = lmAll
    .filter((r) => (r.profiles?.club_id ?? CLUB_ID) === CLUB_ID)
    .map((r) => {
      const league = r.leagues?.name ?? "리그";
      const name = r.profiles?.display_name ?? "—";
      const pts = r.points ?? 0;
      return {
        id: r.id,
        label: `${league} · ${name} (현재 ${pts}점)`,
        points: pts,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));

  let ledger: LedgerRow[] = [];
  let ledgerError: string | null = null;

  const { data: ledgerData, error: leErr } = await supabase
    .from("point_ledger")
    .select("id, delta, memo, created_at, league_member_id, created_by")
    .order("created_at", { ascending: false })
    .limit(120);

  if (leErr) {
    if (
      leErr.message.includes("point_ledger") ||
      leErr.message.includes("schema cache") ||
      leErr.code === "42P01"
    ) {
      ledgerError =
        "point_ledger 테이블이 없습니다. Supabase SQL Editor에서 supabase/migration_point_ledger.sql 을 실행하거나 npm run db:apply 로 스키마를 갱신하세요.";
    } else {
      ledgerError = leErr.message;
    }
  } else {
    ledger = (ledgerData ?? []) as LedgerRow[];
  }

  const lmLabel = new Map(members.map((m) => [m.id, m.label]));
  const adminIds = [...new Set(ledger.map((l) => l.created_by))];
  let adminNames = new Map<string, string>();

  if (adminIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", adminIds);
    for (const p of profs ?? []) {
      adminNames.set(p.id as string, (p as { display_name: string }).display_name);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">포인트 입력</h1>
      <p className="mt-2 text-sm text-neutral-400">
        여러 명을 한 번에 선택해 가감 포인트를 넣습니다. 저장 시{" "}
        <strong className="text-neutral-300">입력 관리자</strong>와{" "}
        <strong className="text-neutral-300">날짜·시간</strong>이 이력에 남고,
        공개 순위·핸디 화면의 누적 포인트에 반영됩니다.
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-emerald-400/90">일괄 입력</h2>
        <div className="mt-4">
          <PointsBatchForm members={members} />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium text-emerald-400/90">최근 입력 이력</h2>
        {ledgerError ? (
          <p className="mt-3 text-sm text-amber-400">{ledgerError}</p>
        ) : ledger.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">아직 기록이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-800">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-900/80 text-xs text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">일시</th>
                  <th className="px-3 py-2 font-medium">대상</th>
                  <th className="px-3 py-2 font-medium">가감</th>
                  <th className="px-3 py-2 font-medium">메모</th>
                  <th className="px-3 py-2 font-medium">입력 관리자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {ledger.map((row) => (
                  <tr key={row.id} className="bg-neutral-950/40">
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-neutral-300">
                      {new Date(row.created_at).toLocaleString("ko-KR", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>
                    <td className="px-3 py-2 text-neutral-200">
                      {lmLabel.get(row.league_member_id) ?? row.league_member_id}
                    </td>
                    <td
                      className={`px-3 py-2 font-mono tabular-nums ${
                        row.delta >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {row.delta >= 0 ? `+${row.delta}` : row.delta}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-neutral-500">
                      {row.memo ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-neutral-400">
                      {adminNames.get(row.created_by) ?? row.created_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-8 text-sm text-neutral-600">
        핸디 화면에서 직접 점수를 덮어쓰는 것과 달리, 이 페이지는{" "}
        <Link href="/rank" className="text-emerald-500 hover:underline">
          누적 포인트
        </Link>
        에 <strong className="text-neutral-500">더하기</strong>만 합니다.
      </p>
    </div>
  );
}
