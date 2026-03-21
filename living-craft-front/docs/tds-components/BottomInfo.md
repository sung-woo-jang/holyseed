# BottomInfo

BottomInfo 컴포넌트는 화면 하단에 고정되는 정보 또는 액션 영역을 표시하는 컴포넌트예요. 중요한 정보나 주요 액션 버튼을 항상 보이게 할 때 사용해요.

## 사용 예제

### 기본 사용

BottomInfo를 사용하려면 children을 전달하세요.

```tsx
import { BottomInfo } from '@toss/tds-react-native';

<BottomInfo>
  <Button onPress={handleConfirm}>확인</Button>
</BottomInfo>
```

### 가격 정보와 버튼

상품 상세 페이지에서 가격과 구매 버튼을 표시할 수 있어요.

```tsx
<BottomInfo>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <View>
      <Txt typography="t6" color={colors.grey600}>총 결제 금액</Txt>
      <Txt typography="h3" fontWeight="bold">29,900원</Txt>
    </View>

    <Button onPress={handlePurchase} style={{ flex: 1, marginLeft: 16 }}>
      구매하기
    </Button>
  </View>
</BottomInfo>
```

### 여러 버튼

여러 액션 버튼을 함께 배치할 수 있어요.

```tsx
<BottomInfo>
  <View style={{ flexDirection: 'row', gap: 12 }}>
    <Button
      style="weak"
      display="full"
      onPress={handleCancel}
    >
      취소
    </Button>
    <Button
      display="full"
      onPress={handleConfirm}
    >
      확인
    </Button>
  </View>
</BottomInfo>
```

### 안내 메시지

중요한 안내 메시지를 표시할 수 있어요.

```tsx
<BottomInfo backgroundColor={colors.yellow50}>
  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
    <Asset.Icon name="info-circle" color={colors.yellow600} size={24} />
    <Txt typography="t6" color={colors.yellow700} style={{ flex: 1 }}>
      이 작업은 되돌릴 수 없어요
    </Txt>
  </View>
</BottomInfo>
```

### 장바구니

장바구니 화면에서 총액과 주문 버튼을 표시할 수 있어요.

```tsx
<BottomInfo>
  <View style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Txt typography="t5" color={colors.grey600}>상품 금액</Txt>
      <Txt typography="t5">50,000원</Txt>
    </View>

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Txt typography="t5" color={colors.grey600}>배송비</Txt>
      <Txt typography="t5">3,000원</Txt>
    </View>

    <View style={{ height: 1, backgroundColor: colors.grey200 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Txt typography="h5" fontWeight="bold">총 결제 금액</Txt>
      <Txt typography="h4" fontWeight="bold" color={colors.blue500}>
        53,000원
      </Txt>
    </View>

    <Button onPress={handleCheckout}>
      주문하기
    </Button>
  </View>
</BottomInfo>
```

### 약관 동의

약관 동의 체크와 함께 사용할 수 있어요.

```tsx
const [agreed, setAgreed] = useState(false);

<BottomInfo>
  <View style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Checkbox.Circle
        checked={agreed}
        onCheckedChange={setAgreed}
      />
      <Txt typography="t5">
        <Txt typography="t5" color={colors.blue500}>이용약관</Txt>에 동의해요
      </Txt>
    </View>

    <Button
      disabled={!agreed}
      onPress={handleNext}
    >
      다음
    </Button>
  </View>
</BottomInfo>
```

### 채팅 입력

채팅 화면의 메시지 입력 영역으로 사용할 수 있어요.

```tsx
const [message, setMessage] = useState('');

<BottomInfo>
  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
    <TextField
      value={message}
      onChange={setMessage}
      placeholder="메시지를 입력하세요"
      multiline
      style={{ flex: 1 }}
    />

    <IconButton
      icon="send"
      disabled={message.trim() === ''}
      onPress={handleSend}
    />
  </View>
</BottomInfo>
```

### 폼 제출

폼 하단에 제출 버튼을 고정할 수 있어요.

```tsx
<BottomInfo>
  <View style={{ gap: 8 }}>
    <Button onPress={handleSubmit}>
      제출하기
    </Button>

    <Txt typography="t7" color={colors.grey600} style={{ textAlign: 'center' }}>
      제출 후에는 수정할 수 없어요
    </Txt>
  </View>
</BottomInfo>
```

### Safe Area 적용

safeArea를 사용해 하단 여백을 자동으로 조절할 수 있어요.

```tsx
<BottomInfo safeArea>
  <Button onPress={handleConfirm}>확인</Button>
</BottomInfo>
```

## 인터페이스

### BottomInfoProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 하단에 표시할 콘텐츠를 지정해요 |
| backgroundColor | 'white' | string | 배경 색상을 지정해요 |
| safeArea | true | boolean | Safe Area 여백을 자동으로 적용할지 여부를 지정해요 |
| shadow | true | boolean | 상단에 그림자를 표시할지 여부를 지정해요 |
| padding | 20 | number | 내부 패딩을 픽셀 단위로 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 중요 사항

- BottomInfo는 position: 'absolute'로 화면 하단에 고정돼요
- 콘텐츠가 BottomInfo에 가려지지 않도록 스크롤 영역에 하단 패딩을 추가하는 것이 좋아요

---
*마지막 업데이트: 2025-11-28*
