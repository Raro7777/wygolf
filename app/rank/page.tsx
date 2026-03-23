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

export default async function RankPage() {
  const supabase = tryCreatePublicClient();
  if (!supabase) {
    return <SupabaseEnvMissing />;
  }

  const { data, error } = await supabase
    .from("league_members")
    .select("points, profiles(display_name, club_id), leagues(name)");

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
        subtitle="리그별 누적 포인트가 높은 순입니다. 점수는 관리자 화면의 핸디 편집에서 조정할 수 있습니다."
      />
      <div className="yw-rank-grid">
        {card("여기리그", "yw-dg", "yw-cg", yeogi)}
        {card("우리리그", "yw-dr", "yw-cr", uri)}
      </div>
    </>
  );
}
