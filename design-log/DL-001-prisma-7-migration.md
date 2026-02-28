# DL-001: Prisma 7 마이그레이션

**작성일**: 2026-02-28  
**상태**: 🟡 In Progress  
**작성자**: AI Assistant

---

## Background (배경)

현재 TMI Today 프로젝트는 Prisma ORM 6.13.0을 사용하고 있습니다. Prisma 7이 2025년 11월 19일에 릴리스되었으며, 성능 개선과 새로운 기능들이 추가되었습니다.

**현재 상태:**
- Prisma Client: 6.13.0
- Prisma CLI: 6.13.0
- Node.js: 확인 필요 (최소 20.19.0 필요)
- TypeScript: 5.7.3 ✅
- 데이터베이스: MySQL
- 모듈 시스템: CommonJS

**Prisma 사용 파일:**
- `src/prisma/prisma.service.ts`
- `src/module/tmi/tmi.service.ts`
- `src/module/tmi/tmi.controller.ts`
- `test/auth.e2e-spec.ts`
- `test/user.e2e-spec.ts`

## Problem (문제)

Prisma 7은 여러 Breaking Changes를 포함하고 있어 단순히 버전만 올리면 프로젝트가 동작하지 않습니다. 주요 변경사항:

1. **ES Modules 전환 필수**: CommonJS에서 ESM으로 전환 필요
2. **Generator Provider 변경**: `prisma-client-js` → `prisma-client`
3. **Output 경로 필수**: Prisma Client가 더 이상 `node_modules`에 자동 생성되지 않음
4. **Database Adapter 필요**: MySQL용 adapter 설치 필요
5. **최소 Node.js 버전**: 20.19.0 이상 필요

이러한 변경을 제대로 처리하지 않으면 빌드 실패, 런타임 에러, 테스트 실패가 발생할 수 있습니다.

## Questions and Answers

### Q1: NestJS는 ES Modules를 지원하나요?
A: NestJS는 ES Modules를 완전히 지원합니다. `tsconfig.json`에서 `"module": "ESNext"` 또는 `"ES2022"`로 설정하고, `package.json`에 `"type": "module"`을 추가하면 됩니다.

### Q2: Prisma Client를 어디에 생성해야 하나요?
A: Prisma 7에서는 `output` 경로를 명시해야 합니다. 일반적으로:
- 옵션 1: `./src/generated/prisma` (소스 코드 내)
- 옵션 2: `./generated/prisma` (루트 레벨)

**결정**: `./src/generated/prisma`를 사용하여 소스 코드와 가까이 두고 import 경로를 간단하게 유지합니다.

### Q3: 기존 데이터베이스 마이그레이션은 영향을 받나요?
A: 아니요. Prisma 7은 스키마 문법이나 마이그레이션 파일 형식을 변경하지 않습니다. 기존 마이그레이션은 그대로 유지됩니다.

### Q4: MySQL용 Database Adapter는 무엇인가요?
A: Prisma 7에서는 `@prisma/adapter-mysql` 패키지를 설치하고 PrismaClient 초기화 시 adapter를 제공해야 합니다.

### Q5: 개발 환경의 Node.js 버전이 20.19.0 미만이면?
A: Node.js를 업그레이드해야 합니다. 권장 버전은 22.x입니다.

## Design (설계)

### 1. 패키지 버전 업데이트

**package.json 변경:**
```json
{
  "type": "module",
  "dependencies": {
    "@prisma/client": "^7.0.0",
    "@prisma/adapter-mysql": "^7.0.0"
  },
  "devDependencies": {
    "prisma": "^7.0.0"
  }
}
```

### 2. TypeScript 설정 변경

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023"
  }
}
```

### 3. Prisma Schema 업데이트

**prisma/schema.prisma:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// 기존 모델들은 변경 없음
```

### 4. Prisma Client Import 경로 변경

**변경 전:**
```typescript
import { PrismaClient } from '@prisma/client';
```

**변경 후:**
```typescript
import { PrismaClient } from '../../generated/prisma/index.js';
// 또는 상대 경로에 따라 조정
```

### 5. PrismaService 업데이트 (MySQL Adapter)

**src/prisma/prisma.service.ts:**
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaAdapter } from '@prisma/adapter-mysql';
import mysql from 'mysql2/promise';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    const adapter = new PrismaAdapter(pool);
    
    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

### 6. ESM 파일 확장자 (.js) 추가

모든 import 문에 `.js` 확장자 추가 필요:
```typescript
// 변경 전
import { TmiService } from './tmi.service';

// 변경 후
import { TmiService } from './tmi.service.js';
```

### 7. .gitignore 업데이트

```gitignore
# Prisma
src/generated/
```

## Implementation Plan (구현 계획)

### Phase 1: 사전 준비 및 검증
- [ ] Node.js 버전 확인 (20.19.0 이상)
- [ ] 현재 프로젝트 백업 (git commit)
- [ ] 기존 테스트 실행하여 baseline 확보

### Phase 2: 패키지 업데이트
- [ ] `@prisma/client` 7.x로 업데이트
- [ ] `prisma` CLI 7.x로 업데이트
- [ ] `@prisma/adapter-mysql` 설치
- [ ] `mysql2` 설치 (adapter 의존성)

### Phase 3: 설정 파일 변경
- [ ] `package.json`에 `"type": "module"` 추가
- [ ] `tsconfig.json` module 설정 변경
- [ ] `prisma/schema.prisma` generator 변경
- [ ] `.gitignore` 업데이트

