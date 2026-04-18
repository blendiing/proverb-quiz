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

