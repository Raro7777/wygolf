import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseFetch } from "@/lib/supabase/fetch-node";
import { getSupabaseBrowserKey } from "@/lib/supabase/publishable-key";
import { getSupabaseUrl } from "@/lib/supabase/supabase-url";

export function createPublicClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseBrowserKey();
  if (!url || !key) {
    throw new Error(
      "Supabase URL(SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL)과 공개 키(PUBLISHABLE_* 또는 ANON_KEY)가 필요합니다."
    );
  }
  return createClient(url, key, {
    global: { fetch: supabaseFetch },
  });
}
