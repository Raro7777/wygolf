# 여우골프 (WYGOLF)

Next.js + Supabase 동호회 웹앱 — 핸디 현황, 라운드, 공지, 사진 업로드(토큰 링크) 및 관리자 승인.

## 1. Supabase 프로젝트

1. [Supabase](https://supabase.com)에서 프로젝트를 만듭니다.
2. SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql) 전체를 실행합니다.  
   스키마 하단 **7번 시드**에 여기리그·우리리그 명단(핸디 표)이 포함됩니다. 빈 DB로 시작하려면 해당 블록만 제외하고 실행하세요.  
   (예전 DB에 `points` 컬럼만 없다면 [`supabase/migration_add_points.sql`](supabase/migration_add_points.sql)만 추가 실행.)
3. **Storage**에 버킷 `round-photos`가 생성되었는지 확인합니다.

**또는** 로컬에서 DB에 직접 밀어 넣기: `.env`에 `DATABASE_URL`(대시보드 → Database → URI, 비밀번호 포함)을 넣은 뒤 `npm run db:apply` — `supabase/schema.sql` 전체가 실행됩니다. (Git에 `DATABASE_URL` 커밋 금지)

## 2. 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

- `NEXT_PUBLIC_SUPABASE_URL`, 공개 키: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`(또는 `PUBLISHABLE_KEY`) 또는 레거시 `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 대시보드 **Project Settings → API Keys**
- `SUPABASE_SERVICE_ROLE_KEY`: **서버 전용** (클라이언트에 넣지 마세요)
- `UPLOAD_TOKEN_PEPPER`: 임의의 긴 문자열 (라운드 업로드 토큰 해시용)
- `NEXT_PUBLIC_CLUB_ID`: 단일 동호회면 `default` 유지

## 3. 관리자 계정

1. Supabase **Authentication → Users**에서 관리자 이메일로 사용자를 추가합니다.
2. 해당 사용자의 UUID를 확인한 뒤, SQL Editor에서 아래를 실행합니다 (`YOUR_USER_UUID`, 표시 이름은 원하는 대로).

```sql
insert into public.profiles (club_id, display_name, role, auth_user_id)
values ('default', '관리자', 'admin', 'YOUR_USER_UUID');
```

일반 회원은 `auth_user_id` 없이 `profiles` + `league_members`만 관리자 화면에서 추가합니다.

## 4. 실행

```bash
npm install
npm run dev
```

- 공개: [http://localhost:3000](http://localhost:3000)
- 관리자: [http://localhost:3000/admin](http://localhost:3000/admin) → 로그인

**Supabase `fetch failed` (Windows 등):** Node 쪽 요청은 기본적으로 **IPv4 우선(undici)** 으로 나갑니다. 연결 확인은 `npm run check:api` — 끄려면 `.env`에 `SUPABASE_FETCH_IPV4=0`.

## 라운드 사진 업로드

관리자가 라운드를 만들면 **업로드 URL**이 표시됩니다. 해당 링크를 카톡 등으로 공유하면 비로그인으로 업로드할 수 있고, **관리자 → 사진 승인**에서 승인 후 공개 라운드 페이지에 노출됩니다.
