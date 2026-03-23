-- 포인트 입력 이력 + league_members.points 누적 (관리자 RPC)
-- Supabase SQL Editor에서 실행 후, 또는 npm run db:apply 로 schema 반영 시 함께 적용

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

alter table public.point_ledger enable row level security;

drop policy if exists "point_ledger_select_admin" on public.point_ledger;
create policy "point_ledger_select_admin" on public.point_ledger
  for select using (public.is_admin());

-- INSERT/UPDATE/DELETE 정책 없음 → 일반 클라이언트는 RPC 로만 기록

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

comment on table public.point_ledger is '관리자 포인트 가감 이력 (누적은 league_members.points)';
