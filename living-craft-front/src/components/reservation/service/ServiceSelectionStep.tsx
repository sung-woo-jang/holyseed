import { SectionCard } from '@components/ui';
import { useServices } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Asset, Skeleton } from '@toss/tds-react-native';
import { ReservationFormData } from '@types';
import { useFormContext } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ServiceSelectionStepProps {
  /**
   * ScrollView로 감쌀지 여부 (기존 페이지 호환용)
   * @default true
   */
  withScrollView?: boolean;
}

export function ServiceSelectionStep({ withScrollView = true }: ServiceSelectionStepProps) {
  const { watch, setValue } = useFormContext<ReservationFormData>();
  const selectedService = watch('service');

  const { data: services, isLoading } = useServices();
  const isEmpty = !services || services.length === 0;

  const content = (
    <SectionCard title="서비스 선택" subtitle="원하시는 서비스를 선택해주세요">
      <SectionCard.Loading isLoading={isLoading}>
        <View style={styles.loadingContainer}>
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
      </SectionCard.Loading>

      <SectionCard.Empty isEmpty={isEmpty} message="등록된 서비스가 없습니다." />

      <SectionCard.Content>
        {services?.map((service, index) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceRow,
              selectedService?.id === service.id && styles.serviceRowSelected,
              index < services.length - 1 && styles.serviceRowBorder,
            ]}
            onPress={() => setValue('service', service)}
          >
            <View style={[styles.iconContainer, { backgroundColor: service.iconBgColor }]}>
              <Asset.Icon name={service.icon?.name} color={colors.grey700} frameShape={Asset.frameShape.CleanW24} />
            </View>

            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>

            <View style={[styles.checkIcon, selectedService?.id === service.id && styles.checkIconSelected]}>
              {selectedService?.id === service.id && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </SectionCard.Content>
    </SectionCard>
  );

  if (withScrollView) {
    return (
      <ScrollView style={styles.stepContent} contentContainerStyle={styles.scrollContent}>
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.stepContentNoScroll}>{content}</View>;
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
  },
  stepContentNoScroll: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  loadingContainer: {
    paddingBottom: 8,
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
  icon: {
    fontSize: 22,
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
