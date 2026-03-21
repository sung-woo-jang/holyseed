# Colors

## 개요

Toss 색상 시스템은 개발자와 디자이너를 위한 통일된 색상 명명을 제공하여, 디자인 가이드라인에 맞춰 일관된 UI 구현을 가능하게 합니다.

## 기본 사용법

색상은 `@toss/tds-react-native` 패키지에서 가져올 수 있습니다:

```javascript
import { colors } from '@toss/tds-react-native';

<View style={{ width:100, height:100, backgroundColor: colors.blue500 }} />
```

## 색상 팔레트

### 주요 색상

**Grey 시리즈** (#f9fafb부터 #191f28까지 10가지 shade)
- grey50부터 grey900까지 중립적인 톤 제공

**Blue 시리즈** (#e8f3ff부터 #194aa6까지 10가지 shade)
- blue50부터 blue900까지 주요 강조 색상

**Red 시리즈** (#ffeeee부터 #a51926까지 10가지 shade)
- red50부터 red900까지 경고 및 알림 색상

### 추가 색상 계열

- **Orange**: orange50-orange900
- **Yellow**: yellow50-yellow900
- **Green**: green50-green900
- **Teal**: teal50-teal900
- **Purple**: purple50-purple900

각 색상 계열은 50부터 900까지 10단계의 shade를 제공합니다.

### 투명도 색상

**Grey Opacity 시리즈**는 정교한 레이어링 효과를 위한 다양한 투명도 레벨(0.02부터 0.91까지)의 10가지 변형을 포함합니다.

## 배경 색상

- `colors.background`: #FFFFFF
- `colors.greyBackground`: lightThemeGrey100
- `colors.layeredBackground`: #FFFFFF
- `colors.floatedBackground`: #FFFFFF

## 색상 명명 규칙

각 색상은 일관된 명명 규칙(색상 이름 + 강도 레벨)을 따르므로, 디자인 시스템 전반에 걸쳐 예측 가능한 선택이 가능합니다.

예시:
- `colors.blue500` - 중간 강도의 파란색
- `colors.grey100` - 매우 밝은 회색
- `colors.red900` - 매우 어두운 빨간색

## 참고 문서

- 원본 문서: https://tossmini-docs.toss.im/tds-react-native/foundation/colors/
