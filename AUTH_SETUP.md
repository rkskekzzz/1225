# 🎄 Advent Calendar - 로그인 시스템

## 로컬에서 바로 사용하기

Supabase 설정 없이도 바로 사용 가능합니다!

### 로컬 테스트 계정

- **아이디**: `admin` / **비밀번호**: `password`
- **아이디**: `test` / **비밀번호**: `test123`

### 회원가입

`/signup` 페이지에서 새 계정을 만들 수 있습니다.

- 로컬 모드: 메모리에만 저장 (재시작하면 사라짐)
- Supabase 연결 시: 데이터베이스에 영구 저장

---

## Supabase 연결 (선택사항)

실제 데이터베이스에 사용자 정보를 저장하려면 Supabase를 연결하세요.

### 1. 환경 변수 설정

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. users 테이블 생성

Supabase 대시보드 > SQL Editor에서 실행:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## 작동 방식

1. **로그인 시도**:

   - Supabase DB에서 사용자 검색
   - 실패 시 로컬 계정으로 폴백

2. **회원가입**:

   - Supabase 연결 시: DB에 저장
   - 연결 없을 시: 로컬 모드로 작동

3. **로그아웃**: 쿠키 삭제

---

## 보안 참고사항

간단한 인증 시스템:

- 비밀번호 평문 저장 (해싱 없음)
- 쿠키 기반 인증 (Base64 인코딩)

**프로덕션 사용 시 권장사항:**

- bcrypt로 비밀번호 해싱
- JWT 토큰 사용
- HTTPS 필수
- Supabase Auth 서비스 활용
