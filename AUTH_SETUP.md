# 🎄 Advent Calendar - 인증 시스템 설정 가이드

## Supabase 설정

### 1. Supabase 프로젝트 설정

`.env.local` 파일이 있는지 확인하고, 없다면 생성하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. users 테이블 생성

Supabase 대시보드에서 SQL Editor를 열고 `supabase-setup.sql` 파일의 내용을 실행하세요:

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New Query** 클릭
5. `supabase-setup.sql` 파일의 SQL 코드를 복사하여 붙여넣기
6. **Run** 버튼 클릭

또는 직접 실행:

```sql
-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- username 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Row Level Security (RLS) 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

## 사용 방법

### 회원가입

1. `/signup` 페이지로 이동
2. 아이디 (최소 3자), 비밀번호 (최소 4자) 입력
3. 회원가입 성공 시 자동 로그인되어 메인 페이지로 이동

### 로그인

1. `/login` 페이지로 이동
2. 아이디와 비밀번호 입력
3. 로그인 성공 시 메인 페이지로 이동

### 기본 관리자 계정

Supabase 테이블이 없거나 데이터가 없어도 아래 계정으로 로그인 가능합니다:

- **아이디**: `admin`
- **비밀번호**: `password`

### 로그아웃

메인 페이지 우측 상단의 "로그아웃" 버튼 클릭

## 보안 참고사항

현재 구현은 간단한 인증 시스템으로:

- 비밀번호가 평문으로 저장됩니다 (해싱 없음)
- 쿠키 기반 인증 (Base64 인코딩)

**프로덕션 환경에서는 다음을 권장합니다:**

- bcrypt 등을 사용한 비밀번호 해싱
- JWT 토큰 사용
- Supabase Auth 서비스 활용
- HTTPS 사용
- Row Level Security (RLS) 활성화
