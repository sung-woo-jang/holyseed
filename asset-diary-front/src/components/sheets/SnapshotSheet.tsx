import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { krw, krwShort } from '../../lib/format';
import TossEmoji from '../common/TossEmoji';
import { TE } from '../../lib/toss-emoji';

interface SnapshotSheetProps {
  visible: boolean;
  onClose: () => void;
  focusAssetId?: string;
}

function formatAmount(raw: string): string {
  const num = raw.replace(/[^0-9]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString();
}

export default function SnapshotSheet({ visible, onClose, focusAssetId }: SnapshotSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const assets = focusAssetId
    ? data.assets.filter((a) => a.id === focusAssetId)
    : data.assets;

  const getNum = (id: string) => {
    const raw = values[id]?.replace(/[^0-9]/g, '');
    return raw ? Number(raw) : null;
  };

  const totalNew = assets.reduce((sum, a) => {
    const v = getNum(a.id);
    return sum + (v !== null ? v : a.value);
  }, 0);

  const totalOld = assets.reduce((sum, a) => sum + a.value, 0);
  const delta = totalNew - totalOld;
  const hasInput = Object.values(values).some((v) => v.replace(/[^0-9]/g, '') !== '');

  function handleSave() {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setValues({});
      onClose();
    }, 700);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          {saved ? (
            <View style={styles.confirmBox}>
              <TossEmoji code={TE.check} size={64} />
              <Text style={[styles.confirmTitle, { color: theme.text }]}>저장 완료!</Text>
              <Text style={[styles.confirmSub, { color: theme.textMuted }]}>대시보드가 업데이트됐어요</Text>
            </View>
          ) : (
            <>
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {focusAssetId ? '개별 스냅샷 입력' : '일괄 스냅샷 입력'}
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[styles.close, { color: theme.textMuted }]}>닫기</Text>
                </TouchableOpacity>
              </View>

              {!focusAssetId && hasInput && (
                <View style={[styles.deltaSummary, {
                  backgroundColor: delta >= 0 ? theme.brandSoft : '#FEE2E2',
                }]}>
                  <Text style={[styles.deltaSumLabel, { color: delta >= 0 ? theme.brand : theme.danger }]}>
                    합계 변화
                  </Text>
                  <Text style={[styles.deltaSumValue, { color: delta >= 0 ? theme.brand : theme.danger }]}>
                    {delta >= 0 ? '+' : ''}{krw(delta)}
                  </Text>
                </View>
              )}

              <ScrollView contentContainerStyle={styles.body}>
                {assets.map((asset, idx) => {
                  const newVal = getNum(asset.id);
                  const diff = newVal !== null ? newVal - asset.value : null;
                  return (
                    <View key={asset.id} style={[styles.assetRow, { borderBottomColor: theme.border, borderBottomWidth: idx < assets.length - 1 ? 1 : 0 }]}>
                      <View style={styles.assetInfo}>
                        <Text style={[styles.assetName, { color: theme.text }]}>{asset.name}</Text>
                        <Text style={[styles.prevVal, { color: theme.textMuted }]}>이전: {krwShort(asset.value)}</Text>
                      </View>
                      <View style={styles.inputWrap}>
                        <TextInput
                          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
                          keyboardType="numeric"
                          placeholder="금액 입력"
                          placeholderTextColor={theme.textMuted}
                          value={values[asset.id] ?? ''}
                          onChangeText={(t) => setValues((prev) => ({ ...prev, [asset.id]: formatAmount(t) }))}
                        />
                        {diff !== null && (
                          <Text style={[styles.diffText, { color: diff >= 0 ? theme.brand : theme.danger }]}>
                            {diff >= 0 ? '+' : ''}{krwShort(diff)}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: hasInput ? theme.brand : theme.border }]}
                  onPress={handleSave}
                  disabled={!hasInput}
                >
                  <Text style={[styles.saveBtnText, { color: hasInput ? '#fff' : theme.textMuted }]}>저장하기</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  close: { fontSize: 14 },
  deltaSummary: { marginHorizontal: 20, marginTop: 12, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deltaSumLabel: { fontSize: 13 },
  deltaSumValue: { fontSize: 16, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  assetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 14, fontWeight: '600' },
  prevVal: { fontSize: 12, marginTop: 2 },
  inputWrap: { alignItems: 'flex-end', gap: 4 },
  input: { width: 140, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, textAlign: 'right' },
  diffText: { fontSize: 12, fontWeight: '600' },
  footer: { padding: 20, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 22, fontWeight: '800' },
  confirmSub: { fontSize: 14 },
});
