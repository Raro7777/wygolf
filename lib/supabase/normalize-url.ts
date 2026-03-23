/** Supabase 프로젝트 URL 정규화 (공백·끝 슬래시·스킴 누락) */
export function normalizeSupabaseUrl(raw: string | undefined | null): string | null {
  const t = raw?.trim();
  if (!t) return null;
  let u = t;
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  return u.replace(/\/+$/, "");
}
