"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TabIconDashboard,
  TabIconHandicap,
  TabIconRank,
  TabIconRounds,
} from "@/components/yeowoo/TabIcons";

const tabs = [
  {
    href: "/",
    label: "대시보드",
    short: "대시보드",
    Icon: TabIconDashboard,
    key: "dash",
  },
  {
    href: "/handicap",
    label: "핸디 현황",
    short: "핸디",
    Icon: TabIconHandicap,
    key: "handy",
  },
  {
    href: "/rank",
    label: "포인트 순위",
    short: "순위",
    Icon: TabIconRank,
    key: "rank",
  },
  {
    href: "/rounds",
    label: "라운딩",
    short: "라운딩",
    Icon: TabIconRounds,
    key: "rounds",
  },
];

export function PageTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="yw-page-tabs yw-page-tabs--scroll"
      aria-label="메인 메뉴"
    >
      {tabs.map((t) => {
        const on =
          t.href === "/"
            ? pathname === "/"
            : pathname === t.href || pathname.startsWith(`${t.href}/`);
        const Icon = t.Icon;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`yw-ptb${on ? " on" : ""}`}
          >
            <span className="yw-ptb-ic" aria-hidden>
              <Icon />
            </span>
            <span className="yw-ptb-txt">
              <span className="yw-ptb-full">{t.label}</span>
              <span className="yw-ptb-short">{t.short}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
