import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardApi } from '../api';
import AddTxSheet from '../components/sheets/AddTxSheet';
import { useCanEdit, useHousehold } from '../hooks';
import { qk } from '../queries/keys';
import { TX_TYPE_LABEL, dateStr, krw, krwShort, pct } from '../lib/format';

export default function HomeScreen() {
  const { household } = useHousehold();
  const canEdit = useCanEdit();
  const [addTxVisible, setAddTxVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: qk.dashboard(household?.id ?? 0),
    queryFn: () => dashboardApi.get(household!.id),
    enabled: !!household,
  });

  const d = (data as any)?.data ?? data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.householdName}>{household?.name ?? ''}</Text>
        {canEdit && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddTxVisible(true)}>
            <Text style={styles.addBtnText}>+ 거래</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 순자산 카드 */}
      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>순자산</Text>
        {isLoading ? (
          <Text style={styles.netWorthValue}>계산 중...</Text>
        ) : (
          <>
            <Text style={styles.netWorthValue}>{krw(d?.netWorth ?? 0)}</Text>
            {d?.netWorthChangeRate != null && (
              <Text style={[styles.changeRate, d.netWorthChangeRate >= 0 ? styles.positive : styles.negative]}>
                전년 대비 {pct(d.netWorthChangeRate)}
              </Text>
            )}
          </>
        )}
      </View>

      {/* 자산군 도넛 요약 */}
      {d?.byCategory && d.byCategory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>자산 구성</Text>
          <View style={styles.donutSummary}>
            {(d.byCategory as any[]).slice(0, 4).map((item: any) => (
              <View key={item.category} style={styles.donutItem}>
                <Text style={styles.donutValue}>{krwShort(item.totalKrw)}</Text>
                <Text style={styles.donutLabel}>{item.category}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 최근 거래 */}
      {d?.recentTransactions && d.recentTransactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 거래</Text>
          {(d.recentTransactions as any[]).map((tx: any) => (
            <View key={tx.id} style={styles.txRow}>
              <View>
                <Text style={styles.txMemo}>{tx.memo ?? TX_TYPE_LABEL[tx.type]}</Text>
                <Text style={styles.txDate}>{dateStr(tx.date)}</Text>
              </View>
              <Text style={[
                styles.txAmount,
                tx.type === 'INCOME' && styles.positive,
                tx.type === 'EXPENSE' && styles.negative,
              ]}>
                {tx.type === 'EXPENSE' ? '-' : '+'}{krwShort(tx.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <AddTxSheet visible={addTxVisible} onClose={() => setAddTxVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  householdName: { fontSize: 18, fontWeight: '700', color: '#191F28' },
  addBtn: { backgroundColor: '#EBF3FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { fontSize: 13, color: '#3182F6', fontWeight: '600' },
  netWorthCard: {
    backgroundColor: '#3182F6',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  netWorthLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  netWorthValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  changeRate: { fontSize: 13, marginTop: 6, fontWeight: '600' },
  positive: { color: '#34C759' },
  negative: { color: '#FF6D35' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#191F28', marginBottom: 12 },
  donutSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  donutItem: {
    width: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  donutValue: { fontSize: 16, fontWeight: '700', color: '#191F28', marginBottom: 2 },
  donutLabel: { fontSize: 12, color: '#8B95A1' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  txMemo: { fontSize: 14, fontWeight: '500', color: '#191F28', marginBottom: 2 },
  txDate: { fontSize: 12, color: '#8B95A1' },
  txAmount: { fontSize: 15, fontWeight: '600', color: '#191F28' },
});
