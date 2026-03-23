/**
 * Supabase Postgres에 supabase/schema.sql 전체 실행
 *
 * Node DNS가 깨진 Windows에서도 동작하도록:
 * - Win32 + *.supabase.co → PowerShell Resolve-DnsName 을 **먼저** 시도
 * - 연결은 URL 문자열이 아니라 **옵션 객체**(host=IP)로만 열어 재-DNS 조회 방지
 */
import { execFileSync } from "node:child_process";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

dns.setDefaultResultOrder("ipv6first");

const extraDns = process.env.DB_APPLY_DNS_SERVERS?.split(/[\s,]+/).filter(Boolean);
dns.setServers(extraDns?.length ? extraDns : ["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "..", "supabase", "schema.sql");

function safeDecode(s) {
  try {
    return decodeURIComponent(s.replace(/\+/g, "%20"));
  } catch {
    return s;
  }
}

/** @param {string} raw */
function parseConn(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL 형식이 올바르지 않습니다.");
  }
  const hostname = u.hostname;
  if (!hostname) throw new Error("DATABASE_URL에 호스트가 없습니다.");
  const port = u.port ? Number(u.port) : 5432;
  const user = safeDecode(u.username || "postgres");
  const password = safeDecode(u.password || "");
  const database = (u.pathname || "").replace(/^\//, "") || "postgres";
  return { hostname, port, user, password, database };
}

/** @param {string} h */
function assertSafeHostname(h) {
  if (!/^[a-zA-Z0-9.-]+$/.test(h)) {
    throw new Error(`허용되지 않는 호스트 문자: ${h}`);
  }
}

/**
 * @param {string} hostname
 * @returns {string | null} IP (IPv4) 또는 IPv6 문자열
 */
function resolveHostViaWindows(hostname) {
  assertSafeHostname(hostname);
  if (os.platform() !== "win32") return null;
  const safe = hostname.replace(/'/g, "''");
  const script = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    `$h = '${safe}'`,
    "$a = (Resolve-DnsName -Name $h -Type A -DnsOnly -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress",
    "if ($a) { Write-Output $a; exit 0 }",
    "$b = (Resolve-DnsName -Name $h -Type AAAA -DnsOnly -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress",
    "if ($b) { Write-Output $b; exit 0 }",
    "exit 1",
  ].join("; ");
  try {
    const out = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { encoding: "utf8", timeout: 25000, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    const ip = out.split(/\r?\n/).find((line) => line.trim())?.trim();
    if (!ip) return null;
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) return ip;
    if (ip.includes(":")) return ip;
  } catch {
    return null;
  }
  return null;
}

/**
 * @param {string} hostname
 * @returns {{ host: string, tlsServerName: string | null }}
 */
async function resolveConnectHost(hostname) {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return { host: hostname, tlsServerName: null };
  }
  if (hostname.includes(":") && !hostname.includes(".")) {
    return { host: hostname, tlsServerName: null };
  }

  const preferWinFirst =
    os.platform() === "win32" && hostname.toLowerCase().endsWith(".supabase.co");

  if (preferWinFirst) {
    const w = resolveHostViaWindows(hostname);
    if (w) {
      console.log("[db:apply] Windows DNS →", w);
      return { host: w, tlsServerName: hostname };
    }
  }

  try {
    const [ip4] = await dnsPromises.resolve4(hostname);
    return { host: ip4, tlsServerName: hostname };
  } catch {
    /* */
  }

  try {
    const [ip6] = await dnsPromises.resolve6(hostname);
    return { host: ip6, tlsServerName: hostname };
  } catch {
    /* */
  }

  if (!preferWinFirst) {
    const w = resolveHostViaWindows(hostname);
    if (w) {
      console.log("[db:apply] Windows DNS →", w);
      return { host: w, tlsServerName: hostname };
    }
  }

  throw new Error(
    `DNS 조회 실패: ${hostname}\n` +
      "→ 대시보드 **Session pooler** URI(포트 6543)를 쓰거나 네트워크/DNS를 확인하세요."
  );
}

async function main() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    console.error("[db:apply] .env에 DATABASE_URL이 없습니다.");
    process.exit(1);
  }

  const conn = parseConn(raw);
  const { host, tlsServerName } = await resolveConnectHost(conn.hostname);

  // IP로 붙을 때 SNI용 servername만 지정. 검증은 기본 완화(회사망 SSL 가로채기·일부 풀러 환경 대응).
  // 엄격 검증: DB_APPLY_SSL_STRICT=1
  const strictSsl = process.env.DB_APPLY_SSL_STRICT === "1";
  const ssl =
    tlsServerName != null
      ? { servername: tlsServerName, rejectUnauthorized: strictSsl }
      : "require";

  // postgres.js는 host 문자열을 "host:port"처럼 ':'로 쪼개서 IPv6 주소를 망가뜨림 → IPv6는 host·port 배열로만 전달
  const isV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
  const isV6 = host.includes(":") && !isV4;

  const baseOpts = {
    user: conn.user,
    pass: conn.password,
    database: conn.database,
    ssl,
    max: 1,
    connect_timeout: 30,
    onnotice: () => {},
  };

  if (isV6 && conn.hostname.toLowerCase().endsWith(".supabase.co")) {
    console.warn(
      "[db:apply] IPv6 + 직접 연결(5432)입니다. 많은 가정/회사망에서 타임아웃됩니다.\n" +
        "         → 대시보드 **Session pool** URI(포트 6543)로 DATABASE_URL을 바꾸는 것을 권장합니다."
    );
  }

  const sql = postgres(
    isV6
      ? { ...baseOpts, host: [host], port: [conn.port] }
      : { ...baseOpts, host, port: conn.port }
  );

  try {
    console.log("[db:apply] TLS 연결 확인 중…");
    await sql`select 1 as ok`;
    console.log("[db:apply] 연결 성공. schema.sql 실행 중(수십 초 걸릴 수 있음)…");

    const body = fs.readFileSync(schemaPath, "utf8");
    await sql.unsafe(body);

    console.log("[db:apply] schema.sql 적용 완료.");
  } catch (e) {
    const msg = String(e?.message ?? e);
    console.error("[db:apply] 실패:", msg);
    if (
      /ETIMEDOUT|ECONNREFUSED/i.test(msg) &&
      conn.hostname.toLowerCase().includes("supabase.co")
    ) {
      console.error(
        "\n[db:apply] 해결: Supabase → **Project Settings → Database → Connection string**\n" +
          "  • **Method: Session pool** (또는 URI에 pooler.supabase.com, 포트 **6543**)\n" +
          "  • 사용자명이 **postgres.프로젝트ref** 형태인 문자열을 복사해 `.env`의 DATABASE_URL로 넣기\n" +
          "  • 직접 연결(db.xxx.supabase.co:5432)은 IPv6만 있어서, IPv6가 막인 회선에서는 풀러가 필요합니다.\n"
      );
    }
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error("[db:apply] 오류:", e);
  process.exit(1);
});
