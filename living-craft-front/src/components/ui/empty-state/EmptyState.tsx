import { colors } from '@toss/tds-colors';
import { Asset } from '@toss/tds-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmptyStateProps {
  iconName?: string;
  iconColor?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

/**
 * 빈 상태 컴포넌트
 * 데이터가 없을 때 표시하는 UI (검색 결과 없음, 목록 비어있음 등)
 */
export const EmptyState = ({
  iconName = 'icon-profile-magnifier-blue',
  iconColor = colors.grey400,
  title,
  description,
  actionLabel,
  onActionPress
}: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <Asset.Icon name={iconName} color={iconColor} frameShape={Asset.frameShape.CleanW60} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onActionPress && (
        <TouchableOpacity style={styles.button} onPress={onActionPress}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.grey600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.blue500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
