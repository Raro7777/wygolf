import Link from "next/link";
import { PageBanner } from "@/components/yeowoo/PageBanner";
import { SectionTitle } from "@/components/yeowoo/SectionTitle";
import { SupabaseEnvMissing } from "@/components/yeowoo/SupabaseEnvMissing";
import { tryCreatePublicClient } from "@/lib/supabase/safe-public";

export default async function NoticesPage() {
  const supabase = tryCreatePublicClient();
  if (!supabase) {
    return <SupabaseEnvMissing />;
  }

  const { data, error } = await supabase
    .from("notices")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <>
        <SectionTitle
          eyebrow="Notice"
          title="공지사항"
          subtitle="동호회 운영·핸디·라운딩 관련 안내를 확인합니다."
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
        eyebrow="Notice"
        title="공지사항"
        subtitle="동호회 운영·핸디·라운딩 관련 안내를 확인합니다."
      />
      <ul className="flex flex-col gap-3">
        {rows.map((n) => (
          <li key={n.id}>
            <Link href={`/notices/${n.id}`} className="yw-round-card">
              <span className="yw-round-card__title yw-round-card__title--gold">
                {n.title}
              </span>
              <div className="yw-round-card__meta">
                <span>
                  {n.created_at
                    ? new Date(n.created_at).toLocaleString("ko-KR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="yw-empty-hint">등록된 공지가 없습니다.</p>
      )}
    </>
  );
}
