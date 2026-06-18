import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ListRow } from '@toss/tds-react-native';
import SheetModal from './SheetModal';
import PickerOverlay from './PickerOverlay';
import FormRow from '../common/FormRow';
import TossEmoji from '../common/TossEmoji';
import { Icon } from '../common/Icon';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { getCategoryDef } from '../../lib/category-meta';
import { krw } from '../../lib/format';
import { useSettleWorkLog } from '../../queries/mutations';
import type { WorkLog } from '../../types/api';

interface SettleWorkSheetProps {
  visible: boolean;
  month: string;
  workLog: WorkLog | null;
  onClose: () => void;
  onSettled?: () => void;
}

export default function SettleWorkSheet({ visible, month, workLog, onClose, onSettled }: SettleWorkSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const [asset, setAsset] = useState<{ id: string; name: string } | null>(null);
  const [category, setCategory] = useState<{ id: number; name: string } | null>(null);
  const [assetPicker, setAssetPicker] = useState(false);
  const [catPicker, setCatPicker] = useState(false);
  const [error, setError] = useState('');
  const settleWorkLog = useSettleWorkLog(month);

  const assetOptions = data.assets.filter((a) => !a.isLiability);
  const incomeCategories = data.categories.filter((c) => c.type === 'INCOME');

  useEffect(() => {
    if (visible) { setAsset(null); setCategory(null); setError(''); }
  }, [visible]);

  async function handleSettle() {
    if (!workLog) return;
    setError('');
    try {
      await settleWorkLog.mutateAsync({
        id: workLog.id,
        dto: {
          ...(asset ? { toAssetId: Number(asset.id) } : {}),
          ...(category ? { categoryId: category.id } : {}),
        },
      });
      onClose();
      onSettled?.();
    } catch (e: any) {
      setError(e?.message ?? '수령 처리에 실패했어요. 다시 시도해 주세요.');
    }
  }

  return (
    <>
      <SheetModal
        visible={visible}
        onClose={onClose}
        header="수령 처리"
        cta={
          <View style={styles.cta}>
            {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
            <Button display="full" size="big" type="primary" disabled={!asset} loading={settleWorkLog.isPending} onPress={handleSettle}>
              수령 처리하기
            </Button>
          </View>
        }
        overlay={
          <>
            {/* 자산 피커 */}
            <PickerOverlay visible={assetPicker} title="입금 자산 선택" onClose={() => setAssetPicker(false)}>
              {assetOptions.map((a) => (
                <ListRow
                  key={a.id}
                  contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{a.name}</Text>}
                  right={asset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
                  onPress={() => { setAsset({ id: a.id, name: a.name }); setAssetPicker(false); }}
                  verticalPadding="small"
                />
              ))}
            </PickerOverlay>

            {/* 카테고리 피커 */}
            <PickerOverlay visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
              {incomeCategories.map((c) => {
                const def = getCategoryDef(c.name);
                return (
                  <ListRow
                    key={c.id}
                    left={<TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} />}
                    contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{c.name}</Text>}
                    right={category?.id === c.id ? Icon.check(theme.brand, 16) : undefined}
                    onPress={() => { setCategory({ id: c.id, name: c.name }); setCatPicker(false); }}
                    verticalPadding="small"
                  />
                );
              })}
            </PickerOverlay>
          </>
        }
      >
        <View style={styles.body}>
          {/* 요약 */}
          <View style={[styles.summaryCard, { backgroundColor: theme.brandSoft }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>{workLog?.title}</Text>
            <Text style={[styles.summaryAmount, { color: theme.brand }]}>+{krw(Number(workLog?.amount ?? 0))}</Text>
          </View>
          <Text style={[styles.guide, { color: theme.textMuted }]}>
            수령 처리하면 선택한 자산에 수입으로 기록돼요
          </Text>

          {/* 필드 */}
          <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
            <FormRow label="입금 자산" value={asset?.name || ''} onPress={() => setAssetPicker(true)} />
            <FormRow label="카테고리" value={category?.name || ''} onPress={() => setCatPicker(true)} />
          </View>
        </View>
      </SheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  summaryCard: { borderRadius: 14, padding: 16, alignItems: 'center', gap: 4, marginBottom: 12 },
  summaryTitle: { fontSize: 15, fontWeight: '700' },
  summaryAmount: { fontSize: 22, fontWeight: '800' },
  guide: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  fieldsCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cta: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
