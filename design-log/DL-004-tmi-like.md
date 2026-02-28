# DL-004: 카테고리 좋아요 기능

**작성일**: 2026-02-28  
**상태**: 🔵 Draft  
**작성자**: AI Assistant

---

## Background (배경)

TMI Today의 다음 목표는 "좋아요 기반 맞춤형 대화 주제" 구현. 사용자가 관심 있는 카테고리에 좋아요를 남기면, 향후 해당 카테고리 TMI를 우선 추천할 수 있음.

**현재 상태:**
- 카테고리 CRUD 완료
- TMI 생성 시 카테고리 선택 가능
- 사용자 선호 카테고리 수집 없음

## Problem (문제)

1. 사용자가 어떤 카테고리를 좋아하는지 알 수 없음
2. 개인화 TMI 추천 불가
3. 인기 카테고리 분석 불가

## Questions and Answers

### Q1: 한 사용자가 같은 카테고리에 여러 번 좋아요 가능?
A: *불가. (userId, categoryId) 조합은 unique. 다시 누르면 취소(토글).*

### Q2: 카테고리 목록 조회 시 좋아요 수 표시?
A: *네. 각 카테고리의 좋아요 수와 현재 사용자의 좋아요 여부 포함.*

### Q3: 삭제된 카테고리의 좋아요는?
A: *카테고리 삭제 시 관련 좋아요도 삭제 (onDelete: Cascade).*

## Design (설계)

### 1. 데이터베이스 스키마

**CategoryLike 모델 추가:**
```prisma
model CategoryLike {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  categoryId String   @map("category_id")
  createdAt  DateTime @default(now()) @map("created_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([userId, categoryId])
  @@map("category_likes")
}
```

**User, Category 모델에 relation 추가:**
```prisma
model User {
  ...
  categoryLikes  CategoryLike[]
}

model Category {
  ...
  likes          CategoryLike[]
}
```

### 2. API 설계

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /tmi/categories/:id/like | 좋아요 토글 | 필요 |
| GET | /tmi/categories | 카테고리 목록 (좋아요 수, 내 좋아요 여부) | 선택 |
| GET | /tmi/categories/my-likes | 내가 좋아요한 카테고리 | 필요 |

### 3. 응답 형식

**POST /tmi/categories/:id/like 응답:**
```json
{
  "liked": true,
  "likeCount": 15
}
```

**GET /tmi/categories 응답 (인증 시):**
```json
[
  {
    "id": "xxx",
    "code": "food",
    "name": "음식",
    "likeCount": 25,
    "isLiked": true
  },
  {
    "id": "yyy",
    "code": "animal",
    "name": "동물",
    "likeCount": 18,
    "isLiked": false
  }
]
```

**GET /tmi/categories 응답 (비인증 시):**
```json
[
  {
    "id": "xxx",
    "code": "food",
    "name": "음식",
    "likeCount": 25
  }
]
```

### 4. 파일 구조

```
src/module/tmi/
├── tmi.controller.ts   # POST /categories/:id/like, GET /categories/my-likes
└── tmi.service.ts      # toggleCategoryLike, getCategories 수정, getMyLikedCategories
```

## Implementation Plan (구현 계획)

### Phase 1: 스키마 및 마이그레이션
- [ ] CategoryLike 모델 추가
- [ ] User, Category에 relation 추가
- [ ] prisma migrate dev

### Phase 2: 좋아요 토글
- [ ] toggleCategoryLike(userId, categoryId) 구현
- [ ] POST /tmi/categories/:id/like 엔드포인트

### Phase 3: 카테고리 목록 수정
- [ ] getCategories() 수정 - likeCount, isLiked 포함
- [ ] 인증 여부에 따라 isLiked 포함/제외

### Phase 4: 내가 좋아요한 카테고리
- [ ] getMyLikedCategories(userId) 구현
- [ ] GET /tmi/categories/my-likes 엔드포인트

### Phase 5: 테스트
- [ ] toggleCategoryLike 단위 테스트
- [ ] getCategories 수정 테스트
- [ ] getMyLikedCategories 테스트

## Examples (예시)

### ✅ 좋아요 토글
```http
POST /tmi/categories/abc123/like
Authorization: Bearer <token>

→ 200 OK (처음 누름)
{ "liked": true, "likeCount": 26 }

→ 200 OK (다시 누름 - 취소)
{ "liked": false, "likeCount": 25 }
```

### ✅ 내가 좋아요한 카테고리
```http
GET /tmi/categories/my-likes
Authorization: Bearer <token>

→ 200 OK
[
  { "id": "xxx", "code": "food", "name": "음식", "likeCount": 25 },
  { "id": "yyy", "code": "science", "name": "과학", "likeCount": 12 }
]
```

### ❌ 존재하지 않는 카테고리
```http
POST /tmi/categories/invalid/like
→ 404 Not Found
```

## Trade-offs (트레이드오프)

### 장점
- 사용자 선호 카테고리 파악 가능
- 향후 개인화 TMI 추천 기반
- 인기 카테고리 분석 가능

### 단점
- CategoryLike 테이블 추가
- getCategories 쿼리 복잡도 증가

---

## Implementation Results (구현 결과)

**완료일**: 2026-02-28  
**상태**: ✅ 완료

### 구현 완료 항목

1. **스키마 추가** - `CategoryLike` 모델 생성 및 마이그레이션
2. **좋아요 토글** - `POST /tmi/categories/:id/like`
3. **카테고리 목록** - `GET /tmi/categories` (likeCount 포함, 인증 시 isLiked 포함)
4. **내가 좋아요한 카테고리** - `GET /tmi/categories/my-likes`
5. **단위 테스트** - 20개 테스트 모두 통과

### 주요 파일
- `prisma/schema.prisma` - CategoryLike 모델, User/Category relation 추가
- `src/module/tmi/tmi.service.ts` - toggleCategoryLike, getMyLikedCategories, getCategories 수정
- `src/module/tmi/tmi.controller.ts` - 새 엔드포인트 추가
- `src/module/tmi/tmi.service.spec.ts` - 테스트 추가
