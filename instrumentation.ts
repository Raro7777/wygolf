/**
 * Node 서버에서만 로드 — Supabase HTTPS가 IPv6 우선으로 막힐 때 fetch failed 완화
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("./instrumentation.node");
}
