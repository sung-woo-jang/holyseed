import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { snapshotsApi } from '../../api';
import { useHousehold } from '../../hooks';
import { qk } from '../../queries/keys';
import type { Asset } from '../../types/api';
import BottomSheet from './BottomSheet';

interface SnapshotSheetProps {
  visible: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export default function SnapshotSheet({ visible, onClose, asset }: SnapshotSheetProps) {
  const { household } = useHousehold();
  const qc = useQueryClient();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      snapshotsApi.upsert(asset!.id, {
        date,
        value: Number(value.replace(/,/g, '')),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.assets(household!.id) });
      qc.invalidateQueries({ queryKey: qk.asset(asset!.id) });
      qc.invalidateQueries({ queryKey: qk.assetSnapshots(asset!.id) });
      qc.invalidateQueries({ queryKey: qk.dashboard(household!.id) });
      setValue('');
      onClose();
    },
  });

  const canSubmit = value.length > 0 && Number(value.replace(/,/g, '')) >= 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`${asset?.name ?? ''} 평가액 입력`}>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>날짜</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>평가액 (원)</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
          placeholder="0"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={() => mutate()}
          disabled={!canSubmit || isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>저장</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  label: { fontSize: 13, color: '#8B95A1', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
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
