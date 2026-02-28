# Design Log

이 폴더는 TMI Today 프로젝트의 주요 설계 결정과 아키텍처 변경사항을 기록합니다.

## Design Log란?

Design Log는 새로운 기능이나 아키텍처 변경을 **코드를 작성하기 전에** 설계하고 검토하는 문서입니다.

### 왜 필요한가?

1. **AI와의 협업 개선**: AI가 프로젝트의 이전 설계 결정을 이해하고 일관된 코드를 생성
2. **설계 검토**: 마크다운으로 설계를 먼저 검토하면 코드 변경보다 "저렴"
3. **의사결정 추적**: 왜 이렇게 만들었는지 기록으로 남음
4. **컨텍스트 유지**: 프로젝트가 커져도 이전 결정을 쉽게 참조

## 파일 명명 규칙

```
DL-[번호]-[기능명].md

예시:
- DL-001-category-based-tmi.md
- DL-002-user-preference-system.md
- DL-003-tmi-rating-feature.md
```

## 작성 방법

1. `TEMPLATE.md`를 복사하여 새 파일 생성
2. 배경, 문제, 설계, 구현 계획 작성
3. 불명확한 부분은 "Questions and Answers" 섹션에 질문으로 남기기
4. 검토 및 승인
5. 구현 시작
6. 구현하면서 "Implementation Results" 섹션 업데이트

## 기존 Design Logs

현재까지 작성된 Design Log가 없습니다. 첫 번째 로그를 만들어보세요!
