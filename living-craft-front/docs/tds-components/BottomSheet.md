# BottomSheet

BottomSheet 컴포넌트는 화면 하단에서 위로 슬라이드되는 패널이에요. 현재 페이지를 벗어나지 않고 추가 정보를 표시하거나 사용자 액션을 유도할 때 유용해요.

## 사용 예제

### 기본 사용

BottomSheet를 기본 형태로 사용할 수 있어요. BottomSheet는 `BottomSheet.Root` 컴포넌트를 사용해야 해요.

```tsx
import { BottomSheet } from '@toss/tds-react-native';
import { useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
>
  <Txt typography="t6">
    콘텐츠가 여기에 표시돼요
  </Txt>
</BottomSheet.Root>
```

### Header가 있는 BottomSheet

Header를 추가하여 제목을 표시할 수 있어요.

```tsx
<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
  header={<BottomSheet.Header>주문 상세</BottomSheet.Header>}
>
  <Txt typography="t6">
    주문 정보가 여기에 표시돼요
  </Txt>
</BottomSheet.Root>
```

### Header Description이 있는 BottomSheet

Header 아래에 설명을 추가할 수 있어요.

```tsx
<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
  header={<BottomSheet.Header>주문 상세</BottomSheet.Header>}
  headerDescription={
    <BottomSheet.HeaderDescription>
      주문 번호: 123456789
    </BottomSheet.HeaderDescription>
  }
>
  <Txt typography="t6">
    주문 정보가 여기에 표시돼요
  </Txt>
</BottomSheet.Root>
```

### CTA 버튼이 있는 BottomSheet

하단에 액션 버튼을 추가할 수 있어요.

```tsx
<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
  header={<BottomSheet.Header>상품 정보</BottomSheet.Header>}
  cta={
    <Button onPress={handlePurchase}>
      구매하기
    </Button>
  }
>
  <Txt typography="t6">
    상품 상세 정보가 여기에 표시돼요
  </Txt>
</BottomSheet.Root>
```

### Double CTA 사용

두 개의 버튼을 나란히 배치할 수 있어요.

```tsx
<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
  header={<BottomSheet.Header>작업 선택</BottomSheet.Header>}
  cta={
    <BottomSheet.CTA.Double
      leftButton={
        <Button style="weak" onPress={() => setIsOpen(false)}>
          취소
        </Button>
      }
      rightButton={
        <Button onPress={handleConfirm}>
          확인
        </Button>
      }
    />
  }
>
  <Txt typography="t6">
    작업을 선택해주세요
  </Txt>
</BottomSheet.Root>
```

### 선택 옵션이 있는 BottomSheet

라디오 버튼 스타일의 선택 옵션을 표시할 수 있어요.

```tsx
const [selected, setSelected] = useState('option1');

<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
  header={<BottomSheet.Header>옵션 선택</BottomSheet.Header>}
>
  <BottomSheet.Select
    options={[
      { value: 'option1', label: '옵션 1' },
      { value: 'option2', label: '옵션 2' },
      { value: 'option3', label: '옵션 3' },
    ]}
    value={selected}
    onChange={(value) => setSelected(value)}
  />
</BottomSheet.Root>
```

### Dimmer 없이 사용

배경 오버레이 없이 BottomSheet를 표시할 수 있어요.

```tsx
<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
  disableDimmer
  header={<BottomSheet.Header>알림</BottomSheet.Header>}
>
  <Txt typography="t6">
    배경이 어둡게 변하지 않아요
  </Txt>
</BottomSheet.Root>
```

### 포커스 잠금 비활성화

BottomSheet가 열려있을 때 페이지 포커스를 유지해야 하는 경우 사용해요.

```tsx
<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
  UNSAFE_disableFocusLock
  header={<BottomSheet.Header>정보</BottomSheet.Header>}
>
  <Txt typography="t6">
    백그라운드 페이지와 상호작용할 수 있어요
  </Txt>
</BottomSheet.Root>
```

### 접근성 설정

접근성 속성을 설정하여 스크린 리더 사용자 경험을 개선할 수 있어요.

```tsx
<BottomSheet.Root
  open={isOpen}
  onClose={() => setIsOpen(false)}
  header={<BottomSheet.Header>주문 내역</BottomSheet.Header>}
  ariaLabelledBy="order-title"
  ariaDescribedBy="order-description"
  a11yIncludeHeaderInScroll={true}
>
  <Txt id="order-title" typography="t5">주문 정보</Txt>
  <Txt id="order-description" typography="t6">
    최근 주문 내역을 확인할 수 있어요
  </Txt>
</BottomSheet.Root>
```

## 인터페이스

### BottomSheetProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| open* | - | boolean | BottomSheet 표시 여부를 지정해요 |
| onClose* | - | () => void | BottomSheet를 닫을 때 호출되는 함수예요 |
| header | - | React.ReactNode | 제목 영역을 지정해요 (BottomSheet.Header 사용) |
| headerDescription | - | React.ReactNode | 부제목 영역을 지정해요 (BottomSheet.HeaderDescription 사용) |
| cta | - | React.ReactNode | 하단 액션 버튼 영역을 지정해요 |
| disableDimmer | false | boolean | 배경 오버레이를 숨길지 여부를 지정해요 |
| UNSAFE_disableFocusLock | false | boolean | BottomSheet가 열려있을 때 페이지 포커스를 유지할지 여부를 지정해요 |
| ariaLabelledBy | - | string | 접근성을 위한 라벨 ID를 지정해요 |
| ariaDescribedBy | - | string | 접근성을 위한 설명 ID를 지정해요 |
| a11yIncludeHeaderInScroll | true | boolean | 텍스트 크기가 160% 이상일 때 헤더를 스크롤에 포함할지 여부를 지정해요 |

*필수 속성

### BottomSheet.DoubleCTA Props

| 속성 | 타입 | 설명 |
|------|------|------|
| leftButton* | React.ReactNode | 왼쪽 버튼을 지정해요 |
| rightButton* | React.ReactNode | 오른쪽 버튼을 지정해요 |

*필수 속성

### BottomSheet.Select Props

| 속성 | 타입 | 설명 |
|------|------|------|
| options* | Array<{ value: string; label: string }> | 선택 옵션 배열을 지정해요 |
| value* | string | 현재 선택된 값을 지정해요 |
| onChange* | (value: string) => void | 선택이 변경될 때 호출되는 함수예요 |

*필수 속성

## 주요 기능

- **드래그로 닫기**: 아래로 드래그하여 BottomSheet를 닫을 수 있어요
- **유연한 높이**: 콘텐츠에 따라 높이가 자동으로 조절돼요
- **다양한 레이아웃**: Header, Description, CTA 등을 조합하여 다양한 레이아웃을 구성할 수 있어요
- **접근성 지원**: 스크린 리더와 키보드 내비게이션을 지원해요

## 관련 컴포넌트

- Dialog: 중요한 정보를 전달하거나 확인을 요청하는 모달 대화상자예요
- Toast: 간단한 피드백 메시지를 표시해요

---
*마지막 업데이트: 2025-12-05*
