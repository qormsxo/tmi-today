# DL-002: 카테고리 기반 TMI 기능

**작성일**: 2026-02-28  
**상태**: ✅ Completed  
**작성자**: AI Assistant

---

## Background (배경)

현재 TMI Today는 단일 엔드포인트 `GET /tmi/today`로 랜덤 TMI만 생성합니다. 사용자가 관심 있는 주제(음식, 역사, 동물 등)를 선택해서 맞춤형 TMI를 받을 수 있도록 카테고리 기능을 추가합니다.

**현재 구조:**
- `GET /tmi/today` - 인증 필요, 랜덤 TMI 1개 생성
- Tmi 모델: id, content, userId만 있음

## Problem (문제)

1. 사용자가 "음식 관련 TMI" vs "동물 관련 TMI"를 선택할 수 없음
2. 생성된 TMI가 어떤 주제인지 기록되지 않음
3. 카테고리 목록을 API로 제공하지 않음

## Questions and Answers

### Q1: 카테고리는 고정 목록인가요, 아니면 관리자가 추가할 수 있나요?
A: *초기에는 고정 목록으로 시작. 음식, 역사, 동물, 신체, 과학, 일상 등 README에 언급된 카테고리. 추후 관리자 기능 추가 시 확장 가능.*

### Q2: TMI 생성 시 카테고리 선택이 필수인가요?
A: *아니요. 선택사항(optional). 카테고리 없으면 기존처럼 랜덤 TMI 생성.*

### Q3: 카테고리 코드 vs 이름?
A: *코드(food, history, animal 등)를 API 파라미터로 사용. DB에는 id, code, name 저장. code는 URL/쿼리 파라미터에 적합.*

## Design (설계)

### 1. 데이터베이스 스키마

**Category 모델 추가:**
```prisma
model Category {
  id        String   @id @default(cuid())
  code      String   @unique   // food, history, animal, body, science, daily
  name      String   @map("name")  // 음식, 역사, 동물, 신체, 과학, 일상
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  tmis      Tmi[]

  @@map("categories")
}
```

**Tmi 모델 수정 (categoryId 추가):**
```prisma
model Tmi {
  id         String   @id @default(cuid())
  content    String
  categoryId String?  @map("category_id")  // nullable - 기존 TMI 호환
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id])
  category   Category? @relation(fields: [categoryId], references: [id])

  @@map("tmi")
}
```

### 2. API 설계

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | /tmi/categories | 카테고리 목록 조회 | 불필요 |
| GET | /tmi/today?category=food | 카테고리별 TMI 생성 | 필요 |

**GET /tmi/categories 응답 예시:**
```json
[
  { "id": "xxx", "code": "food", "name": "음식" },
  { "id": "xxx", "code": "history", "name": "역사" }
]
```

**GET /tmi/today 쿼리 파라미터:**
- `category` (optional): 카테고리 code (food, history, animal, body, science, daily)

### 3. 파일 구조

```
src/module/tmi/
├── tmi.controller.ts      # GET /tmi/categories 추가, getTodaysTmi에 Query 파라미터
├── tmi.service.ts         # getCategories(), getTodaysTmi(user, categoryCode?)
├── tmi.service.spec.ts
├── tmi.module.ts
└── dto/
    └── get-tmi-query.dto.ts  # category?: string (optional)
```

### 4. GPT 프롬프트 변경

**카테고리 있을 때:**
```
시스템: 너는 새롭고 흥미로운 TMI를 알려주는 한글 어시스턴트야.
       이번에는 [카테고리명] 관련 TMI만 알려줘.
사용자: 오늘의 [카테고리명] TMI를 간결하게 알려줘
```

**카테고리 없을 때:** 기존과 동일

### 5. 시드 데이터

마이그레이션 후 카테고리 시드 데이터 필요:
- food (음식)
- history (역사)
- animal (동물)
- body (신체)
- science (과학)
- daily (일상)

## Implementation Plan (구현 계획)

