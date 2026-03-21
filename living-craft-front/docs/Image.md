---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Image.md
---

# Image

`Image` 컴포넌트를 사용하면 비트맵(png, jpg 등)이나 벡터(svg) 이미지를 불러와 화면에 표시할 수 있어요.\
이미지 형식에 따라 자동으로 적절한 방식으로 렌더링돼요.

## 시그니처

```typescript
function Image(props: ImageProps): import("react/jsx-runtime").JSX.Element;
```

### 파라미터

## 예제

### 이미지 로드 및 렌더링

아래 예시는 비트맵 이미지와 벡터 이미지를 불러와 표시하는 방법을 보여줘요.\
`onError` 콜백으로 로드 실패 시 로그를 남길 수 있어요

```tsx
import { View } from 'react-native';
import { Image } from '@granite-js/react-native';

function ImageExample() {
  return (
    <View>
      <Image
        source={{ uri: 'my-image-link' }}
        style={{
          width: 300,
          height: 300,
          borderWidth: 1,
        }}
        onError={() => {
          console.log('이미지 로드 실패');
        }}
      />

      <Image
        source={{ uri: 'my-svg-link' }}
        style={{
          width: 300,
          height: 300,
          borderWidth: 1,
        }}
        onError={() => {
          console.log('이미지 로드 실패');
        }}
      />
    </View>
  );
}
```

### 이미지 로드 실패 처리하기

`Image` 컴포넌트를 사용할 때 이미지 로드에 실패하면 `onError` 콜백이 호출돼요.\
이 콜백을 활용하면 에러 발생 시 다른 UI를 표시하거나 사용자에게 알림을 띄울 수 있어요.

아래 예시는 잘못된 URL을 사용해 에러를 유도하고,
에러 발생 시 빨간 테두리의 대체 뷰를 표시하는 예시예요.

```tsx
import { useState } from "react";
import { View } from "react-native";
import { Image, createRoute } from '@granite-js/react-native';

export const Route = createRoute("/", {
  component: Index,
});

function Index() {
  const [hasError, setHasError] = useState(false); // [!code highlight]

  return (
    <View>
      {hasError === true ? (
        <ErrorView />
      ) : (
        <Image
          style={{
            width: 100,
            height: 100,
          }}
          source={{
            uri: "invalid url", // 잘못된 URL을 사용해서 에러를 발생시켜요. // [!code highlight]
          }}
          onError={() => {
            // [!code highlight:4]
            Alert.alert("이미지 에러");
            setHasError(true);
          }}
        />
      )}
    </View>
  );
}

/** 임의의 에러 뷰 */
function ErrorView() {
  return (
    <View
      style={{
        width: 100,
        height: 100,
        borderColor: "red",
        borderWidth: 1,
      }}
    />
  );
}
```

## 참고사항

* `source.cache` 옵션은 비트맵 이미지에만 적용돼요.
* 로컬 리소스를 사용할 경우, `require()`를 통해 이미지 파일을 직접 지정할 수도 있어요.
