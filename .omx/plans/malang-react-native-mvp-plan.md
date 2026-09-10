---
plan_id: malang-react-native-mvp-v1
title: MALANG React Native MVP 통합 구현 계획
status: ready
language: ko-KR
updated_at: 2026-09-11
source_requirements: documents/MALANG_software_uiux_design_requirements_v3.0.docx
implementation_mode: expo-development-build
platforms:
  - ios
  - android
---

# MALANG React Native MVP 통합 구현 계획

## 1. Requirements Summary

### 제품 원칙

- 사용자의 감정을 추정·분석·평가하지 않는다.
- 사용자가 직접 고르고 빚어 남긴 기록을 그대로 보관한다.
- 대표 감정 하나만 선택해도 저장할 수 있다.
- 얼굴 조형, 하루 수치, 한 줄 메모는 모두 선택 사항이다.
- 감정 기록은 운영 서버로 보내지 않고 기기 로컬에 저장한다.
- 홈의 놀이 동작과 기록용 얼굴 조형 상태를 분리한다.
- Life Graph는 분석 리포트가 아니라 과거 기록을 다시 여는 탐색 인터페이스다.

### MVP 포함 범위

- 오늘: 3D 말랑이, 날짜, 오늘 남기기, 저장되지 않는 플레이 인터랙션
- 감정 탐색: 약 43개 데이터 기반 카드, 보조 검색, 대표 감정 하나 선택
- Quick Sculpt: 눈썹·눈·입 직접 조형, Undo, Reset, 건너뛰기
- Face Studio: 얼굴 형상과 색·재질·장식 편집의 분리
- 기록: 감정, immutable face snapshot, nullable 수치·메모, 회상 플래그
- 기록 회수: 날짜별 목록, 상세, 회상 표시
- Life Graph: 주·월·년·전체, 값이 있는 날만 점 표시, 점에서 상세 진입
- 데이터: 암호화된 로컬 저장, versioned JSON 내보내기·가져오기
- 디자인 시스템: 컬러·타이포·간격·모션·카피 토큰
- 접근성: Dynamic Type, VoiceOver/TalkBack, Reduce Motion, 44pt 터치 영역

### 제외 범위

- 계정, 서버 동기화, AI 분석·추천·요약
- Energy, 태그, Factor, 원인·상관관계 자동 도출
- 임상 진단·치료, 강제 스트릭·점수·랭킹·긍정 보상
- 웹, 다크 모드, 결제 구현

## 2. Architecture Decisions

### 애플리케이션 기반

- React Native + TypeScript + 최신 안정 Expo SDK를 사용한다.
- Expo Go가 아니라 `expo-dev-client` 기반 Development Build를 사용한다.
- Expo CNG/Prebuild와 config plugin으로 네이티브 설정을 재현 가능하게 관리한다.
- 패키지 버전은 기술 스파이크 통과 후 lockfile로 고정한다.
- 바닐라 React Native 전환은 3D 기술 스파이크가 실패하고 Expo config plugin으로 해결할 수 없을 때만 재검토한다.

### 주요 라이브러리

- Navigation: Expo Router typed routes
- 2D UI: NativeWind v4 안정 버전
- Animation/Gesture: React Native Reanimated + Gesture Handler
- 3D: React Native Filament + GLB morph targets/bones
- Graph: react-native-svg 기반 경량 커스텀 그래프
- Local DB: `expo-sqlite` + SQLCipher
- Secrets: Expo SecureStore
- Ephemeral state: Zustand
- Runtime validation: Zod
- Files: Expo FileSystem, DocumentPicker, Sharing

### 상태 소유권

- SQLite가 저장 기록과 현재 appearance의 유일한 영속 원본이다.
- Zustand에는 새 기록 draft, Undo stack, 화면 일시 상태만 둔다.
- 홈 플레이 state, 작성 draft, 저장 snapshot을 별도 store/타입으로 분리한다.
- 홈 플레이 이벤트에서는 repository write API에 접근할 수 없게 모듈 경계를 둔다.

## 3. Planned Project Structure

