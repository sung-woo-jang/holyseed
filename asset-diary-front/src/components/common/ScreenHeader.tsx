import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PageNavbar } from '@toss/tds-react-native';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/**
 * 페이지 라우트용 헤더.
 * PageNavbar(React Navigation setOptions 기반)로 구현되며,
 * onBack은 AccessoryIconButton(뒤로가기)으로, right는 AccessoryButtons 우측에 배치.
 */
export default function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <PageNavbar preference={{ type: 'showAlways' }}>
      <PageNavbar.Title>{title}</PageNavbar.Title>
      <PageNavbar.AccessoryButtons>
        {onBack && (
          <PageNavbar.AccessoryIconButton name="icon-arrow-left-mono" onPress={onBack} />
        )}
        {right && <View style={styles.rightSlot}>{right}</View>}
      </PageNavbar.AccessoryButtons>
    </PageNavbar>
  );
}

interface HeaderButtonProps {
  label: string;
  onPress: () => void;
}

export function HeaderButton({ label, onPress }: HeaderButtonProps) {
  return (
    <PageNavbar.AccessoryTextButton onPress={onPress}>{label}</PageNavbar.AccessoryTextButton>
  );
}

const styles = StyleSheet.create({
  rightSlot: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