### Phase 1: DB 스키마 및 마이그레이션
- [ ] Category 모델 추가
- [ ] Tmi 모델에 categoryId 추가
- [ ] `prisma migrate dev` 실행
- [ ] 카테고리 시드 데이터 스크립트 또는 마이그레이션에 포함

### Phase 2: 카테고리 조회 API
- [ ] GET /tmi/categories 엔드포인트 추가
- [ ] TmiService.getCategories() 구현
- [ ] 인증 불필요 (공개 API)

### Phase 3: TMI 생성 시 카테고리 적용
- [ ] GetTmiQueryDto 생성 (category?: string)
- [ ] TmiController.getTodaysTmi에 @Query() 추가
- [ ] TmiService.getTodaysTmi에 categoryCode 파라미터 추가
- [ ] GPT 프롬프트에 카테고리 반영
- [ ] prisma.tmi.create 시 categoryId 저장

### Phase 4: 테스트
- [ ] TmiService.getCategories 단위 테스트
- [ ] TmiService.getTodaysTmi 카테고리 포함/미포함 테스트
- [ ] E2E 테스트 (선택)

## Examples (예시)

### ✅ 카테고리 조회
```http
GET /tmi/categories
→ 200 OK
[
  { "id": "c1", "code": "food", "name": "음식" },
  { "id": "c2", "code": "animal", "name": "동물" }
]
```

### ✅ 카테고리 지정 TMI
```http
GET /tmi/today?category=food
Authorization: Bearer <token>
→ 200 OK
"사과는 물에 뜨고 바나나는 가라앉는다. 밀도 차이 때문이에요!"
```

### ✅ 카테고리 없음 (기존 동작)
```http
GET /tmi/today
Authorization: Bearer <token>
→ 200 OK
"오늘의 랜덤 TMI..."
```

### ❌ 잘못된 카테고리 코드
```http
GET /tmi/today?category=invalid
→ 400 Bad Request 또는 404
```

## Trade-offs (트레이드오프)

### 장점
- 사용자 맞춤형 TMI 제공
- TMI 히스토리에 카테고리 기록 → 추후 분석/추천에 활용 가능
- 카테고리 목록 API로 프론트엔드에서 드롭다운 등 UI 구성 용이

### 단점
- DB 마이그레이션 필요
- 카테고리 추가/변경 시 코드 수정 필요 (초기에는 고정)

### 고려한 대안
1. **카테고리 테이블 없이 enum만 사용**: 단순하지만 확장성 낮음. DB에 기록 안 됨.
2. **Tmi에 categoryId 필수**: 기존 TMI와 호환 안 됨. nullable로 결정.

---

## Implementation Results (구현 결과)

### 완료 (2026-02-28)

**Phase 1: DB 스키마 및 마이그레이션** ✅
- Category 모델 추가
- Tmi 모델에 categoryId (nullable) 추가
- 마이그레이션 `20260228030502_add_category` 적용
- prisma.config.ts 생성 (Prisma 7 마이그레이션용 datasource.url)
- prisma/seed.ts 생성 및 카테고리 시드 데이터 (food, history, animal, body, science, daily)

**Phase 2: 카테고리 조회 API** ✅
- GET /tmi/categories 엔드포인트 추가 (인증 불필요)
- TmiService.getCategories() 구현

**Phase 3: TMI 생성 시 카테고리 적용** ✅
- GetTmiQueryDto 생성 (category?: string)
- GET /tmi/today?category=food 쿼리 파라미터 지원
- GPT 프롬프트에 카테고리 반영
- prisma.tmi.create 시 categoryId 저장
- 잘못된 카테고리 코드 시 BadRequestException

**Phase 4: 테스트** ✅
- getCategories 단위 테스트
- getTodaysTmi 카테고리 포함/미포함 테스트
- 잘못된 카테고리 BadRequestException 테스트
- 7/7 테스트 통과

### 설계와의 차이점
- class-validator 미사용 (프로젝트에 없음) - GetTmiQueryDto는 단순 DTO
- prisma.config.ts 추가 (Prisma 7 마이그레이션 요구사항)
