# 여우골프 (WYGOLF)

Next.js + Supabase 동호회 웹앱 — 핸디 현황, 라운드, 공지, 사진 업로드(토큰 링크) 및 관리자 승인.

## 1. Supabase 프로젝트

1. [Supabase](https://supabase.com)에서 프로젝트를 만듭니다.
2. SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql) 전체를 실행합니다.  
   스키마 하단 **7번 시드**에 여기리그·우리리그 명단(핸디 표)이 포함됩니다. 빈 DB로 시작하려면 해당 블록만 제외하고 실행하세요.  
   (예전 DB에 `points` 컬럼만 없다면 [`supabase/migration_add_points.sql`](supabase/migration_add_points.sql)만 추가 실행.)  
   관리자 **포인트 입력** 이력이 없다면 [`supabase/migration_point_ledger.sql`](supabase/migration_point_ledger.sql)도 실행하세요.  
   예전에 적용한 DB에서 포인트 순위 탭 이력이 안 보이면 [`supabase/migration_point_ledger_public_select.sql`](supabase/migration_point_ledger_public_select.sql)을 실행하세요.
3. **Storage**에 버킷 `round-photos`가 생성되었는지 확인합니다.

**또는** 로컬에서 DB에 직접 밀어 넣기: `.env`에 `DATABASE_URL`(대시보드 → Database → URI, 비밀번호 포함)을 넣은 뒤 `npm run db:apply` — `supabase/schema.sql` 전체가 실행됩니다. (Git에 `DATABASE_URL` 커밋 금지)

## 2. 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

- `NEXT_PUBLIC_SUPABASE_URL`, 공개 키: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`(또는 `PUBLISHABLE_KEY`) 또는 레거시 `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 대시보드 **Project Settings → API Keys**
- `SUPABASE_SERVICE_ROLE_KEY`: **서버 전용** (클라이언트에 넣지 마세요)
- `UPLOAD_TOKEN_PEPPER`: 임의의 긴 문자열 (라운드 업로드 토큰 해시용)
- `NEXT_PUBLIC_CLUB_ID`: 단일 동호회면 `default` 유지

## 3. 관리자 계정

### 빠른 테스트 관리자

1. Supabase **Authentication → Users → Add user**  
   - Email: `test-admin@wygolf.local`  
   - 비밀번호 임의, **Auto Confirm User** 켜기  
2. SQL Editor에서 [`supabase/seed_test_admin.sql`](supabase/seed_test_admin.sql) 전체 실행  
3. 앱에서 `/login` → 위 이메일·비밀번호로 로그인 후 `/admin` 접속  

### 일반(수동 UUID)

1. **Authentication → Users**에서 사용자 추가 후 UUID 복사  
2. SQL Editor:

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

## 5. GitHub · Vercel 배포

- **저장소:** GitHub에 푸시 후 Vercel에서 **Import** 하거나, Vercel CLI로 프로젝트를 연결합니다.
- **프로덕션 URL 예:** 배포 후 Vercel이 부여하는 도메인(예: `https://프로젝트명.vercel.app`)과 커스텀 도메인을 설정할 수 있습니다.

### Vercel 환경 변수 (필수)

대시보드 **Project → Settings → Environment Variables**에 `.env.example`과 동일한 키를 **Production**(및 Preview 필요 시)에 넣습니다.

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(브라우저) 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 (절대 클라이언트에 노출 금지) |
| `UPLOAD_TOKEN_PEPPER` | 라운드 업로드 토큰용 임의 긴 문자열 |
| `NEXT_PUBLIC_CLUB_ID` | 단일 동호회면 `default` |

선택: `DATABASE_URL`은 Vercel 런타임에서 `db:apply`에 쓰지 않으면 생략 가능.

배포 후 **Supabase** → **Authentication → URL Configuration**에 다음을 추가합니다.

- **Site URL:** `https://당신-도메인.vercel.app`
- **Redirect URLs:** `https://당신-도메인.vercel.app/**`, 로컬용 `http://localhost:3000/**`

환경 변수 저장 뒤 Vercel에서 **Redeploy** 하면 반영됩니다.
