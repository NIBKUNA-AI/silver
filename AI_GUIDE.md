# 🤖 AI/Developer Guide - Zarada ERP

> 이 문서는 AI 어시스턴트 또는 개발자가 앱 구조를 빠르게 파악하기 위한 가이드입니다.

---

## 📁 프로젝트 구조

```
d:/child_app/
├── src/
│   ├── components/          # 재사용 가능한 UI 컴포넌트
│   │   ├── Header.tsx       # 앱 헤더
│   │   ├── Sidebar.tsx      # 사이드바 네비게이션 (핵심!)
│   │   ├── ProtectedRoute.tsx # 인증 가드
│   │   ├── public/          # 공개 페이지용 컴포넌트
│   │   ├── app/             # 관리 앱용 컴포넌트
│   │   │   └── schedule/    # 일정 관련 (ScheduleModal 등)
│   │   └── admin/           # 관리자 전용 (BlogEditModal 등)
│   │
│   ├── pages/
│   │   ├── public/          # 공개 마케팅 페이지
│   │   │   ├── HomePage.tsx
│   │   │   ├── AboutPage.tsx
│   │   │   ├── BlogPage.tsx
│   │   │   └── ContactPage.tsx
│   │   │
│   │   ├── app/             # 🔒 인증 필요 관리 앱
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Schedule.tsx
│   │   │   ├── Payments.tsx
│   │   │   ├── children/        # 아동 관리
│   │   │   ├── consultations/   # 상담/발달평가
│   │   │   └── blog/            # 블로그 관리
│   │   │
│   │   └── auth/            # 인증 페이지 (Login, Register)
│   │
│   ├── contexts/            # React Context
│   │   └── AuthContext.tsx  # 인증 상태 관리
│   │
│   ├── hooks/               # 커스텀 훅
│   │   └── useAdminSettings.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts      # Supabase 클라이언트
│   │   └── utils.ts         # 유틸리티 함수 (cn 등)
│   │
│   └── config/
│       └── deployment-guide.ts  # 배포 체크리스트
│
├── supabase/
│   ├── functions/           # Edge Functions
│   │   └── generate-blog-post/  # AI 블로그 생성
│   └── migrations/          # DB 마이그레이션
│
├── database/
│   └── migrations/          # 추가 SQL 마이그레이션
│
└── plan.md                  # 원본 개발 계획서
```

---

## 🗄️ 주요 데이터베이스 테이블

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `user_profiles` | 사용자 프로필 | id, name, role, email |
| `children` | 아동 정보 | id, name, birth_date, parent_id |
| `schedules` | 수업 일정 | id, child_id, therapist_id, status, start_time |
| `therapists` | 치료사 정보 | id, name |
| `programs` | 프로그램 | id, name, duration, price |
| `development_assessments` | 발달 평가 | child_id, log_id, scores, therapist_notes |
| `payments` | 결제 내역 | child_id, amount, paid_at |
| `blog_posts` | 블로그 글 | title, slug, content, is_published |
| `admin_settings` | 관리자 설정 | key, value (center_logo, center_name 등) |
| `centers` | 센터 정보 | name, address, phone |

---

## 🔐 인증 시스템

- **Provider**: Supabase Auth
- **Context**: `AuthContext.tsx`
- **Guard**: `ProtectedRoute.tsx`
- **Roles**: `super_admin`, `admin`, `therapist`

```tsx
// 사용 예시
const { user } = useAuth();
if (user?.email === 'anukbin@gmail.com') {
  // Super Admin 권한
}
```

---

## 🎯 핵심 파일 위치

| 기능 | 파일 경로 |
|------|-----------|
| 일정 관리 | `src/pages/app/Schedule.tsx` |
| 일정 모달 | `src/components/app/schedule/ScheduleModal.tsx` |
| 발달 평가 | `src/pages/app/consultations/ConsultationList.tsx` |
| 평가 폼 | `src/pages/app/children/AssessmentFormModal.tsx` |
| AI 블로그 생성 | `supabase/functions/generate-blog-post/index.ts` |
| 블로그 에디터 | `src/pages/app/blog/BlogEditor.tsx` |
| 결제 관리 | `src/pages/app/Payments.tsx` |
| 사이드바 | `src/components/Sidebar.tsx` |

---

## 🔗 라우팅 구조

```
/ (public)
├── /about
├── /programs  
├── /blog
├── /blog/:slug
├── /contact
└── /parent/:accessCode  (부모 앱)

/app (protected)
├── /app/dashboard
├── /app/schedule
├── /app/children
├── /app/consultations
├── /app/payments
├── /app/therapists
├── /app/blog
├── /app/blog/new
├── /app/blog/edit/:id
└── /app/settings
```

---

## 🛠️ 개발 명령어

```bash
npm run dev      # 개발 서버 (Vite)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
```

---

## 📝 코딩 컨벤션

- **TypeScript**: 타입 안전성 우선
- **Tailwind CSS**: 유틸리티 클래스 사용
- **Supabase**: `(supabase as any)` 캐스팅으로 타입 에러 우회
- **한글 주석**: 비즈니스 로직 설명에 한글 사용
