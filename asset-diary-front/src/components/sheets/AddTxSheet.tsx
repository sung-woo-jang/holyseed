import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { categoriesApi, txApi } from '../../api';
import { useHousehold } from '../../hooks';
import { qk } from '../../queries/keys';
import type { TxType } from '../../types/api';
import BottomSheet from './BottomSheet';

interface AddTxSheetProps {
  visible: boolean;
  onClose: () => void;
}

const TX_TYPES: { key: TxType; label: string }[] = [
  { key: 'INCOME', label: '수입' },
  { key: 'EXPENSE', label: '지출' },
  { key: 'TRANSFER', label: '이체' },
];

export default function AddTxSheet({ visible, onClose }: AddTxSheetProps) {
  const { household } = useHousehold();
  const qc = useQueryClient();

  const [type, setType] = useState<TxType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '');

  const { data: categories = [] } = useQuery({
    queryKey: qk.categories(household?.id ?? 0),
    queryFn: () => categoriesApi.list(household!.id),
    enabled: !!household && visible,
  });

  const filtered = categories.filter((c) => c.type === type || c.type === 'TRANSFER');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      txApi.create(household!.id, {
        date,
        type,
        amount: Number(amount.replace(/,/g, '')),
        memo: memo || undefined,
        categoryId: categoryId ?? undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions(household!.id) });
      qc.invalidateQueries({ queryKey: qk.transactionsRecent(household!.id) });
      reset();
      onClose();
    },
  });

  function reset() {
    setAmount('');
    setMemo('');
    setCategoryId(null);
    setDate(new Date().toISOString().split('T')[0] ?? '');
  }

  const canSubmit = amount.length > 0 && Number(amount.replace(/,/g, '')) > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="거래 추가">
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.typeRow}>
          {TX_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
              onPress={() => { setType(t.key); setCategoryId(null); }}
            >
              <Text style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>날짜</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>금액 (원)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
        />

        <Text style={styles.label}>메모</Text>
        <TextInput
          style={styles.input}
          value={memo}
          onChangeText={setMemo}
          placeholder="선택사항"
        />

        {filtered.length > 0 && (
          <>
            <Text style={styles.label}>카테고리</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {filtered.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
                  onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                >
                  <Text style={styles.catChipText}>{c.icon} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={() => mutate()}
          disabled={!canSubmit || isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>추가</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#3182F6' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#8B95A1' },
  typeBtnTextActive: { color: '#fff' },
  label: { fontSize: 13, color: '#8B95A1', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  catScroll: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F4F6',
    marginRight: 8,
  },
  catChipActive: { backgroundColor: '#3182F620', borderWidth: 1, borderColor: '#3182F6' },
  catChipText: { fontSize: 13, color: '#4E5968' },
  submitBtn: {
    backgroundColor: '#3182F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  submitBtnDisabled: { backgroundColor: '#C9CEDD' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
