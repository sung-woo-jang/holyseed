# ErrorPage

ErrorPage 컴포넌트는 전체 페이지 에러를 표시하는 컴포넌트예요. 404, 500 등의 에러 상황에서 사용자에게 적절한 안내를 제공해요.

## 사용 예제

### 기본 사용

ErrorPage를 사용하려면 title과 description을 지정하세요.

```tsx
import { ErrorPage } from '@toss/tds-react-native';

<ErrorPage
  title="페이지를 찾을 수 없어요"
  description="요청하신 페이지가 존재하지 않아요"
/>
```

### 404 에러

페이지를 찾을 수 없을 때 표시할 수 있어요.

```tsx
<ErrorPage
  title="404"
  description="페이지를 찾을 수 없어요"
  actionButton={
    <Button onPress={() => navigate('/home')}>
      홈으로 가기
    </Button>
  }
/>
```

### 500 에러

서버 에러를 표시할 수 있어요.

```tsx
<ErrorPage
  title="일시적인 오류예요"
  description="서버에 문제가 발생했어요. 잠시 후 다시 시도해주세요"
  actionButton={
    <Button onPress={handleRetry}>
      다시 시도
    </Button>
  }
/>
```

### 네트워크 에러

네트워크 연결 문제를 표시할 수 있어요.

```tsx
<ErrorPage
  icon={<Asset.Icon name="wifi-off" color="red" size={80} />}
  title="인터넷 연결 없음"
  description="네트워크 연결을 확인하고 다시 시도해주세요"
  actionButton={
    <Button onPress={handleRetry}>
      다시 연결
    </Button>
  }
/>
```

### 권한 에러

접근 권한이 없을 때 표시할 수 있어요.

```tsx
<ErrorPage
  icon={<Asset.Icon name="lock" color="yellow" size={80} />}
  title="접근 권한 없음"
  description="이 페이지에 접근할 권한이 없어요"
  actionButton={
    <Button onPress={() => navigate('/home')}>
      홈으로 가기
    </Button>
  }
/>
```

### 커스텀 아이콘

icon 속성을 사용해 커스텀 아이콘을 표시할 수 있어요.

```tsx
<ErrorPage
  icon={
    <Asset.Lottie
      src="https://static.toss.im/lotties-common/error.json"
      frameShape={Asset.frameShape.CleanW80}
      loop
    />
  }
  title="오류가 발생했어요"
  description="예상치 못한 문제가 발생했어요"
  actionButton={
    <Button onPress={handleRetry}>
      다시 시도
    </Button>
  }
/>
```

### 여러 액션 버튼

여러 개의 버튼을 제공할 수 있어요.

```tsx
<ErrorPage
  title="세션이 만료되었어요"
  description="다시 로그인해주세요"
  actionButton={
    <View style={{ gap: 12, width: '100%' }}>
      <Button onPress={() => navigate('/login')}>
        로그인
      </Button>
      <Button style="weak" onPress={() => navigate('/home')}>
        홈으로 가기
      </Button>
    </View>
  }
/>
```

### 유지보수 안내

서비스 점검 중임을 안내할 수 있어요.

```tsx
<ErrorPage
  icon={<Asset.Icon name="settings" color="blue" size={80} />}
  title="서비스 점검 중"
  description="더 나은 서비스 제공을 위해 점검 중이에요\n잠시 후 다시 시도해주세요"
/>
```

### 에러 바운더리에서 사용

React Error Boundary와 함께 사용할 수 있어요.

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          title="문제가 발생했어요"
          description="앱에 예상치 못한 오류가 발생했어요"
          actionButton={
            <Button onPress={() => this.setState({ hasError: false })}>
              다시 시도
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
```

## 인터페이스

### ErrorPageProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| title* | - | string | 에러 페이지의 제목을 지정해요 |
| description* | - | string | 에러에 대한 설명을 지정해요 |
| icon | - | React.ReactNode | 상단에 표시될 아이콘을 지정해요 |
| actionButton | - | React.ReactNode | 하단에 표시될 액션 버튼을 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Result: 작업 결과를 표시해요
- Dialog: 모달 형태의 에러 메시지가 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*
