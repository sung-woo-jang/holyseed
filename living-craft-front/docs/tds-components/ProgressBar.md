# ProgressBar

ProgressBar 컴포넌트는 작업의 진행률을 시각적으로 표시하는 컴포넌트예요. 파일 업로드, 다운로드, 작업 완료도 등을 나타낼 때 사용해요.

## 사용 예제

### 기본 사용

ProgressBar를 사용하려면 progress를 지정하세요.

```tsx
import { ProgressBar } from '@toss/tds-react-native';

<ProgressBar progress={0.5} />
```

### 퍼센트 표시

progress는 0-1 사이의 값으로 지정해요.

```tsx
const [progress, setProgress] = useState(0.3);

<View>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
    <Txt typography="t6">진행률</Txt>
    <Txt typography="t6" fontWeight="bold">{Math.round(progress * 100)}%</Txt>
  </View>

  <ProgressBar progress={progress} />
</View>
```

### 색상 설정

color 속성을 사용해 진행 바의 색상을 지정할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<ProgressBar progress={0.7} color={colors.blue500} />
<ProgressBar progress={0.5} color={colors.green500} />
<ProgressBar progress={0.3} color={colors.red500} />
```

### 크기 조정

height 속성을 사용해 진행 바의 높이를 조절할 수 있어요.

```tsx
<ProgressBar progress={0.6} height={4} />
<ProgressBar progress={0.6} height={8} />
<ProgressBar progress={0.6} height={12} />
```

### 파일 업로드

파일 업로드 진행률을 표시할 수 있어요.

```tsx
const [uploadProgress, setUploadProgress] = useState(0);

const handleUpload = async (file) => {
  const response = await uploadFile(file, {
    onProgress: (progress) => {
      setUploadProgress(progress);
    }
  });
};

<View>
  <Txt typography="h5">파일 업로드 중...</Txt>
  <ProgressBar progress={uploadProgress} color={colors.blue500} style={{ marginTop: 12 }} />
  <Txt typography="t7" color={colors.grey600} style={{ marginTop: 4 }}>
    {Math.round(uploadProgress * 100)}% 완료
  </Txt>
</View>
```

### 다운로드 진행률

다운로드 진행률을 표시할 수 있어요.

```tsx
const [downloadProgress, setDownloadProgress] = useState(0);

<Card>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
    <Asset.Icon name="download" size={24} color={colors.blue500} />
    <View style={{ flex: 1 }}>
      <Txt typography="h5">파일명.pdf</Txt>
      <Txt typography="t7" color={colors.grey600}>1.2 MB / 3.5 MB</Txt>
    </View>
  </View>

  <ProgressBar progress={downloadProgress} color={colors.blue500} />
</Card>
```

### 단계별 진행

여러 단계의 진행률을 표시할 수 있어요.

```tsx
const [currentStep, setCurrentStep] = useState(2);
const totalSteps = 4;
const progress = currentStep / totalSteps;

<View>
  <Txt typography="h5">회원가입 진행 중</Txt>
  <Txt typography="t6" color={colors.grey600} style={{ marginTop: 4 }}>
    단계 {currentStep} / {totalSteps}
  </Txt>

  <ProgressBar
    progress={progress}
    color={colors.blue500}
    style={{ marginTop: 12 }}
  />
</View>
```

### 애니메이션

진행률 변화를 부드럽게 애니메이션할 수 있어요.

```tsx
const [progress, setProgress] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setProgress(prev => {
      if (prev >= 1) {
        clearInterval(interval);
        return 1;
      }
      return prev + 0.1;
    });
  }, 500);

  return () => clearInterval(interval);
}, []);

<ProgressBar progress={progress} animated />
```

### 배경색 커스터마이즈

backgroundColor를 사용해 배경 색상을 변경할 수 있어요.

```tsx
<ProgressBar
  progress={0.6}
  color={colors.blue500}
  backgroundColor={colors.blue100}
/>
```

### 목표 달성률

목표 달성률을 표시할 수 있어요.

```tsx
const [current, setCurrent] = useState(7500);
const goal = 10000;
const progress = current / goal;

<View>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
    <Txt typography="h5">이번 달 목표</Txt>
    <Txt typography="h5" color={colors.blue500}>
      {current.toLocaleString()}원 / {goal.toLocaleString()}원
    </Txt>
  </View>

  <ProgressBar progress={progress} color={colors.blue500} height={8} />

  <Txt typography="t7" color={colors.grey600} style={{ marginTop: 4 }}>
    {Math.round(progress * 100)}% 달성
  </Txt>
</View>
```

## 인터페이스

### ProgressBarProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| progress* | - | number | 진행률을 0-1 사이 값으로 지정해요 |
| color | colors.blue500 | string | 진행 바의 색상을 지정해요 |
| backgroundColor | colors.grey200 | string | 배경 바의 색상을 지정해요 |
| height | 6 | number | 진행 바의 높이를 픽셀 단위로 지정해요 |
| animated | false | boolean | 진행률 변화를 애니메이션할지 여부를 지정해요 |
| borderRadius | 3 | number | 모서리 둥글기를 픽셀 단위로 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 중요 사항

- progress 값은 0 이상 1 이하여야 해요
- 100%는 1로 표현해요 (예: 75% = 0.75)

## 관련 컴포넌트

- Loader: 단순 로딩 상태를 표시해요
- Skeleton: 콘텐츠 로딩 플레이스홀더를 표시해요

---
*마지막 업데이트: 2025-11-28*
