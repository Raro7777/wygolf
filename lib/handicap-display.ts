/** 핸디 바 색 구간 (프로토타입과 동일) */
export function handicapBandClass(h: number | null): "yw-hcl" | "yw-hcm" | "yw-hch" {
  if (h == null) return "yw-hcm";
  if (h <= 12) return "yw-hcl";
  if (h <= 22) return "yw-hcm";
  return "yw-hch";
}

export function handicapBarWidth(h: number | null): number {
  if (h == null) return 30;
  return Math.min(100, Math.max(8, (h / 40) * 100));
}

export function remarkBadges(remarks: string | null): { pro?: boolean; readj?: boolean } {
  if (!remarks) return {};
  return {
    pro: remarks.includes("프로"),
    readj: remarks.includes("재조정") || remarks.includes("정라"),
  };
}
