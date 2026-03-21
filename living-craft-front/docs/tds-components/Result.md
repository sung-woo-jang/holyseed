# Result

Result 컴포넌트는 특정 사용자 액션의 결과를 표시하는 컴포넌트예요. 성공, 에러 등의 상태를 시각적 요소와 메시지로 전달해요.

## 사용 예제

### 기본 사용

Result를 사용하려면 title을 지정하세요.

```tsx
import { Result } from '@toss/tds-react-native';

<Result
  title="작업이 완료되었어요"
  description="모든 변경사항이 저장되었어요"
/>
```

### 아이콘과 함께

figure 속성을 사용해 시각적 요소를 추가할 수 있어요.

```tsx
<Result
  figure={<Asset.Icon name="check-circle" color="green" size={60} />}
  title="성공"
  description="작업이 성공적으로 완료되었어요"
/>
```

### 에러 상태

에러 상태를 표시할 수 있어요.

```tsx
<Result
  figure={<Asset.Icon name="exclamation-circle" color="red" size={60} />}
  title="오류가 발생했어요"
  description="네트워크 연결을 확인하고 다시 시도해주세요"
  button={
    <Result.Button onPress={handleRetry}>
      다시 시도
    </Result.Button>
  }
/>
```

### 이미지와 함께

Asset.Image를 사용해 이미지를 표시할 수 있어요.

```tsx
<Result
  figure={
    <Asset.Image
      source={{ uri: 'https://example.com/success.png' }}
      frameShape={Asset.frameShape.CircleLarge}
    />
  }
  title="환영합니다!"
  description="회원가입이 완료되었어요"
  button={
    <Result.Button onPress={handleStart}>
      시작하기
    </Result.Button>
  }
/>
```

### 빈 상태

데이터가 없을 때 표시할 수 있어요.

```tsx
<Result
  figure={<Asset.Icon name="inbox" color="grey" size={60} />}
  title="아직 항목이 없어요"
  description="새로운 항목을 추가해보세요"
  button={
    <Result.Button onPress={handleAdd}>
      추가하기
    </Result.Button>
  }
/>
```

### 네트워크 에러

네트워크 연결 에러를 표시할 수 있어요.

```tsx
<Result
  figure={<Asset.Icon name="wifi-off" color="red" size={60} />}
  title="인터넷 연결 없음"
  description="네트워크 연결을 확인하고 다시 시도해주세요"
  button={
    <Result.Button onPress={handleRetry}>
      다시 연결
    </Result.Button>
  }
/>
```

### 완료 화면

작업 완료 후 완료 화면을 표시할 수 있어요.

```tsx
<Result
  figure={
    <Asset.Lottie
      src="https://static.toss.im/lotties-common/success.json"
      frameShape={Asset.frameShape.CleanW60}
      loop={false}
    />
  }
  title="송금 완료"
  description="홍길동님께 10,000원이 송금되었어요"
  button={
    <Result.Button onPress={() => navigate('/home')}>
      확인
    </Result.Button>
  }
/>
```

### 권한 요청

권한이 필요한 경우 안내할 수 있어요.

```tsx
<Result
  figure={<Asset.Icon name="lock" color="yellow" size={60} />}
  title="권한이 필요해요"
  description="이 기능을 사용하려면 카메라 권한이 필요해요"
  button={
    <Result.Button onPress={handleRequestPermission}>
      권한 허용
    </Result.Button>
  }
/>
```

### 여러 버튼

여러 개의 버튼을 배치할 수 있어요.

```tsx
<Result
  figure={<Asset.Icon name="info-circle" color="blue" size={60} />}
  title="업데이트 가능"
  description="새로운 버전이 출시되었어요"
  button={
    <View style={{ gap: 12 }}>
      <Button onPress={handleUpdate}>
        업데이트
      </Button>
      <Button style="weak" onPress={handleSkip}>
        나중에
      </Button>
    </View>
  }
/>
```

## 인터페이스

### ResultProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| title* | - | string | 결과 화면의 제목을 지정해요 |
| figure | - | React.ReactNode | 상단에 표시될 시각적 요소를 지정해요 |
| description | - | string | 제목 아래에 표시될 설명을 지정해요 |
| button | - | React.ReactNode | 하단에 표시될 액션 버튼을 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

### Result.ButtonProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 버튼에 표시될 텍스트를 지정해요 |
| onPress* | - | () => void | 버튼을 클릭했을 때 호출되는 함수예요 |

*필수 속성

## 관련 컴포넌트

- ErrorPage: 전체 페이지 에러를 표시해요
- Dialog: 모달 형태의 피드백이 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*
