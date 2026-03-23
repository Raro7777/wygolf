import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseFetch } from "@/lib/supabase/fetch-node";
import { getSupabaseUrl } from "@/lib/supabase/supabase-url";

/** 서버 전용: Storage 업로드·비로그인 업로드 API 등 */
export function createServiceSupabase() {
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY(레거시) 또는 SUPABASE_SECRET_KEY(sb_secret_…)가 필요합니다."
    );
  }
  return createClient(url, key, {
    global: { fetch: supabaseFetch },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