### Phase 4: Prisma Client 재생성
- [ ] 기존 `node_modules/.prisma` 삭제
- [ ] `npm run prisma:generate` 실행
- [ ] `src/generated/prisma` 폴더 생성 확인

### Phase 5: 코드 마이그레이션
- [ ] `src/prisma/prisma.service.ts` - MySQL Adapter 적용
- [ ] 모든 파일의 Prisma import 경로 수정
- [ ] 모든 import 문에 `.js` 확장자 추가 (ESM 요구사항)

### Phase 6: 테스트 및 검증
- [ ] `npm run build` - 빌드 성공 확인
- [ ] `npm run test` - 단위 테스트 통과 확인
- [ ] `npm run test:e2e` - E2E 테스트 통과 확인
- [ ] `npm run start:dev` - 개발 서버 실행 확인

### Phase 7: 문서화
- [ ] README.md 업데이트 (최소 Node.js 버전 명시)
- [ ] .cursorrules 업데이트 (Prisma 7 사용 명시)

## Examples (예시)

### ✅ Prisma Service (MySQL Adapter 적용)

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaAdapter } from '@prisma/adapter-mysql';
import mysql from 'mysql2/promise';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    const adapter = new PrismaAdapter(pool);
    
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

### ✅ Service에서 Prisma 사용

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class TmiService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, content: string) {
    return this.prisma.tmi.create({
      data: { userId, content },
    });
  }
}
```

### ❌ 피해야 할 패턴

```typescript
// 잘못된 import 경로 (Prisma 7에서 동작 안 함)
import { PrismaClient } from '@prisma/client';

// ESM에서 확장자 생략 (동작 안 함)
import { TmiService } from './tmi.service';
```

## Trade-offs (트레이드오프)

### 장점
1. **성능 향상**: Rust-free 클라이언트로 더 빠른 쿼리 실행
2. **번들 크기 감소**: Prisma Client 번들 크기 감소
3. **최신 기능**: Prisma 7의 새로운 기능 사용 가능
4. **모던 JavaScript**: ESM 표준 준수

### 단점
1. **Breaking Changes 많음**: 코드 전반에 걸친 수정 필요
2. **학습 곡선**: ESM 방식에 익숙하지 않으면 시간 소요
3. **의존성 증가**: Database adapter 패키지 추가 필요
4. **Migration 리스크**: 예상치 못한 이슈 발생 가능성

### 고려한 대안

**대안 1: Prisma 6 유지**
- 장점: 안정적, 변경 불필요
- 단점: 보안 업데이트 및 신규 기능 미제공 (장기적으로 deprecated)

**대안 2: 점진적 마이그레이션 (Dual Mode)**
- 장점: 리스크 분산
- 단점: Prisma 7은 ESM 전용이라 불가능

**결정**: Prisma 7으로 전환하되, 철저한 테스트와 단계별 진행으로 리스크 최소화

---

## Implementation Results (구현 결과)

### 설치 완료 (2026-02-28)
✅ **패키지 설치 완료**
- `@prisma/client`: 7.4.2
- `prisma`: 7.4.2
- `@prisma/adapter-mariadb`: 7.4.2
- `mysql2`: 3.18.2
- Node.js 버전: v24.5.0 ✅

### Prisma Schema 수정
✅ **generator 변경**
```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "mysql"
  // url 제거 - Prisma 7에서는 adapter로 전달
}
```

### 설계와의 주요 차이점

**1. Import 경로**
- 원래 설계: `import { User } from '../generated/prisma'`
- 실제 구현: `import { User } from '@prisma/client'` ✅
- 이유: Prisma 7.4.2에서 `@prisma/client`로 import해도 생성된 client를 올바르게 참조함

**2. PrismaMariaDb Adapter 사용법**
- 원래 설계: `new PrismaMariaDb(pool)` 형태
- 실제 구현: `new PrismaMariaDb(databaseUrl)` 형태로 URL 직접 전달 ✅
- 이유: MariaDB adapter가 URL 문자열을 직접 받을 수 있음

**3. ESM 전환 불필요**
- 원래 설계: ES Modules 전환 필요하다고 예상
- 실제 구현: CommonJS로 유지 가능 ✅
- `moduleFormat = "cjs"` 옵션으로 NestJS와 완벽히 호환

### 적용된 파일들
✅ **수정 완료**
1. `prisma/schema.prisma` - generator 및 datasource 수정
2. `.gitignore` - `src/generated/` 추가
3. `src/prisma/prisma.service.ts` - MariaDB adapter 적용
4. `src/module/tmi/tmi.service.ts` - import 경로 수정
5. `src/module/tmi/tmi.controller.ts` - import 경로 수정

⏳ **남은 작업**
- `test/auth.e2e-spec.ts` - adapter 적용 필요
- `test/user.e2e-spec.ts` - adapter 적용 필요
- 빌드 및 테스트 검증
- README.md 업데이트

### Prisma Client 생성
✅ `npm run prisma:generate` 성공
```
✔ Generated Prisma Client (7.4.2) to .\src\generated\prisma in 39ms
```

### 배운 점
1. Prisma 7은 CommonJS도 완전히 지원하므로 NestJS 프로젝트에서 ESM 전환이 필수가 아님
2. `@prisma/adapter-mariadb`는 MySQL과 완벽히 호환됨
3. Prisma 7의 import는 여전히 `@prisma/client`를 사용하며, output 경로는 내부적으로 처리됨
4. Database URL을 schema.prisma에서 제거하고 adapter로 전달하는 방식이 Prisma 7의 새로운 패턴
