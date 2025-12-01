# Supabase 연결 설정

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 추가하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key-here

# Vercel Blob (이미지 저장소)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx
```

### Supabase 키 찾는 방법

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **Settings** (톱니바퀴 아이콘) 클릭
4. **API** 메뉴 클릭
5. 다음 정보를 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** > **publishable** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Vercel Blob 토큰 찾는 방법

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. **Storage** 탭 클릭
4. **Create Database** → **Blob** 선택
5. 생성된 Blob 스토어 클릭
6. `.env.local` 탭에서 `BLOB_READ_WRITE_TOKEN` 복사

---

## 테이블 생성

Supabase 대시보드 > SQL Editor에서 아래 SQL 실행:

```sql
-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- advent_calendars 테이블 생성
CREATE TABLE IF NOT EXISTS advent_calendars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  main_image TEXT,                          -- 메인 이미지 URL (Vercel Blob)
  day_images JSONB DEFAULT '{}'::jsonb,     -- 일별 이미지 URL { "1": "url", "2": "url", ... }
  day_memos JSONB DEFAULT '{}'::jsonb,      -- 일별 메모 { "1": "memo", "2": "memo", ... }
  door_shape TEXT DEFAULT 'square',         -- 문 모양: 'square' 또는 'circle'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_advent_calendars_user_id ON advent_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_advent_calendars_created_at ON advent_calendars(created_at);
ALTER TABLE advent_calendars DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_advent_calendars_updated_at ON advent_calendars;
CREATE TRIGGER update_advent_calendars_updated_at
  BEFORE UPDATE ON advent_calendars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 실행

```bash
# 환경 변수를 다시 로드하기 위해 개발 서버 재시작
pnpm dev
```

이제 로컬에서도 Supabase DB에 사용자 정보와 캘린더가 저장됩니다! 🎉

---

## 참고

- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다
- 프로덕션 배포 시 Vercel/다른 호스팅 서비스에서 동일한 환경 변수를 설정하면 됩니다

---

## 테이블 스키마

### users 테이블

| 컬럼       | 타입        | 설명              |
| ---------- | ----------- | ----------------- |
| id         | UUID        | 기본 키           |
| username   | TEXT        | 사용자명 (유니크) |
| password   | TEXT        | 비밀번호          |
| created_at | TIMESTAMPTZ | 생성일시          |

### advent_calendars 테이블

| 컬럼       | 타입        | 설명                    |
| ---------- | ----------- | ----------------------- |
| id         | UUID        | 기본 키                 |
| user_id    | UUID        | 사용자 FK               |
| main_image | TEXT        | 메인 이미지 URL         |
| day_images | JSONB       | 일별 이미지 URL 객체    |
| day_memos  | JSONB       | 일별 메모 객체          |
| door_shape | TEXT        | 문 모양 (square/circle) |
| created_at | TIMESTAMPTZ | 생성일시                |
| updated_at | TIMESTAMPTZ | 수정일시                |
