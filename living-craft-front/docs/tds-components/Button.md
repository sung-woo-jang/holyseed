# Button

Button 컴포넌트는 사용자의 액션을 트리거하거나 이벤트를 실행하는 기본 UI 요소예요. 폼 제출, 다이얼로그 열기, 액션 취소, 삭제 등 다양한 상호작용을 처리해요.

## 사용 예제

### 기본 사용

Button을 사용하려면 children과 onPress를 지정하세요.

```tsx
import { Button } from '@toss/tds-react-native';

<Button onPress={() => console.log('버튼 클릭!')}>
  확인
</Button>
```

### 크기 설정

size 속성을 사용해 버튼의 크기를 지정할 수 있어요.

```tsx
<Button size="tiny" onPress={() => {}}>
  아주 작은 버튼
</Button>

<Button size="medium" onPress={() => {}}>
  중간 버튼
</Button>

<Button size="large" onPress={() => {}}>
  큰 버튼
</Button>

<Button size="big" onPress={() => {}}>
  가장 큰 버튼
</Button>
```

### 스타일 변형

style 속성을 사용해 버튼의 시각적 스타일을 변경할 수 있어요.

```tsx
{/* 채도가 높아 시각적으로 강렬하고 눈에 띄는 디자인 */}
<Button style="fill" onPress={() => {}}>
  Fill 스타일
</Button>

{/* 채도가 낮아 시각적으로 덜 강렬하며 부드럽고 조용한 느낌 */}
<Button style="weak" onPress={() => {}}>
  Weak 스타일
</Button>
```

### 색상 타입

type 속성을 사용해 버튼의 색상을 변경할 수 있어요.

```tsx
<Button type="primary" onPress={() => {}}>
  Primary
</Button>

<Button type="dark" onPress={() => {}}>
  Dark
</Button>

<Button type="danger" onPress={() => {}}>
  Danger
</Button>

<Button type="light" onPress={() => {}}>
  Light
</Button>
```

### 디스플레이 모드

display 속성을 사용해 버튼의 레이아웃을 조정할 수 있어요.

```tsx
{/* 전체 너비로 표시되며 줄바꿈됨 */}
<Button display="block" onPress={() => {}}>
  Block 버튼
</Button>

{/* 부모 컨테이너의 너비에 맞춰 확장됨 */}
<Button display="full" onPress={() => {}}>
  Full 버튼
</Button>
```

### 비활성화 상태

disabled 속성을 사용해 버튼을 비활성화할 수 있어요.

```tsx
<Button disabled onPress={() => {}}>
  비활성화된 버튼
</Button>
```

### 로딩 상태

loading 속성을 사용해 로딩 스피너를 표시하고 상호작용을 차단할 수 있어요.

```tsx
const [isLoading, setIsLoading] = useState(false);

<Button
  loading={isLoading}
  onPress={async () => {
    setIsLoading(true);
    await performAction();
    setIsLoading(false);
  }}
>
  제출하기
</Button>
```

## 인터페이스

### ButtonProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 버튼 내부에 표시될 콘텐츠를 지정해요 |
| onPress | - | () => void | 버튼을 클릭했을 때 호출되는 함수예요 |
| type | 'primary' | "primary" \| "dark" \| "danger" \| "light" | 버튼의 색상 타입을 지정해요 |
| style | 'fill' | "fill" \| "weak" | 버튼의 시각적 스타일을 지정해요 |
| size | 'big' | "tiny" \| "medium" \| "large" \| "big" | 버튼의 크기를 지정해요 |
| display | - | "block" \| "full" | 버튼의 레이아웃 모드를 지정해요 |
| loading | false | boolean | 로딩 스피너를 표시할지 여부를 지정해요 |
| disabled | false | boolean | 버튼을 비활성화할지 여부를 지정해요 |

*필수 속성

---
*마지막 업데이트: 2025-11-28*
