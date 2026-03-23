/** 메인 탭용 — 동일 스트로크·크기의 라인 아이콘 (이모지/기하 혼용 제거) */

const svgProps = {
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.65,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function TabIconDashboard() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

export function TabIconHandicap() {
  return (
    <svg {...svgProps}>
      <path d="M5.5 3v18" />
      <path d="M5.5 6.5L16 11L5.5 15.5" />
    </svg>
  );
}

export function TabIconRank() {
  return (
    <svg {...svgProps}>
      <path d="M4 19V11.5h5V19" />
      <path d="M9.5 19V8h5v11" />
      <path d="M15 19v-6h5v6" />
      <path d="M3 19h18" />
    </svg>
  );
}

export function TabIconRounds() {
  return (
    <svg {...svgProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10.5h17" />
      <path d="M8 3v4.5M16 3v4.5" />
      <circle cx="12" cy="15.25" r="1.15" />
    </svg>
  );
}
