import Link from "next/link";
import { notFound } from "next/navigation";
import { tryCreatePublicClient } from "@/lib/supabase/safe-public";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = tryCreatePublicClient();
  if (!supabase) notFound();

  const { data, error } = await supabase
    .from("notices")
    .select("id, title, body, created_at")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/notices" className="yw-back-link">
        ← 공지 목록
      </Link>
      <h1
        className="text-xl font-normal tracking-wide text-[var(--yw-gold)] md:text-2xl"
        style={{ fontFamily: "var(--font-black-han-sans), sans-serif" }}
      >
        {data.title}
      </h1>
      <p className="mt-3 text-xs text-white/40">
        {data.created_at
          ? new Date(data.created_at).toLocaleString("ko-KR", {
              dateStyle: "long",
              timeStyle: "short",
            })
          : ""}
      </p>
      <article className="yw-panel mt-6 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
        {data.body}
      </article>
    </div>
  );
}
