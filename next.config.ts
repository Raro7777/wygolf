import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * Cursor/CI 등에서 process.env.NEXT_PUBLIC_SUPABASE_URL 이 플레이스홀더로 이미 설정된 경우
 * dotenv 규칙상 .env 가 이를 덮어쓰지 못함 → 프로젝트 루트 .env(.local) 에서 직접 읽음.
 */
function readEnvFileValue(key: string): string {
  for (const name of [".env.local", ".env"]) {
    const p = join(process.cwd(), name);
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

const supabaseUrl =
  process.env.SUPABASE_URL?.trim() ||
  readEnvFileValue("NEXT_PUBLIC_SUPABASE_URL") ||
  readEnvFileValue("SUPABASE_URL") ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "";

const nextConfig: NextConfig = {
  serverExternalPackages: ["undici"],
  ...(supabaseUrl
    ? {
        env: {
          SUPABASE_URL: supabaseUrl,
        },
      }
    : {}),
};

export default nextConfig;
