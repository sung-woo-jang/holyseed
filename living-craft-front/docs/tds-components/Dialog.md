# Dialog

Dialog 컴포넌트는 중요한 정보를 전달하거나 사용자의 확인을 요청하는 모달 대화상자예요. AlertDialog와 ConfirmDialog 두 가지 변형이 있어요.

## 사용 예제

### AlertDialog 기본 사용

AlertDialog는 정보를 전달하고 확인을 받을 때 사용해요.

```tsx
import { AlertDialog } from '@toss/tds-react-native';
import { useState } from 'react';

const [open, setOpen] = useState(false);

<AlertDialog
  open={open}
  title="알림"
  description="작업이 완료되었어요"
  buttonText="확인"
  onClose={() => setOpen(false)}
/>
```

### ConfirmDialog 기본 사용

ConfirmDialog는 사용자에게 선택을 요청할 때 사용해요.

```tsx
import { ConfirmDialog } from '@toss/tds-react-native';
import { useState } from 'react';

const [open, setOpen] = useState(false);

<ConfirmDialog
  open={open}
  title="삭제 확인"
  description="정말 삭제하시겠어요?"
  leftButton={<Button onPress={() => setOpen(false)}>취소</Button>}
  rightButton={<Button type="danger" onPress={handleDelete}>삭제</Button>}
  onClose={() => setOpen(false)}
/>
```

### 커스텀 콘텐츠

content 속성을 사용해 커스텀 콘텐츠를 추가할 수 있어요.

```tsx
<AlertDialog
  open={open}
  title="이용약관"
  content={
    <ScrollView style={{ maxHeight: 300 }}>
      <Txt typography="t6">
        약관 내용이 여기에 표시돼요...
      </Txt>
    </ScrollView>
  }
  buttonText="동의"
  onClose={() => setOpen(false)}
/>
```

### 삭제 확인

위험한 작업을 수행하기 전에 확인을 요청할 수 있어요.

```tsx
const handleDelete = async () => {
  await deleteItem();
  setOpen(false);
  // 성공 토스트 표시
};

<ConfirmDialog
  open={open}
  title="항목 삭제"
  description="삭제한 항목은 복구할 수 없어요. 정말 삭제하시겠어요?"
  leftButton={
    <Button style="weak" onPress={() => setOpen(false)}>
      취소
    </Button>
  }
  rightButton={
    <Button type="danger" onPress={handleDelete}>
      삭제
    </Button>
  }
  onClose={() => setOpen(false)}
/>
```

### 로그아웃 확인

로그아웃 확인 다이얼로그를 만들 수 있어요.

```tsx
<ConfirmDialog
  open={open}
  title="로그아웃"
  description="로그아웃 하시겠어요?"
  leftButton={
    <Button style="weak" onPress={() => setOpen(false)}>
      취소
    </Button>
  }
  rightButton={
    <Button onPress={handleLogout}>
      로그아웃
    </Button>
  }
  onClose={() => setOpen(false)}
/>
```

### 배경 클릭으로 닫기

closeOnDimmerClick을 사용해 배경을 클릭했을 때 다이얼로그를 닫을 수 있어요.

```tsx
<AlertDialog
  open={open}
  title="알림"
  description="배경을 클릭해도 닫혀요"
  buttonText="확인"
  closeOnDimmerClick
  onClose={() => setOpen(false)}
/>
```

### 애니메이션 콜백

onEntered와 onExited를 사용해 애니메이션 완료 시점을 감지할 수 있어요.

```tsx
<AlertDialog
  open={open}
  title="알림"
  description="애니메이션 콜백이 있어요"
  buttonText="확인"
  onEntered={() => console.log('다이얼로그가 완전히 나타났어요')}
  onExited={() => console.log('다이얼로그가 완전히 사라졌어요')}
  onClose={() => setOpen(false)}
/>
```

### 버튼 커스텀 액션

onButtonPress를 사용해 AlertDialog의 버튼 액션을 커스터마이즈할 수 있어요.

```tsx
<AlertDialog
  open={open}
  title="저장 완료"
  description="변경사항이 저장되었어요"
  buttonText="확인"
  onButtonPress={() => {
    console.log('저장 완료 확인됨');
    setOpen(false);
  }}
  onClose={() => setOpen(false)}
/>
```

## 인터페이스

### AlertDialogProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| open* | - | boolean | 다이얼로그 표시 여부를 지정해요 |
| title* | - | React.ReactNode | 다이얼로그 제목을 지정해요 |
| onClose* | - | () => void | 다이얼로그를 닫을 때 호출되는 함수예요 |
| description | - | string | 설명 텍스트를 지정해요 |
| content | - | React.ReactNode | 커스텀 콘텐츠를 지정해요 |
| buttonText | '확인' | string | 확인 버튼 텍스트를 지정해요 |
| onButtonPress | - | () => void | 버튼을 클릭했을 때 호출되는 함수예요 |
| closeOnDimmerClick | false | boolean | 배경 클릭 시 닫을지 여부를 지정해요 |
| onEntered | - | () => void | 다이얼로그가 완전히 나타난 후 호출되는 함수예요 |
| onExited | - | () => void | 다이얼로그가 완전히 사라진 후 호출되는 함수예요 |

*필수 속성

### ConfirmDialogProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| open* | - | boolean | 다이얼로그 표시 여부를 지정해요 |
| title* | - | React.ReactNode | 다이얼로그 제목을 지정해요 |
| leftButton* | - | React.ReactNode | 왼쪽 버튼을 지정해요 |
| rightButton* | - | React.ReactNode | 오른쪽 버튼을 지정해요 |
| onClose* | - | () => void | 다이얼로그를 닫을 때 호출되는 함수예요 |
| description | - | string | 설명 텍스트를 지정해요 |
| content | - | React.ReactNode | 커스텀 콘텐츠를 지정해요 |
| closeOnDimmerClick | false | boolean | 배경 클릭 시 닫을지 여부를 지정해요 |
| onEntered | - | () => void | 다이얼로그가 완전히 나타난 후 호출되는 함수예요 |
| onExited | - | () => void | 다이얼로그가 완전히 사라진 후 호출되는 함수예요 |

*필수 속성

## 관련 컴포넌트

- Toast: 간단한 피드백 메시지를 표시해요

---
*마지막 업데이트: 2025-11-28*