```text
src/
  app/
    _layout.tsx
    (tabs)/
      _layout.tsx
      today.tsx
      records/
        index.tsx
        graph.tsx
    entry/
      new/
        emotion.tsx
        sculpt.tsx
        details.tsx
      [date].tsx
    face-studio.tsx
    settings/data.tsx
  design-system/
    tokens/
    components/
    copy/
  features/
    malang-3d/
    entry-draft/
    emotions/
    records/
    life-graph/
    backup/
  data/
    db/
    repositories/
    migrations/
  domain/
    models/
    validation/
assets/
  fonts/
  models/
  emotions/
```

## 4. Design System

### 컬러 primitives

| Token | Value | 역할 |
|---|---:|---|
| `milk.50` | `#FBF8F2` | 앱 전체 배경 |
| `milk.100` | `#F5F2ED` | 카드·시트·입력 |
| `mist.400` | `#8097B8` | 주요 액션·선택 |
| `mist.100` | `#DCE5F0` | 약한 선택 배경 |
| `mint.300` | `#B7D7CF` | 보조 인터랙션 |
| `lavender.400` | `#A8A0C7` | 제한적 포인트 |
| `lavender.100` | `#E9E4F2` | 약한 장식 surface |
| `peach.300` | `#E8BEB0` | 따뜻한 포인트 |
| `butter.300` | `#E6D39B` | 보조 장식 |
| `ink.900` | `#1F2024` | 주요 텍스트 |
| `ink.600` | `#69686D` | 보조 텍스트 |
| `border.default` | `#DED9D1` | 경계선 |
| `focus.ring` | `#526987` | focus·pressed |
| `destructive.600` | `#9C4A4A` | 삭제·복원 위험 |
| `destructive.100` | `#F4E2DE` | 위험 안내 배경 |

### semantic aliases

- `bg.canvas`, `bg.surface`, `bg.selected`
- `text.primary`, `text.secondary`
- `action.primary`, `action.primaryPressed`, `action.subtle`
- `border.default`, `focus.ring`
- `status.destructive`, `status.destructiveSurface`
- `overlay.scrim = rgba(31,32,36,0.32)`

화면 코드에서 HEX와 raw palette를 직접 사용하지 않는다. Mist 채움 버튼 전경은 Ink를 사용한다. 색상은 감정의 의미나 좋고 나쁨을 표시하지 않는다.

### 타이포그래피

- Font: Pretendard static 400/500/600/700
- Display: 32/40, 700
- Title: 24/32, 700
- Heading: 20/28, 600
- Body: 16/24, 400
- Body Small: 14/20, 400
- Label: 14/20, 600
- Caption: 12/16, 400
- Graph Number: 28/36, 600, tabular numerals

### 기타 토큰

- Spacing: 4pt grid
- Radius: 12, 20, full
- Minimum hit area: 44×44pt
- Motion: `fast`, `normal`, `slow`, `springSoft`, `springPlay`
- MVP theme: light only

### 기반 컴포넌트

- Text, Button, IconButton, Card, Input, Sheet
- SelectionCard, EmptyState, InlineNotice, ErrorMessage
- SegmentedControl, SliderField, ScreenHeader
- 개발 전용 Design/Copy Gallery

## 5. UI Copy System

### Voice: 조용한 보관자

- 앱은 상담사, 코치, AI 친구처럼 말하지 않는다.
- 설명은 짧은 해요체, 버튼은 명확한 동사형을 사용한다.
- 한 화면에서 감정성 문장은 최대 한 개만 사용한다.
- 질문으로 답변을 강요하기보다 화면의 역할과 선택 가능성을 알린다.
- 사실, 선택권, 다음 행동 순으로 작성한다.

### 금지 표현

- 분석, 진단, 치유, 마음 관리, 성장, 개선, 긍정, 성공
- 오늘도 놓치지 마세요, N일째 성공, 잘했어요, 수고했어요
- 당신의 감정을 이해했어요, 말랑이가 응원해요
- 더 나은 내가 되어 보세요, 마음이 건강해지고 있어요
- 좋은 감정, 나쁜 감정, 위험 점수, 이번 주 성적

### 확정 화면 카피

