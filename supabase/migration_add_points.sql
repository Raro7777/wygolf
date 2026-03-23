-- 구버전 DB 전용: league_members에 points 컬럼이 없을 때만 실행.
-- 신규 설치는 supabase/schema.sql 만 실행하면 됨 (이미 points 포함).

alter table public.league_members
  add column if not exists points int not null default 0;
