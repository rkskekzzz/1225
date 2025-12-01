-- Supabase에서 실행할 SQL
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor로 이동
-- 3. 아래 SQL 실행

-- ============================================
-- users 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- username 인덱스 생성 (검색 속도 향상)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Row Level Security (RLS) 비활성화 (간단한 구현을 위해)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- advent_calendars 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS advent_calendars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '나의 어드벤트 캘린더',  -- 캘린더 제목
  main_image TEXT,                          -- 메인 이미지 URL (Vercel Blob)
  day_images JSONB DEFAULT '{}'::jsonb,     -- 일별 이미지 URL { "1": "url", "2": "url", ... }
  day_memos JSONB DEFAULT '{}'::jsonb,      -- 일별 메모 { "1": "memo", "2": "memo", ... }
  door_shape TEXT DEFAULT 'square',         -- 문 모양: 'square' 또는 'circle'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_advent_calendars_user_id ON advent_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_advent_calendars_created_at ON advent_calendars(created_at);

-- Row Level Security (RLS) 비활성화
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

-- ============================================
-- 기존 테이블에 title 컬럼 추가 (이미 테이블이 있는 경우)
-- ============================================
-- ALTER TABLE advent_calendars ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '나의 어드벤트 캘린더';
