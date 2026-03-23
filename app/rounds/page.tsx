import Link from "next/link";
import { PageBanner } from "@/components/yeowoo/PageBanner";
import { RoundCardLink } from "@/components/yeowoo/RoundCardLink";
import { SectionTitle } from "@/components/yeowoo/SectionTitle";
import { SupabaseEnvMissing } from "@/components/yeowoo/SupabaseEnvMissing";
import { tryCreatePublicClient } from "@/lib/supabase/safe-public";

export default async function RoundsPage() {
  const supabase = tryCreatePublicClient();
  if (!supabase) {
    return <SupabaseEnvMissing />;
  }

  const { data, error } = await supabase
    .from("rounds")
    .select("id, date, course_name, status")
    .order("date", { ascending: false });

  if (error) {
    return (
      <>
        <SectionTitle
          eyebrow="Rounding"
          title="라운딩"
          subtitle="일정·코스·참석·스코어·승인된 사진을 라운드별로 모읍니다."
        />
        <PageBanner variant="error">
          <p>{error.message}</p>
        </PageBanner>
      </>
    );
  }

  const rows = data ?? [];

  return (
    <>
      <SectionTitle
        eyebrow="Rounding"
        title="라운딩"
        subtitle="일정·코스·참석·스코어·승인된 사진을 라운드별로 모아 둡니다. 관리자가 공유한 링크로 사진을 올릴 수 있습니다."
      />
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.id}>
            <RoundCardLink
              href={`/rounds/${r.id}`}
              courseName={r.course_name || "라운드"}
              whenLabel={new Date(r.date).toLocaleString("ko-KR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              status={r.status}
            />
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="yw-empty-hint">
          등록된 라운드가 없습니다.
          <br />
          관리자에서 라운드를 만들면 여기에 표시됩니다.
        </p>
      )}
      <p className="yw-page-foot">
        공지는 상단 <Link href="/notices">공지사항</Link>에서 확인하세요.
      </p>
    </>
  );
}
