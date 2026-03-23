import { normalizeSupabaseUrl } from "@/lib/supabase/normalize-url";

/**
 * Supabase 프로젝트 URL.
 * Turbopack이 `NEXT_PUBLIC_SUPABASE_URL`을 플레이스홀더로 치환하는 경우가 있어,
 * `next.config`의 `env.SUPABASE_URL`(실제 값 주입)을 우선합니다.
 */
export function getSupabaseUrl(): string | null {
  const fromConfig = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  if (fromConfig) return fromConfig;
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}
