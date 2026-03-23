/**
 * Node 서버(RSC·Route·서비스롤) 전용
 * 1) undici + IPv4 (및 HTTP/2 끔)으로 시도
 * 2) 실패 시 Node 기본 fetch로 폴백 (IPv6 등 다른 경로)
 * SUPABASE_FETCH_IPV4=0 → 기본 fetch만
 * SUPABASE_FETCH_NO_FALLBACK=1 → 폴백 안 함
 */
import "server-only";

import { Agent, fetch as undiciFetch } from "undici";
import { withRetryFetch } from "@/lib/supabase/fetch-retry";

const nativeFetch = globalThis.fetch.bind(globalThis);

const ipv4Agent = new Agent({
  connect: { family: 4 },
  allowH2: false,
});

async function ipv4UndiciFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return undiciFetch(
    input as Parameters<typeof undiciFetch>[0],
    {
      ...init,
      dispatcher: ipv4Agent,
    } as Parameters<typeof undiciFetch>[1]
  ) as unknown as Promise<Response>;
}

async function nodeSmartFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  if (process.env.SUPABASE_FETCH_IPV4 === "0") {
    return nativeFetch(input, init);
  }
  try {
    return await ipv4UndiciFetch(input, init);
  } catch (e) {
    if (process.env.SUPABASE_FETCH_NO_FALLBACK === "1") throw e;
    return nativeFetch(input, init);
  }
}

export const supabaseFetch = withRetryFetch(nodeSmartFetch);
