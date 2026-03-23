import Link from "next/link";
import { notFound } from "next/navigation";
import { tryCreatePublicClient } from "@/lib/supabase/safe-public";

export default async function RoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = tryCreatePublicClient();
  if (!supabase) notFound();

  const { data: round, error: re } = await supabase
    .from("rounds")
    .select("id, date, course_name, status")
    .eq("id", id)
    .single();
  if (re || !round) notFound();

  const { data: parts } = await supabase
    .from("round_participants")
    .select("profiles (display_name)")
    .eq("round_id", id);

  const { data: scores } = await supabase
    .from("scores")
    .select("gross, net_optional, profiles (display_name)")
    .eq("round_id", id);

  const { data: photos } = await supabase
    .from("round_photos")
    .select("id, caption")
    .eq("round_id", id)
    .eq("status", "approved");

  return (
    <div className="max-w-3xl">
      <Link href="/rounds" className="yw-back-link">
        ← 라운딩 목록
      </Link>
      <h1
        className="text-2xl font-normal tracking-[0.08em] text-white md:text-3xl"
        style={{ fontFamily: "var(--font-black-han-sans), sans-serif" }}
      >
        {round.course_name || "라운드"}
      </h1>
      <p className="mt-3 text-sm text-white/45">
        {new Date(round.date).toLocaleString("ko-KR", {
          dateStyle: "full",
          timeStyle: "short",
        })}
        <span className="mx-2 text-white/25">·</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">
          {round.status}
        </span>
      </p>

      <section className="yw-panel">
        <h2 className="yw-panel-title">참석</h2>
        <ul className="space-y-2 text-sm text-white/80">
          {(parts ?? []).map((p, i) => (
            <li
              key={i}
              className="flex items-center gap-2 border-b border-white/5 pb-2 last:border-0"
            >
              <span className="text-[var(--yw-gold)]">●</span>
              {(p.profiles as { display_name?: string } | null)?.display_name ??
                "—"}
            </li>
          ))}
        </ul>
        {(!parts || parts.length === 0) && (
          <p className="text-sm text-white/35">참석자 없음</p>
        )}
      </section>

      <section className="yw-panel">
        <h2 className="yw-panel-title">스코어</h2>
        <div className="yw-tbl-wrap overflow-x-auto">
          <table className="yw-table min-w-[280px]">
            <thead>
              <tr>
                <th>이름</th>
                <th>Gross</th>
              </tr>
            </thead>
            <tbody>
              {(scores ?? []).map((s, i) => (
                <tr key={i}>
                  <td className="yw-td-nc text-left">
                    {(s.profiles as { display_name?: string } | null)
                      ?.display_name ?? "—"}
                  </td>
                  <td className="tabular-nums">{s.gross}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!scores || scores.length === 0) && (
          <p className="mt-2 text-sm text-white/35">스코어 없음</p>
        )}
      </section>

      <section className="yw-panel">
        <h2 className="yw-panel-title">사진</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(photos ?? []).map((ph) => (
            <figure
              key={ph.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-black/20 shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photos/${ph.id}`}
                alt={ph.caption ?? ""}
                className="aspect-square w-full object-cover"
              />
              {ph.caption && (
                <figcaption className="p-2 text-[11px] text-white/45">
                  {ph.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        {(!photos || photos.length === 0) && (
          <p className="text-sm text-white/35">승인된 사진 없음</p>
        )}
      </section>
    </div>
  );
}
