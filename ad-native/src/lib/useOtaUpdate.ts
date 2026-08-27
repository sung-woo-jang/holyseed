import { useState } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

export function useOtaUpdate() {
  const [checking, setChecking] = useState(false);
  const updateLabel = Updates.isEmbeddedLaunch ? '내장 빌드 (OTA 미적용)' : `업데이트 적용됨 · ${Updates.updateId?.slice(0, 8) ?? '?'}`;

  async function checkForUpdate() {
    setChecking(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert('최신 버전', '이미 최신 버전을 쓰고 있어요.');
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('업데이트 발견', '새 버전을 받았어요. 지금 적용할까요?', [
        { text: '나중에', style: 'cancel' },
        { text: '지금 적용', onPress: () => Updates.reloadAsync() },
      ]);
    } catch (e) {
      Alert.alert('확인 실패', e instanceof Error ? e.message : '알 수 없는 오류예요.');
    } finally {
      setChecking(false);
    }
  }

  return { updateLabel, checking, checkForUpdate };
}
