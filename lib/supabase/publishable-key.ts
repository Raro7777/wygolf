/**
 * 대시보드의 Publishable 키(sb_publishable_…) 또는 레거시 anon JWT.
 * 우선순위: PUBLISHABLE_DEFAULT → PUBLISHABLE_KEY → ANON_KEY
 */
export function getSupabaseBrowserKey(): string | undefined {
  const k =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return k || undefined;
}
