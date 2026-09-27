# MALANG

MALANG은 하루의 대표 감정 하나를 고르고, 선택적으로 3D 얼굴·수치·한 줄 메모를 함께 남기는 로컬 우선 감정 기록 앱입니다. Expo Router, React Native, TypeScript로 개발합니다.

## 시작하기

Node.js와 npm, iOS 실행 시 Xcode/CocoaPods가 필요합니다.

```bash
npm install
npm start
```

플랫폼별 개발 빌드는 다음 명령으로 실행합니다.

```bash
npm run ios
npm run android
```

iOS 시뮬레이터 빌드에도 코드 서명이 필요합니다. `expo-secure-store`가 기록 DB의 암호키를 iOS Keychain에 보관하므로, `CODE_SIGNING_ALLOWED=NO`로 빌드하면 날짜 확인 단계에서 Keychain 권한 오류가 나고 감정 선택으로 진행할 수 없습니다. `npm run ios`를 사용하거나 Xcode에서 시뮬레이터용 로컬 서명을 켜고 빌드하세요.

## 검사

```bash
npm run typecheck
npm test
```

## 프로젝트 구조

- `app/`: Expo Router 화면과 경로
- `src/features/`: 기능별 화면과 상태
- `src/domain/`: 핵심 도메인 모델과 테스트
- `src/data/`: 로컬 데이터베이스와 저장소
- `src/design-system/`: 디자인 토큰과 공용 컴포넌트
- `assets/`: 3D 모델 등 앱 자산
- `ios/`: iOS 네이티브 프로젝트

제품 기록은 기기 로컬에 저장하며, 서버 기반 감정 분석이나 자동 해석은 MVP 범위에 포함하지 않습니다.