| 화면/상태 | 제목·설명 | CTA |
|---|---|---|
| 하단 탭 | `오늘` / `기록` | — |
| 기록 전환 | `날짜별` / `흐름` | — |
| 오늘 | `남기고 싶은 마음이 있을 때 시작할 수 있어요.` | `오늘 남기기` |
| 홈 안내 | `말랑이를 눌러볼 수 있어요.` / `이 동작은 기록으로 남지 않아요.` | — |
| 감정 선택 | `오늘의 대표 감정` / `하나만 골라도 기록할 수 있어요.` | `다음` |
| 검색 | `감정 찾기` | — |
| Quick Sculpt | `표정 빚기` / `원하면 얼굴을 직접 바꿔볼 수 있어요.` | `건너뛰기`, `다음` |
| 조형 제어 | `되돌리기`, `처음으로` | `더 자세히 만들기` |
| 수치 | `하루 수치` / `남기고 싶을 때만 선택하세요.` | `선택 안 함` |
| 메모 | `한 줄 메모 · 선택` / `기억하고 싶은 말을 남겨도 좋아요.` | `기록 보관하기` |
| 완료 | `기록을 보관했어요.` | `기록 보기`, `오늘로 돌아가기` |
| 기록 빈 상태 | `아직 보관한 기록이 없어요.` / `남기고 싶은 날부터 시작할 수 있어요.` | `기록 남기기` |
| 그래프 | `기록의 흐름` / `숫자를 남긴 날만 점으로 보여요.` | `주`, `월`, `년`, `전체` |
| 그래프 빈 상태 | `아직 숫자를 남긴 기록이 없어요.` | `날짜별 기록 보기` |
| 과거 기록 | `지난 날짜의 기록` / `회상으로 따로 보관돼요.` | `회상으로 남기기` |
| 데이터 | `기록은 이 기기에 저장돼요.` | `백업 내보내기`, `백업 가져오기` |

### 오류 패턴

오류는 `발생한 일 + 사용자가 할 수 있는 다음 행동`으로 작성한다.

- `백업 파일을 읽지 못했어요. 다른 파일을 선택해 주세요.`
- `저장하지 못했어요. 기록은 이 화면에 남아 있어요.`
- `같은 날짜의 기록이 있어요.`
- 충돌 선택: `기기에 있는 기록 유지` / `백업 기록으로 바꾸기`
- `앗!`, `Oops`, 과잉 사과, 기술 오류 코드의 직접 노출을 금지한다.

### 카피 리뷰 체크

1. 아주 힘든 날 읽어도 사실인가?
2. 감정을 해석·평가·개선한다고 암시하지 않는가?
3. 기록하지 않아도 죄책감을 만들지 않는가?
4. 다른 AI 감정 앱에 그대로 붙일 수 있는 일반론은 아닌가?
5. 사용자가 다음에 할 수 있는 행동이 분명한가?

## 6. Navigation and Flow

### Primary flow

```text
오늘
  -> 오늘 남기기
  -> 대표 감정 선택
  -> 표정 빚기 또는 건너뛰기
  -> nullable 하루 수치 + nullable 한 줄 메모
  -> 기록 보관하기
  -> 기록 상세 또는 오늘
```

- 작성 중 뒤로 가면 draft를 유지한다.
- 작성 취소 시에만 draft 폐기 확인을 표시한다.
- 저장 후 작성 route를 `replace`하여 중복 제출을 방지한다.
- 과거 날짜도 같은 흐름을 사용하고 최초 저장 시 회상 여부를 계산한다.
- 기존 날짜에 기록이 있으면 신규 작성 대신 상세와 명시적 수정 진입을 제공한다.

## 7. 3D and Asset Pipeline

### 기술 스파이크

일반 화면 구현 전에 최소 GLB로 다음을 iOS와 Android 실기기에서 검증한다.

- model load/unload와 background/foreground 복귀
- 여러 morph target의 동시 연속 변경
- brow, eye, mouth gesture mapping
- Reanimated/worklet과 Filament 연동
- 저장 snapshot 재적용 정확성
- 10분 조작 후 crash·지속 메모리 증가 없음
- 기준 실기기에서 조형 중 평균 50fps 이상

### Blender/GLB 계약

