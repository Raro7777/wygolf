/** 재시도 래퍼 — Edge·Node 공통 */

export function withRetryFetch(
  baseFetch: typeof fetch,
  retries = 4,
  baseDelayMs = 300
) {
  return async function retriedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    let last: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await baseFetch(input, init);
      } catch (e) {
        last = e;
        if (attempt < retries - 1) {
          await new Promise((r) =>
            setTimeout(r, baseDelayMs * (attempt + 1))
          );
        }
      }
    }
    throw last;
  };
}
