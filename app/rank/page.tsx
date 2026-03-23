import type { ReactNode } from "react";
import Link from "next/link";
import { PageBanner } from "@/components/yeowoo/PageBanner";
import { RankIndex } from "@/components/yeowoo/RankIndex";
import { SectionTitle } from "@/components/yeowoo/SectionTitle";
import { SupabaseEnvMissing } from "@/components/yeowoo/SupabaseEnvMissing";
import { tryCreatePublicClient } from "@/lib/supabase/safe-public";
import { CLUB_ID } from "@/lib/constants";

type LmRow = {
  points: number | null;
  profiles: { display_name: string; club_id?: string } | null;
  leagues: { name: string } | null;
};

type LedgerEmbed = {
  id: string;
  delta: number;
  memo: string | null;
  created_at: string;
  league_members: {
    profiles: { display_name: string; club_id?: string } | null;
    leagues: { name: string } | null;
  } | null;
  admin_profile: { display_name: string } | null;
};

export default async function RankPage() {
  const supabase = tryCreatePublicClient();
  if (!supabase) {
    return <SupabaseEnvMissing />;
  }

  const [lmRes, ledgerRes] = await Promise.all([
    supabase
      .from("league_members")
      .select("points, profiles(display_name, club_id), leagues(name)"),
    supabase
      .from("point_ledger")
      .select(
        `
        id,
        delta,
        memo,
        created_at,
        league_members (
          profiles ( display_name, club_id ),
          leagues ( name )
        ),
        admin_profile:profiles!point_ledger_created_by_fkey ( display_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const { data, error } = lmRes;

  if (error) {
    const needMigration =
      error.message.includes("points") || error.message.includes("column");
    return (
      <>
        <SectionTitle
          eyebrow="Points ranking"
          title="포인트 순위"
          subtitle="리그별 누적 포인트 순위입니다."
        />
        <PageBanner variant="error">
          <p>{error.message}</p>
          {needMigration && (
            <p className="yw-banner__hint">
              <code className="text-red-100">migration_add_points.sql</code> 또는{" "}
              <code className="text-red-100">npm run db:apply</code> 후 다시 시도하세요.
            </p>
          )}
        </PageBanner>
      </>
    );
  }

  const lm = ((data ?? []) as unknown as LmRow[]).filter(
    (r) => (r.profiles?.club_id ?? CLUB_ID) === CLUB_ID
  );

  const yeogi = lm
    .filter((r) => (r.leagues?.name ?? "").includes("여기"))
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const uri = lm
    .filter((r) => (r.leagues?.name ?? "").includes("우리"))
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  let ledgerSection: ReactNode;
  if (ledgerRes.error) {
    const msg = ledgerRes.error.message;
    const missing =
      msg.includes("point_ledger") ||
      msg.includes("schema cache") ||
      msg.includes("Could not find the table") ||
      ledgerRes.error.code === "42P01";
    ledgerSection = (
      <section className="yw-subsection mt-8">
        <h2 className="yw-subsection__title">포인트 입력 내역</h2>
        {missing ? (
          <p className="yw-empty-hint text-left">
            이력 테이블이 아직 없습니다. 관리자가{" "}
            <code className="text-amber-200/90">migration_point_ledger.sql</code>{" "}
            을 적용하면 여기에 표시됩니다.
          </p>
        ) : (
          <PageBanner variant="error">
            <p>{msg}</p>
            {/permission|policy|42501/i.test(msg) && (
              <p className="yw-banner__hint mt-2">
                Supabase에서{" "}
                <code className="text-red-100">
                  migration_point_ledger_public_select.sql
                </code>{" "}
                를 실행해 공개 조회를 허용하세요.
              </p>
            )}
          </PageBanner>
        )}
      </section>
    );
  } else {
    const raw = (ledgerRes.data ?? []) as unknown as LedgerEmbed[];
    const ledgerFiltered = raw.filter((row) => {
      const p = row.league_members?.profiles;
      if (!row.league_members) return false;
      return (p?.club_id ?? CLUB_ID) === CLUB_ID;
    });

    ledgerSection = (
      <section className="yw-subsection mt-10">
        <div className="yw-subsection__head">
          <h2 className="yw-subsection__title">포인트 입력 내역</h2>
          <Link href="/admin/points" className="yw-subsection__link">
            관리자 입력 →
          </Link>
        </div>
        <p className="text-xs text-white/35">
          관리자가 일괄 입력한 가감 내역입니다. (입력자·일시 기록)
        </p>
        {ledgerFiltered.length === 0 ? (
          <p className="yw-empty-hint mt-3 text-left">
            아직 등록된 입력 내역이 없습니다.
          </p>
        ) : (
          <div className="yw-tbl-wrap mt-4 overflow-x-auto">
            <table className="yw-table min-w-[640px]">
              <thead>
                <tr>
                  <th>일시</th>
                  <th>대상</th>
                  <th>가감</th>
                  <th>메모</th>
                  <th>입력</th>
                </tr>
              </thead>
              <tbody>
                {ledgerFiltered.map((row) => {
                  const league = row.league_members?.leagues?.name ?? "";
                  const name =
                    row.league_members?.profiles?.display_name ?? "—";
                  return (
                    <tr key={row.id}>
                      <td className="tabular-nums text-white/70">
                        {new Date(row.created_at).toLocaleString("ko-KR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="yw-td-nc">
                        <span className="yw-name-txt">{name}</span>
                        <span className="ml-1 text-[10px] text-white/35">
                          {league}
                        </span>
                      </td>
                      <td
                        className={`font-[family-name:var(--font-black-han-sans)] tabular-nums ${
                          row.delta >= 0 ? "text-[var(--yw-gold)]" : "text-red-300"
                        }`}
                      >
                        {row.delta >= 0 ? `+${row.delta}` : row.delta}
                      </td>
                      <td className="max-w-[180px] truncate text-left text-xs text-white/40">
                        {row.memo ?? "—"}
                      </td>
                      <td className="text-xs text-white/45">
                        {row.admin_profile?.display_name ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  const card = (
    title: string,
    dotClass: string,
    titleClass: string,
    list: LmRow[]
  ) => (
    <div className="yw-rank-card">
      <div className="yw-rank-head">
        <span className={`yw-ldot ${dotClass}`} />
        <span className={titleClass}>{title}</span>
        <span className="yw-rank-meta">높은 순</span>
      </div>
      {list.length === 0 ? (
        <div className="yw-empty-hint">멤버가 없습니다.</div>
      ) : (
        list.map((r, i) => (
          <div key={i} className="yw-rank-item">
            <RankIndex index={i} />
            <span className="yw-ri-name">
              {r.profiles?.display_name ?? "—"}
            </span>
            <span className="yw-ri-pt">{r.points ?? 0}</span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <SectionTitle
        eyebrow="Points ranking"
        title="포인트 순위"
        subtitle="리그별 누적 포인트 순위입니다. 가감 내역은 관리자 포인트 입력에서 기록되며, 아래에서 확인할 수 있습니다."
      />
      <div className="yw-rank-grid">
        {card("여기리그", "yw-dg", "yw-cg", yeogi)}
        {card("우리리그", "yw-dr", "yw-cr", uri)}
      </div>
      {ledgerSection}
    </>
  );
}
