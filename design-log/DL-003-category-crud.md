# DL-003: 카테고리 추가/수정/삭제 (CRUD)

**작성일**: 2026-02-28  
**상태**: ✅ Completed  
**작성자**: AI Assistant

---

## Background (배경)

DL-002에서 카테고리 목록 조회(GET /tmi/categories)만 구현됨. 카테고리를 동적으로 관리하려면 추가·수정·삭제 API가 필요함.

**현재 상태:**
- GET /tmi/categories - 목록 조회 (공개)
- Category: id, code, name
- 시드 데이터로 6개 카테고리 고정

## Problem (문제)

1. 새 카테고리 추가 불가 (예: "스포츠", "영화")
2. 카테고리 이름/코드 수정 불가
3. 카테고리 삭제 불가
4. 관리자 역할 없음 - 누가 CRUD를 수행할지 정의 필요

## Questions and Answers

### Q1: 카테고리 CRUD는 누가 할 수 있나요?
A: *현재 관리자(admin) 역할이 없으므로, 로그인한 모든 사용자가 CRUD 가능. 추후 admin 역할 추가 시 제한 가능.*

### Q2: 카테고리 삭제 시 해당 카테고리의 TMI는 어떻게 되나요?
A: *categoryId를 null로 설정(SetNull). TMI 데이터는 유지되고, 카테고리만 연결 해제.*

### Q3: code 수정이 가능한가요?
A: *가능. 단, code는 unique이므로 중복 불가. 기존 TMI의 categoryId는 FK로 id를 참조하므로 code 변경해도 영향 없음.*

## Design (설계)

### 1. 스키마 변경

**Tmi 모델 - onDelete 추가:**
```prisma
model Tmi {
  ...
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
}
```
카테고리 삭제 시 해당 TMI의 categoryId가 null로 설정됨.

### 2. API 설계

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | /tmi/categories | 목록 조회 | 불필요 |
| POST | /tmi/categories | 카테고리 생성 | 필요 |
| PATCH | /tmi/categories/:id | 카테고리 수정 | 필요 |
| DELETE | /tmi/categories/:id | 카테고리 삭제 | 필요 |

### 3. DTO

**CreateCategoryDto:**
```typescript
{
  code: string;   // 필수, 영문 소문자+숫자+언더스코어
  name: string;   // 필수
}
```

**UpdateCategoryDto:**
```typescript
{
  code?: string;  // 선택
  name?: string;  // 선택
}
```

### 4. 검증 규칙
- code: 1~50자, 영문 소문자/숫자/언더스코어만 (`^[a-z0-9_]+$`)
- name: 1~100자
- 생성 시 code 중복 → 409 Conflict
- 수정/삭제 시 존재하지 않는 id → 404 Not Found

### 5. 파일 구조

```
src/module/tmi/
├── dto/
│   ├── create-category.dto.ts
│   └── update-category.dto.ts
├── tmi.controller.ts   # POST, PATCH, DELETE 추가
└── tmi.service.ts     # createCategory, updateCategory, deleteCategory
```

## Implementation Plan (구현 계획)

### Phase 1: 스키마 및 마이그레이션
- [ ] Tmi.category relation에 onDelete: SetNull 추가
- [ ] prisma migrate dev

### Phase 2: DTO 및 서비스
- [ ] CreateCategoryDto, UpdateCategoryDto 생성
- [ ] createCategory, updateCategory, deleteCategory 메서드 구현

### Phase 3: 컨트롤러
- [ ] POST /tmi/categories
- [ ] PATCH /tmi/categories/:id
- [ ] DELETE /tmi/categories/:id
- [ ] JwtAuthGuard 적용

### Phase 4: 테스트
- [ ] 단위 테스트
- [ ] E2E 테스트 (선택)

## Examples (예시)

### ✅ 생성
```http
POST /tmi/categories
Authorization: Bearer <token>
Content-Type: application/json

{ "code": "sports", "name": "스포츠" }

→ 201 Created
{ "id": "xxx", "code": "sports", "name": "스포츠" }
```

### ✅ 수정
```http
PATCH /tmi/categories/xxx
Authorization: Bearer <token>
{ "name": "스포츠·운동" }

→ 200 OK
{ "id": "xxx", "code": "sports", "name": "스포츠·운동" }
```

### ✅ 삭제
```http
DELETE /tmi/categories/xxx
Authorization: Bearer <token>

→ 200 OK (또는 204 No Content)
```

### ❌ code 중복
```http
POST /tmi/categories
{ "code": "food", "name": "음식2" }

→ 409 Conflict
```

## Trade-offs (트레이드오프)

### 장점
- 카테고리 동적 관리 가능
- 시드 데이터 의존성 제거

### 단점
- 현재는 모든 로그인 사용자가 CRUD 가능 (권한 제어 없음)
- code 변경 시 기존 클라이언트가 code로 요청하면 404 가능 (id는 유지되므로 TMI 참조는 안전)

---

## Implementation Results (구현 결과)

### 완료 (2026-02-28)

**Phase 1** ✅ Tmi.category에 onDelete: SetNull 추가
**Phase 2** ✅ CreateCategoryDto, UpdateCategoryDto, createCategory, updateCategory, deleteCategory 구현
**Phase 3** ✅ POST/PATCH/DELETE /tmi/categories 엔드포인트 (JwtAuthGuard 적용)
**Phase 4** ✅ 단위 테스트 7개 추가 (14/14 통과)

### 검증 규칙
- code: `^[a-z0-9_]+$`, 1~50자
- name: 1~100자
- code 중복 → 409 Conflict
- 존재하지 않는 id → 404 NotFound
