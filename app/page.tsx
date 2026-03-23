import Link from "next/link";
import { PageBanner } from "@/components/yeowoo/PageBanner";
import { RankIndex } from "@/components/yeowoo/RankIndex";
import { RoundCardLink } from "@/components/yeowoo/RoundCardLink";
import { SectionTitle } from "@/components/yeowoo/SectionTitle";
import { SupabaseEnvMissing } from "@/components/yeowoo/SupabaseEnvMissing";
import { tryCreatePublicClient } from "@/lib/supabase/safe-public";
import { CLUB_ID } from "@/lib/constants";

type LmRow = {
  points: number | null;
  profiles: { display_name: string; club_id?: string } | null;
  leagues: { name: string } | null;
};

export default async function HomePage() {
  const supabase = tryCreatePublicClient();

  if (!supabase) {
    return <SupabaseEnvMissing />;
  }

  const { data: lmRaw, error: lmError } = await supabase
    .from("league_members")
    .select("points, profiles(display_name, club_id), leagues(name)");

  const pointsColumnMissing =
    lmError?.message?.includes("points") ||
    lmError?.message?.includes("column");

  const lmAll = (lmRaw ?? []) as unknown as LmRow[];
  const lm = lmAll.filter(
    (r) => (r.profiles?.club_id ?? CLUB_ID) === CLUB_ID
  );

  let yeogi = 0;
  let uri = 0;
  for (const r of lm) {
    const n = r.leagues?.name ?? "";
    if (n.includes("여기")) yeogi++;
    else if (n.includes("우리")) uri++;
  }

  const byPoints = [...lm].sort(
    (a, b) => (b.points ?? 0) - (a.points ?? 0)
  );
  const top3Safe = pointsColumnMissing ? [] : byPoints.slice(0, 3);

  const rankYeogi = byPoints
    .filter((r) => (r.leagues?.name ?? "").includes("여기"))
    .slice(0, 8);
  const rankUri = byPoints
    .filter((r) => (r.leagues?.name ?? "").includes("우리"))
    .slice(0, 8);

  const [
    { count: profileCount },
    { count: roundCount },
    { count: noticeCount },
    { count: photoCount },
    { data: recentRoundsRaw },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("club_id", CLUB_ID),
    supabase
      .from("rounds")
      .select("*", { count: "exact", head: true })
      .eq("club_id", CLUB_ID),
    supabase
      .from("notices")
      .select("*", { count: "exact", head: true })
      .eq("club_id", CLUB_ID),
    supabase
      .from("round_photos")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("rounds")
      .select("id, date, course_name, status")
      .eq("club_id", CLUB_ID)
      .order("date", { ascending: false })
      .limit(5),
  ]);

  const recentRounds = recentRoundsRaw ?? [];

  const stat = (label: string, value: number | string, icon: string) => (
    <div className="yw-msc" data-icon={icon}>
      <div className="yw-mv">{value}</div>
      <div className="yw-ml">{label}</div>
    </div>
  );

  const renderTop3 = (
    title: string,
    sub: string,
    iconClass: string,
    emoji: string,
    list: LmRow[],
    hint?: string
  ) => (
    <div className="yw-hl-card">
      <div className="yw-hl-head">
        <div className={`yw-hl-icon ${iconClass}`}>{emoji}</div>
        <div>
          <div className="yw-hl-title">{title}</div>
          <div className="yw-hl-sub">{sub}</div>
        </div>
      </div>
      <div>
        {hint ? (
          <div className="yw-empty-hint">{hint}</div>
        ) : list.length === 0 ? (
          <div className="yw-empty-hint">데이터가 없습니다.</div>
        ) : (
          list.map((r, i) => (
            <div key={i} className="yw-t3-item">
              <div className="yw-t3-rank">
                <RankIndex index={i} />
              </div>
              <div className="yw-t3-name">
                {r.profiles?.display_name ?? "—"}
                <div className="text-[10px] font-normal text-white/30">
                  {r.leagues?.name ?? ""}
                </div>
              </div>
              <div className="yw-t3-pt">{r.points ?? 0}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <SectionTitle
        eyebrow="Dashboard"
        title="대시보드"
        subtitle="회원·리그·라운드·공지·포인트 흐름을 한 화면에서 확인합니다."
      />

      {lmError && !pointsColumnMissing && (
        <PageBanner variant="error">
          <p>데이터 로드 오류: {lmError.message}</p>
          {/fetch|network|econn/i.test(lmError.message) && (
            <p className="yw-banner__hint">
              Supabase 서버에 HTTP 연결이 되지 않은 상태입니다. URL·공개 키가
              맞는지 확인하고, <code className="text-red-100">npm run dev</code>
              를 한 번 재시작해 보세요. (IPv6·회사망·방화벽 환경에서는 연결이
              불안정할 수 있습니다.)
            </p>
          )}
        </PageBanner>
      )}
      {pointsColumnMissing && (
        <PageBanner variant="warn">
          <code className="text-amber-50">league_members.points</code> 컬럼이
          없습니다. 로컬에서{" "}
          <code className="text-amber-50">npm run db:apply</code> 또는 SQL
          Editor에서 <code className="text-amber-50">supabase/schema.sql</code>·
          <code className="text-amber-50">migration_add_points.sql</code> 중
          해당 부분을 실행한 뒤 새로고침하세요.
        </PageBanner>
      )}

      <div className="yw-mini-stats">
        {stat("전체 회원", profileCount ?? 0, "👥")}
        {stat("여기리그", yeogi, "🟢")}
        {stat("우리리그", uri, "🔴")}
        {stat("라운드", roundCount ?? 0, "⛳")}
        {stat("공지", noticeCount ?? 0, "📣")}
        {stat("승인 사진", photoCount ?? 0, "📷")}
      </div>

      <div className="yw-hl-grid">
        {renderTop3("누적 TOP 3", "TOTAL POINTS", "yw-ic-gold", "🏅", top3Safe)}
        {renderTop3(
          "이번주 TOP 3",
          "THIS WEEK",
          "yw-ic-blue",
          "📅",
          [],
          "주간 집계는 포인트 이력(로그) 연동 후 표시 예정입니다. 지금은 누적 TOP 3을 참고하세요."
        )}
        {renderTop3(
          "변동성 TOP 3",
          "VOLATILITY",
          "yw-ic-purple",
          "⚡",
          [],
          "변동성 순위도 이력 데이터 연동 후 제공할 수 있습니다."
        )}
      </div>

      <div className="yw-rank-grid">
        <div className="yw-rank-card">
          <div className="yw-rank-head">
            <span className="yw-ldot yw-dg" />
            <span className="yw-cg">여기리그</span>
            <span className="yw-rank-meta">포인트 순</span>
          </div>
          {rankYeogi.length === 0 ? (
            <div className="yw-empty-hint">멤버가 없습니다.</div>
          ) : (
            rankYeogi.map((r, i) => (
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
        <div className="yw-rank-card">
          <div className="yw-rank-head">
            <span className="yw-ldot yw-dr" />
            <span className="yw-cr">우리리그</span>
            <span className="yw-rank-meta">포인트 순</span>
          </div>
          {rankUri.length === 0 ? (
            <div className="yw-empty-hint">멤버가 없습니다.</div>
          ) : (
            rankUri.map((r, i) => (
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
      </div>

      <section className="yw-subsection">
        <div className="yw-subsection__head">
          <h2 className="yw-subsection__title">최근 라운드</h2>
          <Link href="/rounds" className="yw-subsection__link">
            전체 보기 →
          </Link>
        </div>
        {recentRounds.length === 0 ? (
          <p className="yw-empty-hint py-2">등록된 라운드가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentRounds.map((r) => (
              <li key={r.id}>
                <RoundCardLink
                  href={`/rounds/${r.id}`}
                  courseName={r.course_name?.trim() || "라운드"}
                  whenLabel={new Date(r.date).toLocaleString("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  compact
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="yw-page-foot">
        <Link href="/handicap">핸디 현황</Link>
        <span className="yw-page-foot__sep">·</span>
        <Link href="/rank">포인트 순위</Link>
        <span className="yw-page-foot__sep">·</span>
        <Link href="/rounds">라운딩</Link>
      </p>
    </>
  );
}
