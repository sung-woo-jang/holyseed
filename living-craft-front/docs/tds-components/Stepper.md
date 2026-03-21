# Stepper

Stepper 컴포넌트는 여러 순차적인 단계를 시각화하는 컴포넌트예요. 각 단계는 제목과 설명을 가질 수 있으며, 오른쪽에 아이콘이나 버튼을 추가할 수 있어요.

## 사용 예제

### 기본 사용

StepperRow를 사용하려면 left, center를 지정하세요.

```tsx
import { StepperRow } from '@toss/tds-react-native';

<StepperRow
  left={<StepperRow.NumberIcon number={1} />}
  center={<StepperRow.Texts type="A" title="첫 번째 단계" description="단계에 대한 설명이에요" />}
/>
```

### 여러 단계 표시

여러 StepperRow를 함께 사용해 프로세스를 표시할 수 있어요.

```tsx
<View>
  <StepperRow
    left={<StepperRow.NumberIcon number={1} />}
    center={<StepperRow.Texts type="A" title="계정 생성" description="이메일과 비밀번호를 입력하세요" />}
  />
  <StepperRow
    left={<StepperRow.NumberIcon number={2} />}
    center={<StepperRow.Texts type="A" title="정보 입력" description="기본 정보를 입력하세요" />}
  />
  <StepperRow
    left={<StepperRow.NumberIcon number={3} />}
    center={<StepperRow.Texts type="A" title="완료" description="가입이 완료되었어요" />}
    hideLine
  />
</View>
```

### 텍스트 스타일 변형

StepperRow.Texts의 type으로 텍스트 스타일을 변경할 수 있어요.

```tsx
{/* Type A: 일반 제목 (t5), 일반 설명 (t6) */}
<StepperRow
  left={<StepperRow.NumberIcon number={1} />}
  center={<StepperRow.Texts type="A" title="Type A" description="일반 스타일이에요" />}
/>

{/* Type B: 큰 제목 (t4), 일반 설명 (t6) */}
<StepperRow
  left={<StepperRow.NumberIcon number={2} />}
  center={<StepperRow.Texts type="B" title="Type B" description="큰 제목 스타일이에요" />}
/>

{/* Type C: 일반 제목 (t5), 작은 설명 (t7) */}
<StepperRow
  left={<StepperRow.NumberIcon number={3} />}
  center={<StepperRow.Texts type="C" title="Type C" description="작은 설명 스타일이에요" />}
  hideLine
/>
```

### Asset과 함께 사용

왼쪽에 Asset을 사용할 수 있어요.

```tsx
<StepperRow
  left={
    <StepperRow.AssetFrame>
      <Asset.Icon name="check" color="green" />
    </StepperRow.AssetFrame>
  }
  center={<StepperRow.Texts type="A" title="완료" description="작업이 완료되었어요" />}
/>
```

### 오른쪽 화살표

오른쪽에 화살표 아이콘을 추가할 수 있어요.

```tsx
<StepperRow
  left={<StepperRow.NumberIcon number={1} />}
  center={<StepperRow.Texts type="A" title="계정 설정" description="계정 정보를 확인하세요" />}
  right={<StepperRow.RightArrow />}
  onPress={() => navigate('/account')}
/>
```

### 오른쪽 버튼

오른쪽에 버튼을 추가할 수 있어요.

```tsx
<StepperRow
  left={<StepperRow.NumberIcon number={1} />}
  center={<StepperRow.Texts type="A" title="인증" description="본인 인증이 필요해요" />}
  right={<StepperRow.RightButton onPress={handleVerify}>인증하기</StepperRow.RightButton>}
/>
```

### 회원가입 프로세스

회원가입 단계를 표시할 수 있어요.

```tsx
const [currentStep, setCurrentStep] = useState(1);

<View>
  <StepperRow
    left={<StepperRow.NumberIcon number={1} completed={currentStep > 1} />}
    center={
      <StepperRow.Texts
        type="B"
        title="이메일 입력"
        description={currentStep === 1 ? "이메일을 입력하세요" : "hong@example.com"}
      />
    }
    right={currentStep === 1 ? <StepperRow.RightButton>다음</StepperRow.RightButton> : <Asset.Icon name="check" color="green" />}
  />
  <StepperRow
    left={<StepperRow.NumberIcon number={2} completed={currentStep > 2} />}
    center={
      <StepperRow.Texts
        type="B"
        title="비밀번호 설정"
        description={currentStep < 2 ? "다음 단계" : currentStep === 2 ? "비밀번호를 입력하세요" : "설정 완료"}
      />
    }
    right={currentStep === 2 && <StepperRow.RightButton>다음</StepperRow.RightButton>}
  />
  <StepperRow
    left={<StepperRow.NumberIcon number={3} />}
    center={
      <StepperRow.Texts
        type="B"
        title="가입 완료"
        description={currentStep < 3 ? "다음 단계" : "가입이 완료되었어요"}
      />
    }
    hideLine
  />
</View>
```

### 배송 추적

배송 단계를 표시할 수 있어요.

```tsx
<View>
  <StepperRow
    left={<Asset.Icon name="package" color="blue" />}
    center={<StepperRow.Texts type="A" title="주문 접수" description="2025-11-28 10:00" />}
  />
  <StepperRow
    left={<Asset.Icon name="truck" color="blue" />}
    center={<StepperRow.Texts type="A" title="배송 중" description="2025-11-28 14:00" />}
  />
  <StepperRow
    left={<Asset.Icon name="home" color="grey" />}
    center={<StepperRow.Texts type="A" title="배송 완료" description="예정" />}
    hideLine
  />
</View>
```

## 인터페이스

### StepperRowProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| left* | - | React.ReactNode | 왼쪽에 표시될 콘텐츠를 지정해요 |
| center* | - | React.ReactNode | 중앙에 표시될 제목과 설명을 지정해요 |
| right | - | React.ReactNode | 오른쪽에 표시될 아이콘이나 버튼을 지정해요 |
| hideLine | false | boolean | 연결선을 숨길지 여부를 지정해요 (마지막 단계에서 사용) |
| onPress | - | () => void | 행을 클릭했을 때 호출되는 함수예요 |
| style | - | StyleProp<ViewStyle> | 행의 커스텀 스타일을 지정해요 |

*필수 속성

### StepperRowTextsProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| type* | - | "A" \| "B" \| "C" | 텍스트 스타일 타입을 지정해요 |
| title* | - | string | 단계의 제목을 지정해요 |
| description | - | string | 단계의 설명을 지정해요 |

*필수 속성

### StepperRowNumberIconProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| number* | - | number | 표시할 숫자를 지정해요 |
| completed | false | boolean | 단계 완료 여부를 지정해요 |

*필수 속성

---
*마지막 업데이트: 2025-11-28*
