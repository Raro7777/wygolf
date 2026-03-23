"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "./PageHeader";
import { PageTabs } from "./PageTabs";
import { SubNav } from "./SubNav";

export function YeowooShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/r/");

  if (bare) {
    return <div className="relative z-[1] min-h-[60vh] flex-1">{children}</div>;
  }

  return (
    <div className="yw-wrap relative z-[1] flex-1">
      <PageHeader />
      <PageTabs />
      <SubNav />
      <main className="yw-page-main">{children}</main>
    </div>
  );
}
