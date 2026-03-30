import { Service } from '@api/types';
import { colors } from '@toss/tds-colors';
import { Asset, Skeleton } from '@toss/tds-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ServiceSelectorProps {
  services: Service[] | undefined;
  value: number | undefined;
  onChange: (serviceId: number) => void;
  isLoading?: boolean;
}

/**
 * 서비스 선택 컴포넌트
 * Accordion Step 내부에서 사용되는 간단한 서비스 선택 UI
 */
export function ServiceSelector({ services, value, onChange, isLoading = false }: ServiceSelectorProps) {
  // 로딩 중일 때
  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 2 }).map((_, index) => (
          <View key={index} style={[styles.serviceRow, index < 1 && styles.serviceRowBorder]}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <View style={styles.serviceInfo}>
              <Skeleton width="60%" height={17} borderRadius={4} />
              <View style={{ height: 4 }} />
              <Skeleton width="80%" height={14} borderRadius={4} />
            </View>
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        ))}
      </View>
    );
  }

  // 서비스가 없을 때
  if (!services || services.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>등록된 서비스가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {services.map((service, index) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.serviceRow,
            value === service.id && styles.serviceRowSelected,
            index < services.length - 1 && styles.serviceRowBorder,
          ]}
          onPress={() => onChange(service.id)}
        >
          <View style={[styles.iconContainer, { backgroundColor: service.iconBgColor }]}>
            <Asset.Icon name={service.icon?.name} color={colors.grey700} frameShape={Asset.frameShape.CleanW24} />
          </View>

          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
          </View>

          <View style={[styles.checkIcon, value === service.id && styles.checkIconSelected]}>
            {value === service.id && <Text style={styles.checkMark}>✓</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.grey600,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  serviceRowSelected: {
    backgroundColor: colors.blue50,
  },
  serviceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.grey600,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grey300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconSelected: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
  checkMark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
