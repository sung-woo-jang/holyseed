import { useLayoutEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CategoryIcon from '../../components/common/CategoryIcon';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/ui/Loader';
import ListRow from '../../components/ui/ListRow';
import Border from '../../components/ui/Border';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseholdData } from '../../queries/useHouseholdData';
import { qk } from '../../queries/keys';
import { txApi } from '../../api';
import { resolveCategoryVisual } from '../../lib/category-meta';
import { krw } from '../../lib/format';
import { TE } from '../../lib/toss-emoji';
import type { MoreStackParamList } from '../../navigation/types';
import type { Transaction } from '../../types/api';

type Props = NativeStackScreenProps<MoreStackParamList, 'CategoryTransactions'>;

export default function CategoryTransactionsScreen({ navigation, route }: Props) {
  const { categoryId, categoryName, from, to } = route.params;
  const theme = useTheme();
  const currentHousehold = useAuthStore((s) => s.currentHousehold);
  const hid = currentHousehold?.id;
  const data = useHouseholdData();

  useLayoutEffect(() => {
    navigation.setOptions({ title: categoryName });
  }, [navigation, categoryName]);

  const params = { from, to, type: 'EXPENSE' as const, limit: 1000, ...(categoryId != null ? { categoryId } : {}) };
  const txQ = useQuery({
    queryKey: qk.transactions(hid ?? 0, params),
    queryFn: () => txApi.search(hid!, params),
    enabled: !!hid,
  });

  // axios 응답 인터셉터가 {success, data, total} 봉투를 이미 data로 벗겨내므로 txQ.data는 배열 자체 — useHouseholdData.ts와 동일 방어 처리
  const raw: Transaction[] = Array.isArray(txQ.data) ? txQ.data : ((txQ.data as any)?.data ?? []);
  const rows: Transaction[] = categoryId == null ? raw.filter((t) => t.categoryId == null) : raw;
  const total = rows.reduce((s, t) => s + Number(t.amount), 0);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of rows) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map.entries()];
  }, [rows]);

  const visual = resolveCategoryVisual(categoryId, categoryName, data.categories);

  if (txQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <CategoryIcon icon={visual.icon} size={36} bg={visual.color + '22'} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{categoryName}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>{rows.length}건</Text>
        </View>
        <Text style={{ color: theme.danger, fontSize: 17, fontWeight: '800' }}>{krw(total)}</Text>
      </View>

      <View style={styles.sectionPad}>
        {rows.length === 0 ? (
          <EmptyState iconCode={TE.receipt} title="이 기간에 해당 카테고리 거래가 없어요" />
        ) : (
          grouped.map(([date, txs]) => (
            <View key={date} style={{ marginBottom: 12 }}>
              <Text style={[styles.dayTitle, { color: theme.textMuted }]}>
                {Number(date.slice(5, 7))}월 {Number(date.slice(8, 10))}일
              </Text>
              <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {txs.map((t, i) => (
                  <View key={t.id}>
                    <ListRow
                      left={<CategoryIcon icon={visual.icon} size={18} bg={theme.bg} />}
                      contents={<Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{(t as unknown as { title?: string }).title || t.memo || categoryName}</Text>}
                      right={<Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{krw(t.amount)}</Text>}
                      verticalPadding="small"
                    />
                    {i < txs.length - 1 && <Border type="full" />}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 20, marginBottom: 8, borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionPad: { paddingHorizontal: 20, paddingTop: 12 },
  dayTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  dayCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
});
