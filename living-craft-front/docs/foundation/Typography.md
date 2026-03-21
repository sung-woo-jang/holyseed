# Typography

## 개요

Typography는 디자인 시스템의 핵심 요소로, 텍스트의 가독성을 보장하고 일관된 방향성을 유지하며 브랜드 아이덴티티를 전달합니다.

## Typography 토큰 시스템

디자인 시스템은 13개의 메인 타이포그래피 레벨(Typography 1-7)과 서브 레벨(sub Typography 1-13)을 포함하는 계층적 토큰 구조를 사용합니다.

### 기본 Typography 토큰 (Default)

| Token | Font Size | Line Height | 용도 |
|-------|-----------|------------|------|
| Typography 1 | 30px | 40px | 매우 큰 제목 |
| Typography 2 | 26px | 35px | 큰 제목 |
| Typography 3 | 22px | 31px | 일반 제목 |
| Typography 4 | 20px | 29px | 작은 제목 |
| Typography 5 | 17px | 25.5px | 일반 본문 |
| Typography 6 | 15px | 22.5px | 작은 본문 |
| Typography 7 | 13px | 19.5px | 선택적 읽기 |

서브 레벨은 더 세밀한 조정을 위한 중간 크기를 제공합니다.

## 접근성: 큰 텍스트 지원

시스템은 플랫폼 전반에 걸쳐 사용자의 접근성 설정에 동적으로 적응합니다.

### iOS 설정 및 웹 스케일 비율

| Native Setting | Scale Ratio | Web Typography |
|----------------|------------|-----------------|
| Large | 100% | 기본 크기 |
| xLarge | 110% | 10% 증가 |
| xxLarge | 120% | 20% 증가 |
| xxxLarge | 135% | 35% 증가 |
| A11y_Medium | 160% | 60% 증가 |
| A11y_Large | 190% | 90% 증가 |

### Android 계산 공식

Android는 100% 이상의 모든 값을 지원하고 제한된 단계로 표현할 수 없습니다.

계산 공식: `기본 폰트 크기 × NN% × 0.01` (NN%는 사용자의 텍스트 스케일 설정)

## 주요 디자인 원칙

1. **추상화**: 특정 픽셀 값을 하드코딩하지 않고 토큰을 일관되게 사용
2. **플랫폼 일관성**: iOS, Android, 웹 전반에 걸쳐 통일된 시각적 표현 유지
3. **동적 스케일링**: 사용자 접근성 기본 설정에 따라 자동으로 조정
4. **반응형 계층 구조**: 폰트 크기와 행 높이 변화를 통한 명확한 시각적 계층

## 중요한 구현 참고사항

- Typography 값을 직접 하드코딩하지 마세요
- 계산된 크기가 아닌 항상 토큰 이름을 참조하세요
- 큰 텍스트 모드에 대한 유연한 적응을 보장하세요
- 시스템 수준의 접근성 설정과 일관성을 유지하세요

## 참고 문서

- 원본 문서: https://tossmini-docs.toss.im/tds-react-native/foundation/typography/
