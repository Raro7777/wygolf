-- =============================================================================
-- 여우골프 (WYGOLF) — Supabase 전체 스키마 + 초기 데이터
-- SQL Editor에서 한 번에 실행. (재실행 시 정책은 교체, 시드는 upsert)
-- 관리자: Auth 사용자 생성 후 profiles에 role='admin', auth_user_id 연결
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 확장
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 2. 테이블
-- -----------------------------------------------------------------------------
create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  club_id text not null default 'default',
  name text not null,
  unique (club_id, name)
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  club_id text not null default 'default',
  display_name text not null,
  gender text,
  auth_user_id uuid references auth.users (id) on delete set null unique,
  role text not null default 'member' check (role in ('member', 'admin'))
);

create table if not exists public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  sort_no int not null default 0,
  base_score int,
  handicap int,
  points int not null default 0,
  remarks text,
  updated_at timestamptz not null default now(),
  unique (league_id, profile_id)
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  club_id text not null default 'default',
  date timestamptz not null,
  course_name text,
  status text not null default 'scheduled',
  upload_token_hash text
);

create table if not exists public.round_participants (
  round_id uuid not null references public.rounds (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (round_id, profile_id)
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  gross int not null,
  net_optional int,
  unique (round_id, profile_id)
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  club_id text not null default 'default',
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.round_photos (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploader_label text,
  storage_path text not null,
  caption text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 예전에 만든 league_members 에는 points 가 없을 수 있음 (CREATE IF NOT EXISTS 는 컬럼을 안 붙임)
alter table public.league_members
  add column if not exists points int not null default 0;

create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  league_member_id uuid not null references public.league_members (id) on delete cascade,
  delta int not null,
  memo text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists point_ledger_created_at_idx
  on public.point_ledger (created_at desc);

create index if not exists point_ledger_league_member_idx
  on public.point_ledger (league_member_id);

-- -----------------------------------------------------------------------------
-- 3. 함수 (profiles 이후 정의)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.apply_point_entries(p_entries jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_prof uuid;
  lm_id uuid;
  d int;
  applied int := 0;
  n int;
  i int;
  rowj jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select p.id into admin_prof
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.role = 'admin'
  limit 1;

  if admin_prof is null then
    raise exception 'admin profile not found';
  end if;

  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    raise exception 'p_entries must be a json array';
  end if;

  n := coalesce(jsonb_array_length(p_entries), 0);
  for i in 0 .. n - 1 loop
    rowj := p_entries->i;
    lm_id := (rowj->>'league_member_id')::uuid;
    d := (rowj->>'delta')::int;

    if lm_id is null then
      raise exception 'missing league_member_id';
    end if;

    insert into public.point_ledger (league_member_id, delta, memo, created_by)
    values (
      lm_id,
      d,
      nullif(trim(coalesce(rowj->>'memo', '')), ''),
      admin_prof
    );

    update public.league_members
    set
      points = coalesce(points, 0) + d,
      updated_at = now()
    where id = lm_id;

    if not found then
      raise exception 'league_member not found: %', lm_id;
    end if;

    applied := applied + 1;
  end loop;

  return jsonb_build_object('applied', applied);
end;
$$;

grant execute on function public.apply_point_entries(jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
alter table public.leagues enable row level security;
alter table public.profiles enable row level security;
alter table public.league_members enable row level security;
alter table public.rounds enable row level security;
alter table public.round_participants enable row level security;
alter table public.scores enable row level security;
alter table public.notices enable row level security;
alter table public.round_photos enable row level security;
alter table public.point_ledger enable row level security;

-- 공개 읽기
drop policy if exists "leagues_select" on public.leagues;
create policy "leagues_select" on public.leagues for select using (true);

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);

drop policy if exists "league_members_select" on public.league_members;
create policy "league_members_select" on public.league_members for select using (true);

drop policy if exists "rounds_select" on public.rounds;
create policy "rounds_select" on public.rounds for select using (true);

drop policy if exists "round_participants_select" on public.round_participants;
create policy "round_participants_select" on public.round_participants for select using (true);

drop policy if exists "scores_select" on public.scores;
create policy "scores_select" on public.scores for select using (true);

drop policy if exists "notices_select" on public.notices;
create policy "notices_select" on public.notices for select using (true);

drop policy if exists "round_photos_select_public" on public.round_photos;
create policy "round_photos_select_public" on public.round_photos
  for select using (status = 'approved' or public.is_admin());

-- 관리자 전체 권한
drop policy if exists "leagues_admin" on public.leagues;
create policy "leagues_admin" on public.leagues
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_admin" on public.profiles;
create policy "profiles_admin" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "league_members_admin" on public.league_members;
create policy "league_members_admin" on public.league_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "rounds_admin" on public.rounds;
create policy "rounds_admin" on public.rounds
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "round_participants_admin" on public.round_participants;
create policy "round_participants_admin" on public.round_participants
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "scores_admin" on public.scores;
create policy "scores_admin" on public.scores
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notices_admin" on public.notices;
create policy "notices_admin" on public.notices
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "round_photos_admin" on public.round_photos;
create policy "round_photos_admin" on public.round_photos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "point_ledger_select_admin" on public.point_ledger;
create policy "point_ledger_select_admin" on public.point_ledger
  for select using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Storage 버킷
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('round-photos', 'round-photos', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 6. 시드 — 리그
-- -----------------------------------------------------------------------------
insert into public.leagues (club_id, name)
values ('default', '여기리그'), ('default', '우리리그')
on conflict (club_id, name) do nothing;

-- -----------------------------------------------------------------------------
-- 7. 시드 — 핸디 현황표 명단 (여기 14 · 우리 18)
--     명단만 비우고 싶으면 이 블록(7번)만 건너뛰면 됨. 재실행 시 upsert.
-- -----------------------------------------------------------------------------
insert into public.profiles (id, club_id, display_name, gender, role) values
  ('a1000001-0000-4000-8000-000000000001', 'default', '나명수',   '남', 'member'),
  ('a1000001-0000-4000-8000-000000000002', 'default', '박성재',   '남', 'member'),
  ('a1000001-0000-4000-8000-000000000003', 'default', '신호승',   '남', 'member'),
  ('a1000001-0000-4000-8000-000000000004', 'default', '김영두',   '남', 'member'),
  ('a1000001-0000-4000-8000-000000000005', 'default', '이광철',   '남', 'member'),
  ('a1000001-0000-4000-8000-000000000006', 'default', '김은정',   '여', 'member'),
  ('a1000001-0000-4000-8000-000000000007', 'default', '이태준',   '남', 'member'),
  ('a1000001-0000-4000-8000-000000000008', 'default', '권회민',   '남', 'member'),
  ('a1000001-0000-4000-8000-000000000009', 'default', '정지선',   '여', 'member'),
  ('a1000001-0000-4000-8000-00000000000a', 'default', '양준모',   '남', 'member'),
  ('a1000001-0000-4000-8000-00000000000b', 'default', '이동훈',   '남', 'member'),
  ('a1000001-0000-4000-8000-00000000000c', 'default', '김승엽',   '남', 'member'),
  ('a1000001-0000-4000-8000-00000000000d', 'default', '박종선',   '남', 'member'),
  ('a1000001-0000-4000-8000-00000000000e', 'default', '문정길',   '남', 'member'),
  ('a2000001-0000-4000-8000-000000000001', 'default', '김수진',   '여', 'member'),
  ('a2000001-0000-4000-8000-000000000002', 'default', '심동영',   '남', 'member'),
  ('a2000001-0000-4000-8000-000000000003', 'default', '김한석',   '남', 'member'),
  ('a2000001-0000-4000-8000-000000000004', 'default', '김규동',   '남', 'member'),
  ('a2000001-0000-4000-8000-000000000005', 'default', '박정아',   '여', 'member'),
  ('a2000001-0000-4000-8000-000000000006', 'default', '김성민',   '남', 'member'),
  ('a2000001-0000-4000-8000-000000000007', 'default', '임진양',   '여', 'member'),
  ('a2000001-0000-4000-8000-000000000008', 'default', '허준수',   '남', 'member'),
  ('a2000001-0000-4000-8000-000000000009', 'default', '박창현',   '남', 'member'),
  ('a2000001-0000-4000-8000-00000000000a', 'default', '홍성민',   '남', 'member'),
  ('a2000001-0000-4000-8000-00000000000b', 'default', '윤여빈',   '남', 'member'),
  ('a2000001-0000-4000-8000-00000000000c', 'default', '성종훈',   '남', 'member'),
  ('a2000001-0000-4000-8000-00000000000d', 'default', '홍성호',   '남', 'member'),
  ('a2000001-0000-4000-8000-00000000000e', 'default', '정영준',   '남', 'member'),
  ('a2000001-0000-4000-8000-00000000000f', 'default', '김현석',   '남', 'member'),
  ('a2000001-0000-4000-8000-000000000010', 'default', '천금서',   '여', 'member'),
  ('a2000001-0000-4000-8000-000000000011', 'default', '서선홍',   '남', 'member'),
  ('a2000001-0000-4000-8000-000000000012', 'default', '신동호',   '남', 'member')
on conflict (id) do update set
  display_name = excluded.display_name,
  gender       = excluded.gender,
  club_id      = excluded.club_id;

insert into public.league_members (
  league_id, profile_id, sort_no, base_score, handicap, points, remarks
)
select
  l.id,
  p.id,
  v.sort_no,
  v.base_score,
  v.handicap,
  0,
  v.remarks
from (
  values
    -- 여기리그
    ('여기리그', 'a1000001-0000-4000-8000-000000000001'::uuid,  1,  83, 11, null::text),
    ('여기리그', 'a1000001-0000-4000-8000-000000000002'::uuid,  2,  84, 12, null),
    ('여기리그', 'a1000001-0000-4000-8000-000000000003'::uuid,  3,  87, 15, null),
    ('여기리그', 'a1000001-0000-4000-8000-000000000004'::uuid,  4,  86, 14, null),
    ('여기리그', 'a1000001-0000-4000-8000-000000000005'::uuid,  5,  86, 14, null),
    ('여기리그', 'a1000001-0000-4000-8000-000000000006'::uuid,  6,  84, 12, null),
    ('여기리그', 'a1000001-0000-4000-8000-000000000007'::uuid,  7,  78,  6, '프로 / 화이트기준'),
    ('여기리그', 'a1000001-0000-4000-8000-000000000008'::uuid,  8,  89, 17, null),
    ('여기리그', 'a1000001-0000-4000-8000-000000000009'::uuid,  9,  89, 17, null),
    ('여기리그', 'a1000001-0000-4000-8000-00000000000a'::uuid, 10,  87, 15, null),
    ('여기리그', 'a1000001-0000-4000-8000-00000000000b'::uuid, 11,  78,  6, '프로 / 화이트기준'),
    ('여기리그', 'a1000001-0000-4000-8000-00000000000c'::uuid, 12,  89, 17, null),
    ('여기리그', 'a1000001-0000-4000-8000-00000000000d'::uuid, 13,  85, 13, null),
    ('여기리그', 'a1000001-0000-4000-8000-00000000000e'::uuid, 14,  85, 13, null),
    -- 우리리그
    ('우리리그', 'a2000001-0000-4000-8000-000000000001'::uuid,  1,  99, 18, null),
    ('우리리그', 'a2000001-0000-4000-8000-000000000002'::uuid,  2,  91, 19, null),
    ('우리리그', 'a2000001-0000-4000-8000-000000000003'::uuid,  3, 103, 31, null),
    ('우리리그', 'a2000001-0000-4000-8000-000000000004'::uuid,  4,  96, 24, null),
    ('우리리그', 'a2000001-0000-4000-8000-000000000005'::uuid,  5,  99, 27, '첫 정라 이후 재조정'),
    ('우리리그', 'a2000001-0000-4000-8000-000000000006'::uuid,  6,  95, 23, null),
    ('우리리그', 'a2000001-0000-4000-8000-000000000007'::uuid,  7,  98, 26, '첫 정라 이후 재조정'),
    ('우리리그', 'a2000001-0000-4000-8000-000000000008'::uuid,  8,  95, 23, '첫 정라 이후 재조정'),
    ('우리리그', 'a2000001-0000-4000-8000-000000000009'::uuid,  9,  97, 25, null),
    ('우리리그', 'a2000001-0000-4000-8000-00000000000a'::uuid, 10,  98, 26, null),
    ('우리리그', 'a2000001-0000-4000-8000-00000000000b'::uuid, 11,  96, 24, null),
    ('우리리그', 'a2000001-0000-4000-8000-00000000000c'::uuid, 12,  97, 25, null),
    ('우리리그', 'a2000001-0000-4000-8000-00000000000d'::uuid, 13,  95, 23, null),
    ('우리리그', 'a2000001-0000-4000-8000-00000000000e'::uuid, 14, 103, 31, null),
    ('우리리그', 'a2000001-0000-4000-8000-00000000000f'::uuid, 15,  95, 23, null),
    ('우리리그', 'a2000001-0000-4000-8000-000000000010'::uuid, 16,  91, 19, null),
    ('우리리그', 'a2000001-0000-4000-8000-000000000011'::uuid, 17, 110, 38, null),
    ('우리리그', 'a2000001-0000-4000-8000-000000000012'::uuid, 18,  91, 19, null)
) as v(league_name, profile_id, sort_no, base_score, handicap, remarks)
join public.leagues l on l.club_id = 'default' and l.name = v.league_name
join public.profiles p on p.id = v.profile_id
on conflict (league_id, profile_id) do update set
  sort_no    = excluded.sort_no,
  base_score = excluded.base_score,
  handicap   = excluded.handicap,
  remarks    = excluded.remarks,
  updated_at = now();
