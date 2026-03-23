-- =============================================================================
-- 테스트 관리자 1명 연결
-- =============================================================================
-- 1) Supabase → Authentication → Users → Add user → Create new user
--      Email:    test-admin@wygolf.local  (아래 SQL과 동일하게 맞출 것)
--      Password: 임시 비밀번호
--      Auto Confirm User: 켜기 (이메일 인증 없이 로그인 테스트)
-- 2) SQL Editor에서 이 파일 전체 실행
-- 다른 이메일을 쓰려면 아래 두 곳의 이메일 문자열을 같이 바꿉니다.
-- =============================================================================

insert into public.profiles (club_id, display_name, gender, role, auth_user_id)
select
  'default',
  '테스트 관리자',
  null,
  'admin',
  u.id
from auth.users u
where u.email = 'test-admin@wygolf.local'
limit 1
on conflict (auth_user_id) do update set
  role = excluded.role,
  display_name = excluded.display_name,
  club_id = excluded.club_id;

-- 연결 확인 (1행 나오면 OK)
select p.display_name, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.auth_user_id
where u.email = 'test-admin@wygolf.local';
