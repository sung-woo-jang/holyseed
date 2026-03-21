import { Service } from '@api/types';
import { colors } from '@toss/tds-colors';
import { Asset } from '@toss/tds-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ServiceListProps {
  /** 서비스 목록 */
  services: Service[];
  /** 견적 받기 버튼 클릭 핸들러 */
  onQuotePress: (service: Service) => void;
}

/**
 * 서비스 리스트
 * 각 서비스 아이템을 렌더링하고 견적 받기 버튼을 제공
 */
export const ServiceList = ({ services, onQuotePress }: ServiceListProps) => {
  return (
    <View style={styles.container}>
      {services.map((service, index) => (
        <View key={service.id} style={[styles.row, index < services.length - 1 && styles.rowBorder]}>
          <View style={[styles.iconContainer, { backgroundColor: service.iconBgColor }]}>
            {service.icon?.name ? (
              <Asset.Icon name={service.icon.name} color={service.iconColor} frameShape={Asset.frameShape.CleanW24} />
            ) : (
              <Text style={styles.iconFallback}>🏠</Text>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.title}>{service.title}</Text>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={() => onQuotePress(service)}>
            <Text style={styles.buttonText}>견적 받기</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowBorder: {
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
  iconFallback: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.grey600,
  },
  button: {
    backgroundColor: colors.grey100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey900,
  },
});
