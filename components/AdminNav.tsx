import Link from "next/link";
import { signOut } from "@/app/login/actions";

const links = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/members", label: "회원 추가" },
  { href: "/admin/handicap", label: "핸디 편집" },
  { href: "/admin/rounds", label: "라운드" },
  { href: "/admin/notices", label: "공지" },
  { href: "/admin/photos", label: "사진 승인" },
];

export function AdminNav() {
  return (
    <aside className="w-full shrink-0 border-b border-neutral-800 bg-neutral-950 p-4 md:w-52 md:border-b-0 md:border-r">
      <div className="mb-4 font-semibold text-emerald-400">관리자</div>
      <nav className="flex flex-row flex-wrap gap-2 md:flex-col md:gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md px-2 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="text-sm text-neutral-500 underline hover:text-neutral-300"
        >
          로그아웃
        </button>
      </form>
      <Link
        href="/"
        className="mt-4 block text-sm text-neutral-500 hover:text-neutral-300"
      >
        공개 사이트
      </Link>
    </aside>
  );
}
