# 속담 훈장님 🎋

한국 속담 퀴즈 & 대화 챗봇 — Next.js + Anthropic Claude API

## 📁 프로젝트 구조

```
proverb-quiz/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.js      # 서버사이드 API 라우트 (API 키 보안)
│   │   ├── globals.css            # 전역 스타일 & 애니메이션
│   │   ├── layout.js              # 루트 레이아웃
│   │   └── page.js                # 메인 페이지
│   └── components/
│       └── ProverbQuiz.jsx        # 메인 챗봇 컴포넌트
├── public/                        # 정적 파일
├── .env.local.example             # 환경변수 예시
├── .gitignore
├── next.config.js
└── package.json
```

## 🚀 Vercel 배포 방법

### 1단계: GitHub에 올리기

```bash
cd proverb-quiz
git init
git add .
git commit -m "Initial commit: 속담 훈장님 챗봇"
git remote add origin https://github.com/YOUR_USERNAME/proverb-quiz.git
git push -u origin main
```

### 2단계: Vercel에서 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 로그인
2. **"New Project"** 클릭
3. 방금 올린 레포지토리 선택 → **"Import"**
4. **"Environment Variables"** 섹션에서:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...` (실제 API 키)
5. **"Deploy"** 클릭!

약 1-2분 후 자동으로 배포됩니다 🎉

### 로컬 실행

```bash
# 의존성 설치
npm install

# .env.local 파일 생성
cp .env.local.example .env.local
# .env.local 파일에 실제 API 키 입력

# 개발 서버 실행
npm run dev
# → http://localhost:3000 에서 확인
```

## 🔑 API 키 보안

- ❌ 원본 코드: 브라우저에서 직접 Anthropic API 호출 (API 키 노출 위험)
- ✅ 이 버전: `src/app/api/chat/route.js` 서버사이드에서만 API 호출
- API 키는 Vercel 환경변수에만 저장, 클라이언트에 절대 노출되지 않음

## ✨ 기능

- 📝 **퀴즈 모드**: 실생활 상황과 함께 속담 4지선다 퀴즈
- 💬 **대화 모드**: 속담에 관해 자유롭게 질문
- 😤 **오답 피드백**: 틀리면 혼장님 꾸짖음 오버레이
- 🎋 **한국 전통 디자인**: 대나무 테마 UI

## 🛠 기술 스택

- **Next.js 14** (App Router)
- **React 18**
- **Anthropic Claude** (claude-sonnet-4)
- **Vercel** (배포)
