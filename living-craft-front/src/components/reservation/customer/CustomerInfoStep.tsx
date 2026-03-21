import { Card } from '@components/ui';
import { colors } from '@toss/tds-colors';
import { TextField } from '@toss/tds-react-native';
import { ReservationFormData } from '@types';
import { Controller, useFormContext } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PhotoSection } from './PhotoSection';

interface CustomerInfoStepProps {
  /**
   * ScrollView로 감쌀지 여부 (기존 페이지 호환용)
   * @default true
   */
  withScrollView?: boolean;
}

export function CustomerInfoStep({ withScrollView = true }: CustomerInfoStepProps) {
  const { control } = useFormContext<ReservationFormData>();
  const content = (
    <>
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>고객 정보</Text>
          <Text style={styles.sectionSubtitle}>예약자 정보를 입력해주세요</Text>
        </View>
      </Card>

      <Controller
        control={control}
        name="customerInfo.name"
        render={({ field: { onChange, value } }) => (
          <TextField
            variant="box"
            label="이름 *"
            labelOption="sustain"
            placeholder="이름을 입력해주세요"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="customerInfo.phone"
        render={({ field: { onChange, value } }) => (
          <TextField
            variant="box"
            label="연락처 *"
            labelOption="sustain"
            placeholder="010-1234-5678"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="customerInfo.memo"
        render={({ field: { onChange, value } }) => (
          <TextField
            variant="box"
            label="추가 요청사항"
            labelOption="sustain"
            placeholder="추가로 요청하실 사항이 있으시면 입력해주세요"
            multiline
            numberOfLines={4}
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Card>
        <Controller
          control={control}
          name="customerInfo.photos"
          render={({ field: { onChange, value } }) => (
            <PhotoSection photos={value ?? []} onChange={onChange} maxCount={5} />
          )}
        />
      </Card>
    </>
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
  sectionHeader: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.grey900,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.grey600,
  },
});
