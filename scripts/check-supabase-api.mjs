/**
 * Supabase REST 연결 확인
 * process.env 가 플레이스홀더로 오염된 경우(Cursor 등) .env(.local) 파일을 우선합니다.
 */
import dns from "node:dns";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

dns.setDefaultResultOrder?.("ipv4first");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readEnvFileValue(key) {
  for (const name of [".env.local", ".env"]) {
    const p = join(root, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const re = new RegExp(
        `^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=\\s*(.*)$`
      );
      const m = t.match(re);
      if (!m) continue;
      let v = m[1].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (v) return v;
    }
  }
  return "";
}

function withRetry(baseFetch, retries = 4, baseDelayMs = 300) {
  return async (input, init) => {
    let last;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await baseFetch(input, init);
      } catch (e) {
        last = e;
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)));
        }
      }
    }
    throw last;
  };
}

const fetchRetry = withRetry(globalThis.fetch.bind(globalThis));

const url =
  process.env.SUPABASE_URL?.trim() ||
  readEnvFileValue("NEXT_PUBLIC_SUPABASE_URL") ||
  readEnvFileValue("SUPABASE_URL") ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "";

const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
  readEnvFileValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  readEnvFileValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  readEnvFileValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
  "";

if (!url || !key) {
  console.error(
    "[check:api] SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL 또는 공개 키(PUBLISHABLE_*/ANON)가 없습니다."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  global: { fetch: fetchRetry },
});

const { data, error } = await supabase.from("leagues").select("id").limit(1);

if (error) {
  console.error("[check:api] 실패:", error.message);
  process.exit(1);
}

console.log("[check:api] Supabase REST 연결 OK (leagues 샘플)", data);
