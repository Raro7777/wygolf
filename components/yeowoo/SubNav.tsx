import Link from "next/link";

export function SubNav() {
  return (
    <div className="yw-subnav">
      <span className="yw-subnav-label">더보기</span>
      <Link href="/notices">공지사항</Link>
      <span className="yw-subnav-dot" aria-hidden />
      <Link href="/admin" className="yw-admin-pill">
        관리자
      </Link>
    </div>
  );
}
