# TMI Today – 오늘의 TMI 생성기

GPT를 활용해 **할 말 없는 사람들을 위한 TMI 대화 주제**를 추천하는 NestJS 기반 프로젝트입니다.  
누구나 말문이 막힐 때, 유쾌한 주제로 대화를 시작할 수 있도록 도와줍니다.

---

## ✨ 프로젝트 목적

- **대화의 어색함을 줄이기 위한 TMI 생성기** 개발
- GPT API를 연동하여 **랜덤하고 유쾌한 TMI**를 자동 생성
- 사이드 프로젝트를 통해 다음을 연습하고자 함:
  - TDD 기반 백엔드 개발
  - 비즈니스 목적에 기반한 기능 설계
  - 도메인 설계와 문서화 역량 강화

---

## 🛠️ 사용 기술 스택

- **Backend**: [NestJS](https://nestjs.com/) (TypeScript)
- **AI 연동**: OpenAI GPT API 
- **Test**: Jest + Supertest
- **Doc**: Swagger 
- **Deploy (예정)**: Docker, Render 또는 Vercel Functions

---

## 🧱 프로젝트 구조

src/
├── tmi/ 
│   ├── tmi.controller.ts
│   ├── tmi.service.ts
│   ├── tmi.module.ts
│   └── dto/
├── common/ 
├── app.module.ts
└── main.ts

test/ 


✅ 개발 목표 체크리스트

- [x] 기본 NestJS 구조 세팅
- [ ] GPT API 연동
- [ ] 단일 엔드포인트로 TMI 생성
- [ ] 테스트 코드 작성 (Jest)
- [ ] Swagger 문서화
- [ ] 사용자 요청 기반 기능 확장 (카테고리 선택 등)
- [ ] 배포 및 외부 사용 가능하게 만들기


📌 향후 계획

- 카테고리 기반 TMI 추천 (ex. 음식, 역사, 동물, 신체 등)
- 대화용 질문 추천 모드 추가
- 좋아요 기반 맞춤형 대화 주제

---

📎 저작권 및 라이선스

MIT License.
GPT의 출력은 OpenAI API를 통해 생성되며, 사용자의 요청과 목적에 따라 유동적으로 달라질 수 있습니다.