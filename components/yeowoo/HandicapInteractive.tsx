"use client";

import { useMemo, useState } from "react";
import {
  handicapBandClass,
  handicapBarWidth,
  remarkBadges,
} from "@/lib/handicap-display";

export type HandicapRow = {
  id: string;
  sort_no: number;
  base_score: number | null;
  handicap: number | null;
  points: number | null;
  remarks: string | null;
  profiles: { display_name: string; gender: string | null } | null;
  leagues: { name: string } | null;
};

export function HandicapInteractive({ rows }: { rows: HandicapRow[] }) {
  const [tab, setTab] = useState<"all" | "여기리그" | "우리리그">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const league = r.leagues?.name ?? "";
      if (tab !== "all" && league !== tab) return false;
      const name = r.profiles?.display_name ?? "";
      if (q.trim() && !name.toLowerCase().includes(q.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rows, tab, q]);

  const byLeague = useMemo(() => {
    const m = new Map<string, HandicapRow[]>();
    for (const r of filtered) {
      const name = r.leagues?.name ?? "기타";
      if (!m.has(name)) m.set(name, []);
      m.get(name)!.push(r);
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.sort_no - b.sort_no);
    }
    return m;
  }, [filtered]);

  if (rows.length === 0) {
    return (
      <p className="yw-empty-hint">
        아직 등록된 회원이 없습니다.
        <br />
        관리자에서 회원을 추가하세요.
      </p>
    );
  }

  return (
    <>
      <div className="yw-handy-controls yw-surface-pad">
        <div className="yw-sw">
          <span className="yw-si">⌕</span>
          <input
            type="search"
            placeholder="선수 이름 검색…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="yw-ltabs">
          <button
            type="button"
            className={`yw-lt${tab === "all" ? " oa" : ""}`}
            onClick={() => setTab("all")}
          >
            전체
          </button>
          <button
            type="button"
            className={`yw-lt${tab === "여기리그" ? " oy" : ""}`}
            onClick={() => setTab("여기리그")}
          >
            🟢 여기리그
          </button>
          <button
            type="button"
            className={`yw-lt${tab === "우리리그" ? " ou" : ""}`}
            onClick={() => setTab("우리리그")}
          >
            🔴 우리리그
          </button>
        </div>
      </div>

      {[...byLeague.entries()].map(([leagueName, list]) => (
        <section key={leagueName} className="yw-lb">
          <div className="yw-lb-head">
            <span>{leagueName}</span>
            <span className="yw-mcnt">{list.length}명</span>
          </div>
          <div className="yw-tbl-wrap overflow-x-auto">
            <table className="yw-table min-w-[560px]">
              <thead>
                <tr>
                  <th>NO</th>
                  <th>리그</th>
                  <th>이름</th>
                  <th>성별</th>
                  <th>기준타수</th>
                  <th>핸디</th>
                  <th>포인트</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const band = handicapBandClass(r.handicap);
                  const w = handicapBarWidth(r.handicap);
                  const badges = remarkBadges(r.remarks);
                  return (
                    <tr key={r.id}>
                      <td className="yw-td-no">{r.sort_no}</td>
                      <td>{r.leagues?.name ?? "—"}</td>
                      <td className="yw-td-nc">
                        <span className="yw-name-txt">
                          {r.profiles?.display_name ?? "—"}
                        </span>
                        {badges.pro && <span className="yw-bpro">프로</span>}
                        {badges.readj && (
                          <span className="yw-brea">재조정</span>
                        )}
                      </td>
                      <td>
                        {r.profiles?.gender === "남" && (
                          <span className="yw-gb-badge yw-gbm">남</span>
                        )}
                        {r.profiles?.gender === "여" && (
                          <span className="yw-gb-badge yw-gbf">여</span>
                        )}
                        {!r.profiles?.gender && "—"}
                      </td>
                      <td className="tabular-nums">{r.base_score ?? "—"}</td>
                      <td>
                        <div className={`yw-hw ${band}`}>
                          <span className="yw-hn">{r.handicap ?? "—"}</span>
                          <div className="yw-hbar">
                            <div
                              className="yw-hbf"
                              style={{ width: `${w}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="tabular-nums">
                        <span className="yw-hn text-[var(--yw-gold)]">
                          {r.points ?? 0}
                        </span>
                      </td>
                      <td className="max-w-[140px] truncate text-left text-xs text-white/40">
                        {r.remarks ?? ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="yw-empty-hint">검색·필터 조건에 맞는 선수가 없습니다.</p>
      )}

      <div className="yw-notes">
        <div className="yw-note">
          <span>★</span>
          <span>평소 필드 기준 타수를 반영하여 선정</span>
        </div>
        <div className="yw-note">
          <span>★</span>
          <span>개인 평균타수보다 1~2타수 업하여 선정</span>
        </div>
        <div className="yw-note hl">
          <span>★</span>
          <span>
            핸디조정 운영위원회(운영진+고문단)를 통해 리그 중간 업/다운 가능성
          </span>
        </div>
        <div className="yw-note">
          <span>★</span>
          <span>개인별 기준핸디 추가 논의사항은 운영진과 협의</span>
        </div>
      </div>
    </>
  );
}
