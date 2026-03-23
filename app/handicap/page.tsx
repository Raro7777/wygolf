import {
  HandicapInteractive,
  type HandicapRow,
} from "@/components/yeowoo/HandicapInteractive";
import { PageBanner } from "@/components/yeowoo/PageBanner";
import { SectionTitle } from "@/components/yeowoo/SectionTitle";
import { SupabaseEnvMissing } from "@/components/yeowoo/SupabaseEnvMissing";
import { tryCreatePublicClient } from "@/lib/supabase/safe-public";

export default async function HandicapPage() {
  const supabase = tryCreatePublicClient();
  if (!supabase) {
    return <SupabaseEnvMissing />;
  }

  const { data, error } = await supabase
    .from("league_members")
    .select(
      `
      id,
      sort_no,
      base_score,
      handicap,
      points,
      remarks,
      profiles (display_name, gender),
      leagues (name)
    `
    )
    .order("sort_no", { ascending: true });

  if (error) {
    const needMigration =
      error.message.includes("points") || error.message.includes("column");
    return (
      <>
        <SectionTitle
          eyebrow="Handicap"
          title="핸디 현황"
          subtitle="리그별 명단·기준타수·핸디·포인트·비고를 확인합니다."
        />
        <PageBanner variant="error">
          <p>불러오기 실패: {error.message}</p>
          {needMigration && (
            <p className="yw-banner__hint">
              <code className="text-red-100">supabase/migration_add_points.sql</code> 또는{" "}
              <code className="text-red-100">npm run db:apply</code> 후 다시 시도하세요.
            </p>
          )}
        </PageBanner>
      </>
    );
  }

  const rows: HandicapRow[] = (data ?? []).map((r) => {
    const row = r as unknown as HandicapRow & { points?: number };
    return {
      id: row.id,
      sort_no: row.sort_no,
      base_score: row.base_score,
      handicap: row.handicap,
      points: row.points ?? 0,
      remarks: row.remarks,
      profiles: row.profiles,
      leagues: row.leagues,
    };
  });

  return (
    <>
      <SectionTitle
        eyebrow="Handicap"
        title="핸디 현황"
        subtitle="리그별 명단·기준타수·핸디·포인트·비고를 확인합니다. 이름 검색과 리그 필터를 사용할 수 있습니다."
      />
      <HandicapInteractive rows={rows} />
    </>
  );
}
