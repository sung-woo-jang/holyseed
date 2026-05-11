import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { recurringApi, txApi } from '../api';
import AddTxSheet from '../components/sheets/AddTxSheet';
import EmptyState from '../components/common/EmptyState';
import ScreenHeader, { HeaderButton } from '../components/common/ScreenHeader';
import { useCanEdit, useHousehold } from '../hooks';
import { qk } from '../queries/keys';
import { TX_TYPE_LABEL, dateStr, krwShort } from '../lib/format';

type BookTab = 'tx' | 'recurring';

export default function BookScreen() {
  const { household } = useHousehold();
  const canEdit = useCanEdit();
  const [activeTab, setActiveTab] = useState<BookTab>('tx');
  const [addTxVisible, setAddTxVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="거래장"
        right={
          canEdit && activeTab === 'tx' ? (
            <HeaderButton label="+ 추가" onPress={() => setAddTxVisible(true)} />
          ) : undefined
        }
      />

      <View style={styles.tabRow}>
        {(['tx', 'recurring'] as BookTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'tx' ? '거래' : '정기'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'tx' ? (
        <TxList householdId={household?.id ?? 0} canEdit={canEdit} />
      ) : (
        <RecurringList householdId={household?.id ?? 0} canEdit={canEdit} />
      )}

      <AddTxSheet visible={addTxVisible} onClose={() => setAddTxVisible(false)} />
    </View>
  );
}

function TxList({ householdId, canEdit }: { householdId: number; canEdit: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: qk.transactions(householdId),
    queryFn: () => txApi.search(householdId, { limit: 50 }),
    enabled: !!householdId,
  });
  const txList = data?.data ?? [];

  const { mutate: deleteTx } = useMutation({
    mutationFn: (id: number) => txApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.transactions(householdId) }),
  });

  if (isLoading) return null;
  if (txList.length === 0)
    return <EmptyState icon="📒" title="거래 내역이 없어요" desc="거래를 추가해보세요." />;

  return (
    <FlatList
      data={txList}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.txRow}>
          <View style={styles.txLeft}>
            <Text style={styles.txDate}>{dateStr(item.date)}</Text>
            <Text style={styles.txMemo}>{item.memo ?? TX_TYPE_LABEL[item.type]}</Text>
          </View>
          <View style={styles.txRight}>
            <Text style={[
              styles.txAmount,
              item.type === 'INCOME' && styles.income,
              item.type === 'EXPENSE' && styles.expense,
            ]}>
              {item.type === 'EXPENSE' ? '-' : '+'}{krwShort(item.amount)}
            </Text>
            {canEdit && (
              <TouchableOpacity onPress={() => deleteTx(item.id)}>
                <Text style={styles.deleteText}>삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );
}

function RecurringList({ householdId, canEdit }: { householdId: number; canEdit: boolean }) {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery({
    queryKey: qk.recurring(householdId),
    queryFn: () => recurringApi.list(householdId),
    enabled: !!householdId,
  });

  const { mutate: toggle } = useMutation({
    mutationFn: (id: number) => recurringApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recurring(householdId) }),
  });

  if (isLoading) return null;
  if (list.length === 0)
    return <EmptyState icon="🔄" title="정기 거래가 없어요" desc="매월 반복되는 거래를 등록해보세요." />;

  return (
    <FlatList
      data={list}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.txRow}>
          <View style={styles.txLeft}>
            <Text style={styles.txMemo}>{item.name}</Text>
            <Text style={styles.txDate}>
              매월 {item.dayOfMonth}일 · {TX_TYPE_LABEL[item.type]}
            </Text>
          </View>
          <View style={styles.txRight}>
            <Text style={[
              styles.txAmount,
              item.type === 'INCOME' && styles.income,
              item.type === 'EXPENSE' && styles.expense,
            ]}>
              {krwShort(item.amount)}
            </Text>
            {canEdit && (
              <Switch
                value={item.active}
                onValueChange={() => toggle(item.id)}
                trackColor={{ true: '#3182F6' }}
              />
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8B95A1' },
  tabTextActive: { color: '#191F28' },
  list: { paddingHorizontal: 20, gap: 2 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  txLeft: { flex: 1 },
  txDate: { fontSize: 12, color: '#8B95A1', marginBottom: 2 },
  txMemo: { fontSize: 15, fontWeight: '500', color: '#191F28' },
  txRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txAmount: { fontSize: 15, fontWeight: '600', color: '#191F28' },
  income: { color: '#3182F6' },
  expense: { color: '#FF3B30' },
  deleteText: { fontSize: 12, color: '#FF3B30' },
});