- neutral mesh를 모든 새 기록의 기준으로 사용한다.
- 얼굴 anchor, brow/eye/mouth node, morph target에 안정적인 이름을 부여한다.
- Face Studio용 width, length, skew, tilt, volume morph target을 포함한다.
- 홈용 blink, breath, squash/stretch, spring-back animation을 분리한다.
- 기본 색상, material, decoration slot을 감정 의미와 분리한다.
- 앱에서 mesh topology를 변경하지 않고 parameter/morph weight만 저장한다.

### FaceParametersV1

```ts
type FaceParametersV1 = {
  version: 1;
  brows: {
    left: { centerY: number; outerY: number };
    right: { centerY: number; outerY: number };
  };
  eyes: {
    left: { openness: number; tilt: number; scaleX: number; scaleY: number };
    right: { openness: number; tilt: number; scaleX: number; scaleY: number };
  };
  mouth: {
    leftCornerY: number;
    rightCornerY: number;
    openness: number;
  };
  face: {
    width: number;
    length: number;
    skewX: number;
    tilt: number;
    volume: number;
  };
};
```

- openness는 0..1, 나머지 조형 파라미터는 -1..1로 clamp한다.
- Undo는 변경 gesture 하나를 history item 하나로 기록한다.
- Reset은 neutral vector로 복원한다.
- VoiceOver/TalkBack 사용자를 위해 같은 값을 변경하는 접근 가능한 slider UI를 제공한다.

## 8. Data Model and Backup Contract

### 영속 모델

```ts
type DailyEntry = {
  date: string;                 // YYYY-MM-DD local calendar date, unique
  emotionId: string;
  value: number | null;         // -20..20; initial null
  note: string | null;          // single-line, max 120 chars
  faceSnapshot: FaceSnapshotV1;
  createdAt: string;            // UTC ISO timestamp
  timezoneOffsetMinutes: number;
  retrospectiveFlag: boolean;
};

type FaceSnapshotV1 = {
  version: 1;
  parameters: FaceParametersV1;
  appearance: {
    baseColor: string;
    materialId: string;
    decorationIds: string[];
  };
};
```

### DB 정책

- `DailyEntry.date`에 unique constraint를 둔다.
- `PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`을 적용한다.
- 사용자 입력은 prepared statement 또는 안전한 parameter binding만 사용한다.
- 현재 appearance 수정은 과거 snapshot을 update하지 않는다.
- 기존 entry 수정은 사용자의 해당 기록 수정 행동에서만 허용한다.

### BackupV1

```ts
type BackupV1 = {
  schemaVersion: 1;
  exportedAt: string;
  appVersion: string;
  appearance: MalangAppearance;
  entries: DailyEntry[];
  checksum: string;
};
```

- 확장자: `.malang.json`
- 내보내기 전 민감 정보 포함 안내를 표시한다.
- 가져오기 순서: 임시 파일 복사 -> 크기 제한 -> Zod validation -> checksum -> schema migration -> 변경 미리보기 -> transaction.
- 날짜 충돌 기본값은 `기기에 있는 기록 유지`다.
- 사용자가 선택하면 충돌 날짜만 `백업 기록으로 바꾸기`를 적용한다.
- 하나라도 실패하면 전체 rollback한다.

## 9. Emotion Catalog

- 약 43개 감정을 stable ID, display name, browse order, optional group으로 제공한다.
- 감정 카드에는 일상 감정어만 사용한다.
- 임상명, 성격 판단, 도덕 판단을 제외한다.
- `긍정/부정`, `좋음/나쁨` 그룹을 사용하지 않는다.
- 그룹이 필요하면 `기대·설렘`, `걱정·불안`, `화남·답답함`, `지침·무거움`, `평온·안도`처럼 단어 묶음으로 표시한다.
- KOTE 43 감정 분류는 어휘 coverage 검토 자료로만 사용하고 자동 분류나 색상 매핑에는 사용하지 않는다.

## 10. Implementation Steps

### Phase 0 — 기술 스파이크와 프로젝트 확정

1. Expo Development Build 프로젝트를 생성한다.
2. Expo Router, NativeWind v4, Reanimated, Gesture Handler를 설정한다.
3. Filament 최소 GLB를 양 플랫폼에서 검증한다.
4. SQLCipher DB open/key recovery를 양 플랫폼에서 검증한다.
5. 통과한 dependency 조합을 lockfile로 고정한다.

### Phase 1 — 디자인·카피 기반

