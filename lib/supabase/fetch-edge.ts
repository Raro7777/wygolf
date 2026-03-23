/**
 * Middleware(Edge) 전용 — Node 전용 모듈(undici) 없음
 */
import { withRetryFetch } from "@/lib/supabase/fetch-retry";

export const supabaseFetch = withRetryFetch(globalThis.fetch.bind(globalThis));
