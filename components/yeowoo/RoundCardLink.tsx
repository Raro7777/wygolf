import Link from "next/link";

/** 대시보드·라운딩 목록 공통 카드 링크 */
export function RoundCardLink({
  href,
  courseName,
  whenLabel,
  status,
  compact,
}: {
  href: string;
  courseName: string;
  whenLabel: string;
  status?: string | null;
  /** 대시보드: 제목·일시 한 줄 */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link href={href} className="yw-round-card yw-round-card--compact">
        <span className="yw-round-card__title">{courseName.trim() || "라운드"}</span>
        <span className="yw-round-card__when">{whenLabel}</span>
      </Link>
    );
  }

  return (
    <Link href={href} className="yw-round-card">
      <span className="yw-round-card__title">
        {courseName.trim() || "라운드"}
      </span>
      <div className="yw-round-card__meta">
        <span>{whenLabel}</span>
        {status ? <span className="yw-pill">{status}</span> : null}
      </div>
    </Link>
  );
}
