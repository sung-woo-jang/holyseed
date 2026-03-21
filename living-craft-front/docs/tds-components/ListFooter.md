# ListFooter

ListFooter 컴포넌트는 리스트 섹션의 푸터를 표시하는 컴포넌트예요. 리스트 하단에 설명이나 주의사항을 표시할 때 사용해요.

## 사용 예제

### 기본 사용

ListFooter를 사용하려면 children으로 텍스트를 전달하세요.

```tsx
import { ListFooter } from '@toss/tds-react-native';

<ListFooter>추가 정보가 여기에 표시돼요</ListFooter>
```

### List와 함께 사용

List 하단에 푸터를 추가할 수 있어요.

```tsx
<View>
  <ListHeader>알림 설정</ListHeader>
  <List>
    <ListRow
      contents={<ListRow.Texts texts={[{ text: '푸시 알림' }]} />}
      right={<Switch checked={push} onCheckedChange={setPush} />}
    />
    <ListRow
      contents={<ListRow.Texts texts={[{ text: '이메일 알림' }]} />}
      right={<Switch checked={email} onCheckedChange={setEmail} />}
    />
  </List>
  <ListFooter>알림을 끄면 중요한 정보를 놓칠 수 있어요</ListFooter>
</View>
```

### 주의사항 표시

주의사항이나 안내 메시지를 표시할 수 있어요.

```tsx
<View>
  <ListHeader>개인정보</ListHeader>
  <List>
    <ListRow
      contents={<ListRow.Texts texts={[{ text: '프로필 공개' }]} />}
      right={<Switch checked={publicProfile} onCheckedChange={setPublicProfile} />}
    />
  </List>
  <ListFooter>
    프로필을 공개하면 다른 사용자가 내 정보를 볼 수 있어요
  </ListFooter>
</View>
```

### 도움말 링크

도움말 링크를 포함할 수 있어요.

```tsx
<View>
  <ListHeader>보안</ListHeader>
  <List>
    <ListRow
      contents={<ListRow.Texts texts={[{ text: '2단계 인증' }]} />}
      right={<Switch checked={twoFactor} onCheckedChange={setTwoFactor} />}
    />
  </List>
  <ListFooter>
    <View>
      <Txt typography="t7" color={colors.grey600}>
        계정을 더욱 안전하게 보호할 수 있어요.{' '}
      </Txt>
      <TextButton
        size="small"
        onPress={() => openHelp()}
        style={{ marginTop: 4 }}
      >
        자세히 보기
      </TextButton>
    </View>
  </ListFooter>
</View>
```

### 여러 섹션에서 사용

각 섹션마다 푸터를 추가할 수 있어요.

```tsx
<View>
  <ListHeader>계정</ListHeader>
  <List>
    <ListRow contents={<ListRow.Texts texts={[{ text: '이메일 변경' }]} />} />
    <ListRow contents={<ListRow.Texts texts={[{ text: '비밀번호 변경' }]} />} />
  </List>
  <ListFooter>계정 정보 변경 시 이메일 인증이 필요해요</ListFooter>

  <ListHeader>개인정보</ListHeader>
  <List>
    <ListRow contents={<ListRow.Texts texts={[{ text: '프로필 수정' }]} />} />
    <ListRow contents={<ListRow.Texts texts={[{ text: '전화번호 변경' }]} />} />
  </List>
  <ListFooter>개인정보는 안전하게 보호돼요</ListFooter>
</View>
```

## 인터페이스

### ListFooterProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 푸터에 표시될 콘텐츠를 지정해요 |
| style | - | StyleProp<ViewStyle> | 푸터의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- List: 리스트 아이템을 표시해요
- ListHeader: 리스트 섹션의 헤더를 표시해요

---
*마지막 업데이트: 2025-11-28*
