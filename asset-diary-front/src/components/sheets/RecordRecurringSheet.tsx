import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, TextFieldBig } from '@toss/tds-react-native';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { useRunRecurring } from '../../queries/mutations';
import type { MockRecurring } from '../../lib/mock-data';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface RecordRecurringSheetProps {
  visible: boolean;
  recurring: MockRecurring | null;
  onClose: () => void;
  onRecorded?: () => void;
}

export default function RecordRecurringSheet({ visible, recurring, onClose, onRecorded }: RecordRecurringSheetProps) {
  const theme = useTheme();
  const useMock = useAuthStore((s) => s.useMock);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const runRecurring = useRunRecurring();

  useEffect(() => {
    if (visible) { setAmount(''); setError(''); }
  }, [visible]);

  const amtNum = Number(amount.replace(/[^0-9]/g, ''));

  async function handleRecord() {
    if (!recurring || amtNum <= 0) return;
    setError('');
    // mock 모드는 실제 API 호출 없이 데모 처리
    if (useMock) {
      onClose();
      onRecorded?.();
      return;
    }
    try {
      await runRecurring.mutateAsync({ id: Number(recurring.id), amount: amtNum });
      onClose();
      onRecorded?.();
    } catch (e: any) {
      setError(e?.message ?? '기록에 실패했어요. 다시 시도해 주세요.');
    }
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header={recurring ? `${recurring.title} 이번 달 금액` : '이번 달 금액'}
      cta={
        <View style={styles.cta}>
          {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={amtNum <= 0} loading={runRecurring.isPending} onPress={handleRecord}>
            기록하기
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        <Text style={[styles.guide, { color: theme.textMuted }]}>
          이번 달 실제 금액을 입력하면 거래로 기록돼요
        </Text>
        <View style={styles.amountWrap}>
          <TextFieldBig
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={(t) => setAmount(formatNum(t))}
            suffix="원"
            autoFocus
            style={styles.amountField}
          />
        </View>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  guide: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  amountWrap: { alignItems: 'center' },
  amountField: { width: '100%' },
  cta: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