1. 색상, 타이포, 간격, radius, motion 토큰을 작성한다.
2. NativeWind theme와 TypeScript token export를 동일 원본에서 생성한다.
3. 공통 컴포넌트와 Design/Copy Gallery를 구현한다.
4. contrast와 금지 카피 lint/check를 CI에 추가한다.

### Phase 2 — 데이터 기반

1. SQLCipher key lifecycle과 SQLite provider를 구현한다.
2. migration, repository, emotion seed를 구현한다.
3. domain schema, date/retrospective 계산, snapshot 직렬화를 구현한다.
4. repository unit/integration tests를 작성한다.

### Phase 3 — 3D와 Face Studio

1. production GLB와 명명 계약을 확정한다.
2. renderer adapter와 FaceParameters mapping을 구현한다.
3. 홈 플레이 인터랙션을 transient state로 구현한다.
4. Quick Sculpt gesture, Undo, Reset을 구현한다.
5. Face Studio의 조형/외형 구분과 접근 가능한 slider 대안을 구현한다.

### Phase 4 — 기록 흐름

1. Today, Emotion Browser, Sculpt, Details routes를 구현한다.
2. nullable value/note와 0 미선택 상태를 검증한다.
3. 저장 transaction과 완료 화면을 구현한다.
4. 과거 날짜·기존 날짜 진입 정책을 구현한다.

### Phase 5 — 기록 회수와 Life Graph

1. 날짜별 목록, 상세, 회상 배지를 구현한다.
2. 주·월·년·전체 기간 query를 구현한다.
3. 값 있는 날짜만 graph point를 생성한다.
4. 누락 날짜에서 선을 끊고 point에서 상세로 이동한다.

### Phase 6 — 백업, 접근성, 출시 품질

1. versioned export/import와 충돌 UI를 구현한다.
2. Dynamic Type, screen reader, Reduce Motion을 검수한다.
3. 오류·빈 상태·카피를 최종 검수한다.
4. 내부 build와 양 플랫폼 비공개 beta를 배포한다.
5. 요구사항 A01~A16 회귀 후 출시한다.

## 11. Acceptance Criteria

- [ ] 앱 첫 화면에서 말랑이, 날짜, `오늘 남기기`를 한 화면에서 확인할 수 있다.
- [ ] 홈 말랑이 조작 후 DB row와 작성 draft가 변경되지 않는다.
- [ ] 검색 없이 감정 카드만으로 대표 감정 하나를 선택할 수 있다.
- [ ] 감정 선택만으로 나머지 선택 단계를 건너뛰고 저장할 수 있다.
- [ ] 새 기록의 수치가 `null`이며 0이 자동 선택되지 않는다.
- [ ] 좌우 입꼬리와 얼굴 비대칭을 독립적으로 조절할 수 있다.
- [ ] gesture 중 morph 반영이 연속적이고 Undo/Reset이 동작한다.
- [ ] 같은 감정을 다시 선택해도 과거 얼굴이 시작값으로 사용되지 않는다.
- [ ] 현재 appearance 수정 후 과거 entry snapshot byte representation이 변하지 않는다.
- [ ] 값 없는 기록도 날짜별 목록과 상세에서 조회할 수 있다.
- [ ] 그래프는 값 없는 날에 점을 만들거나 선으로 보간하지 않는다.
- [ ] graph point 선택 시 해당 날짜 상세가 열린다.
- [ ] UI에 감정 분석, 원인, 상관관계, 평균 기분, 진단 문구가 없다.
- [ ] 색상만으로 감정 종류와 상태를 구분하지 않는다.
- [ ] 텍스트 대비 4.5:1, 주요 비텍스트 요소 3:1 기준을 통과한다.
- [ ] 전체 기록을 `.malang.json`으로 내보내고 새 DB에 복원할 수 있다.
- [ ] 잘못된 checksum/schema의 백업은 DB를 변경하지 않는다.
- [ ] 운영 서버와 AI 없이 airplane mode에서 핵심 기록 루프가 동작한다.
- [ ] 생산 로그·crash context에 emotion, value, note, snapshot이 포함되지 않는다.
- [ ] 확정 카피가 금지 표현과 카피 리뷰 체크를 통과한다.

