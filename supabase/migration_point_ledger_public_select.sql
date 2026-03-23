-- 이미 point_ledger + 관리자 전용 SELECT 정책만 적용된 DB용: 공개 탭에서 이력 조회 허용
drop policy if exists "point_ledger_select_admin" on public.point_ledger;
drop policy if exists "point_ledger_select_public" on public.point_ledger;
create policy "point_ledger_select_public" on public.point_ledger
  for select using (true);
