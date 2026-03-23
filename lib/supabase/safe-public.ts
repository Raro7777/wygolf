import "server-only";

import { createPublicClient } from "@/lib/supabase/public";

export function tryCreatePublicClient() {
  try {
    return createPublicClient();
  } catch {
    return null;
  }
}