## 12. Verification Plan

### Unit

- token alias와 WCAG contrast
- FaceParameters clamp, gesture mapping, Undo/Reset
- date/timezone/retrospective 계산
- nullable value/note validation
- graph segment 생성과 missing-day break
- backup checksum, schema validation, collision policy

### Integration

- migration 전후 데이터 보존
- SQLCipher key 재사용과 앱 재시작 복구
- 저장 transaction과 snapshot immutability
- export -> 빈 DB import round trip
- background/foreground 후 Filament scene 복원

### E2E

- 오늘 기록 전체 흐름
- Quick Sculpt 건너뛰기
- 0 직접 선택과 미선택 구분
- 과거 날짜 회상 기록
- 값 없는 기록 조회
- graph point 상세 진입
- 백업 내보내기·가져오기·충돌 처리
- 앱 재시작 및 airplane mode 동작

### 실기기/사용성

- iOS와 Android 각각 최소 한 대의 중급 기기에서 3D 10분 soak test
- 조형 중 평균 50fps 이상, touch feedback이 눈에 띄게 지연되지 않음
- VoiceOver/TalkBack로 기록 흐름 완료
- 한국 사용자 12~15명에게 압박감, 판단감, 자연스러움, 다음 행동 명확성을 7점 척도로 검증
- 질문형/중립형/권유형 카피를 비교하고 중립형을 기본 control로 사용

## 13. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Filament/Expo 호환성 또는 crash | Phase 0 양 플랫폼 spike를 선행하고 통과 전 화면 개발을 확대하지 않는다. |
| morph target 과다로 인한 성능 저하 | 동시에 활성화되는 target 수, mesh vertex, texture 크기에 예산을 두고 실기기 profiling한다. |
| 2D handle과 3D 얼굴 위치 불일치 | 고정 카메라와 model anchor projection을 사용하고 orientation별 layout test를 둔다. |
| snapshot schema 변경 | snapshot version과 migration adapter를 분리한다. |
| 민감한 백업 파일 노출 | export 직전 포함 데이터와 평문 파일임을 명확히 안내한다. |
| 카피가 상담·분석처럼 변질 | 금지어 사전, Copy Gallery, merge checklist, 사용자 테스트를 운영한다. |
| 그래프가 감정 성적표로 인식 | 평균·평가·보간을 금지하고 상세 탐색 affordance만 제공한다. |
| 위기 도움 정보가 오래됨 | 설정의 사용자 선택 화면에 제공하고 출시마다 공식 번호를 재검증한다. |

## 14. External Evidence Used

- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Expo custom native code: https://docs.expo.dev/workflow/customizing/
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo SQLite/SQLCipher: https://docs.expo.dev/versions/v56.0.0/sdk/sqlite/
- NativeWind stable installation: https://www.nativewind.dev/docs/getting-started/installation
- React Native Filament: https://github.com/margelo/react-native-filament
- Filament morph API: https://margelo.github.io/react-native-filament/docs/api/interfaces/RenderableManager
- Apple UI writing guidance: https://developer.apple.com/design/human-interface-guidelines/writing
- NN/g error-message guidance: https://www.nngroup.com/articles/error-message-guidelines/
- Self-determination theory health meta-analysis: https://pubmed.ncbi.nlm.nih.gov/26168470/
- Affect labeling research: https://pubmed.ncbi.nlm.nih.gov/22902568/
- Free emotion labeling research: https://pubmed.ncbi.nlm.nih.gov/39344959/
- KOTE Korean emotion dataset: https://arxiv.org/abs/2205.05300
- Korean app references: Trost, MindCafe, 오늘은…, 퐁글, Komorebi app-store/product pages
- Current Korean crisis-resource verification: https://www.mohw.go.kr/menu.es?mid=a10716040000

## 15. Execution Handoff

- 이 문서는 구현 착수용 ready plan이다.
- 우선 실행 대상은 Phase 0의 Expo/Filament/SQLCipher 기술 스파이크다.
- Phase 0 통과 전 production 3D asset과 전체 화면 구현에 큰 비용을 투입하지 않는다.
- 각 phase 완료 시 Acceptance Criteria와 Verification Plan의 관련 항목을 증거와 함께 갱신한다.
