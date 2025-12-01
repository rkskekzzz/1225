-- Supabase에서 실행할 SQL
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor로 이동
-- 3. 아래 SQL 실행

-- users 테이블 생성
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

