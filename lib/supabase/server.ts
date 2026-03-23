import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseFetch } from "@/lib/supabase/fetch-node";
import { getSupabaseBrowserKey } from "@/lib/supabase/publishable-key";
import { getSupabaseUrl } from "@/lib/supabase/supabase-url";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabaseBrowserKey();
  if (!url || !key) {
    throw new Error(
      "Supabase URL(SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL)과 공개 키(PUBLISHABLE_* 또는 ANON_KEY)가 필요합니다."
    );
  }

  return createServerClient(url, key, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server Component에서 set 불가할 수 있음 */
        }
      },
    },
  });
}
