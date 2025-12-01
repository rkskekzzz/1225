-- ============================================
-- 기존 advent_calendars 테이블에 background_image 컬럼 추가
-- ============================================
-- 이 스크립트는 기존 테이블이 있다는 것을 가정합니다.
-- Supabase 대시보드 > SQL Editor에서 실행하세요.

ALTER TABLE advent_calendars
ADD COLUMN IF NOT EXISTS background_image TEXT;

-- 추가 확인 (선택사항)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'advent_calendars';

