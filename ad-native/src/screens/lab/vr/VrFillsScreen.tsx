import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import ListRow from '../../../components/ui/ListRow';
import Border from '../../../components/ui/Border';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import AppToast from '../../../components/common/AppToast';
import VrFillForm from './VrFillForm';
import { vrApi, type VrFill } from '../../../api/vr';
import { useTheme } from '../../../lib/theme';
import { getErrorMessage } from '../../../lib/error';
import { TE } from '../../../lib/toss-emoji';

const KIND_LABEL: Record<VrFill['kind'], string> = {
  INITIAL_BUY: '초기매수',
  BUY: '매수',
  SELL: '매도',
  DEPOSIT: '입금',
};

function usd(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function VrFillsScreen() {
  const theme = useTheme();
  const [formVisible, setFormVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VrFill | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const fillsQ = useQuery({ queryKey: ['vr-fills'], queryFn: vrApi.fills });
  const fills = [...(fillsQ.data ?? [])].reverse();

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vrApi.deleteFill(deleteTarget.id);
      setDeleteTarget(null);
      setToast('체결을 삭제했어요');
      fillsQ.refetch();
    } catch (e) {
      setToast(getErrorMessage(e, '삭제에 실패했어요'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>{fills.length}건</Text>
        <Pressable style={[styles.addBtn, { backgroundColor: theme.brand }]} onPress={() => setFormVisible(true)}>
          <Text style={styles.addBtnText}>+ 체결 등록</Text>
        </Pressable>
      </View>

      {fillsQ.isLoading ? (
        <View style={styles.center}>
          <Loader size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 32 }}>
          {fills.length === 0 ? (
            <EmptyState iconCode={TE.chartBar} title="체결 내역이 없어요" desc="+ 체결 등록으로 추가해보세요" />
          ) : (
            <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {fills.map((f, i) => (
                <View key={f.id}>
                  <ListRow
                    left={
                      <View style={[styles.kindDot, { backgroundColor: f.kind === 'SELL' ? theme.danger + '22' : theme.brand + '22' }]}>
                        <Text style={{ color: f.kind === 'SELL' ? theme.danger : theme.brand, fontSize: 11, fontWeight: '800' }}>{KIND_LABEL[f.kind].slice(0, 2)}</Text>
                      </View>
                    }
                    contents={
                      <View>
                        <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '700' }}>
                          {KIND_LABEL[f.kind]} · {f.fillDate}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>
                          {f.kind === 'DEPOSIT' ? `입금 ${usd(f.price)}` : `${usd(f.price)} × ${f.quantity}주`} · 잔고 {f.qtyAfter}주 / Pool {usd(f.poolAfter)}
                        </Text>
                        {f.note && (
                          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{f.note}</Text>
                        )}
                      </View>
                    }
                    right={
                      <Pressable hitSlop={8} onPress={() => setDeleteTarget(f)}>
                        <Text style={{ color: theme.textMuted, fontSize: 18, fontWeight: '700' }}>⋯</Text>
                      </Pressable>
                    }
                    verticalPadding="small"
                  />
                  {i < fills.length - 1 && <Border type="full" />}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <VrFillForm visible={formVisible} onClose={() => setFormVisible(false)} onSaved={() => { setFormVisible(false); setToast('체결을 등록했어요'); fillsQ.refetch(); }} />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="이 체결을 삭제할까요?"
        description="이후 스냅샷(보유수량·평단·Pool)이 전체 재계산돼요."
        confirmText="삭제하기"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  listCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  kindDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
