import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SheetModal from '../../../components/sheets/SheetModal';
import TextField from '../../../components/ui/TextField';
import Switch from '../../../components/ui/Switch';
import Button from '../../../components/ui/Button';
import { labWorklogApi, type WorklogCategoryOption } from '../../../api/lab-worklog';
import { useTheme } from '../../../lib/theme';
import { getErrorMessage } from '../../../lib/error';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface EditState {
  name: string;
  defaultDailyWage: string;
  defaultWithholdingApplied: boolean;
  overtimeThresholdHours: string;
  overtimeExtraRatePct: string;
}

function toEditState(c: WorklogCategoryOption): EditState {
  return {
    name: c.name,
    defaultDailyWage: c.defaultDailyWage != null ? String(c.defaultDailyWage) : '',
    defaultWithholdingApplied: c.defaultWithholdingApplied,
    overtimeThresholdHours: String(c.overtimeThresholdHours),
    overtimeExtraRatePct: String(Math.round(c.overtimeExtraRate * 1000) / 10),
  };
}

export default function WorklogCategorySheet({ visible, onClose }: Props) {
  const theme = useTheme();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newJobName, setNewJobName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const categoriesQ = useQuery({ queryKey: ['lab-worklog-categories'], queryFn: labWorklogApi.categoryOptions, enabled: visible });
  const jobsQ = useQuery({ queryKey: ['lab-worklog-jobs'], queryFn: labWorklogApi.jobOptions, enabled: visible });

  const categories = [...(categoriesQ.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const jobs = jobsQ.data ?? [];

  function refetchAll() {
    categoriesQ.refetch();
    qc.invalidateQueries({ queryKey: ['lab-worklog-categories'] });
  }

  function toggleExpand(c: WorklogCategoryOption) {
    if (expandedId === c.id) {
      setExpandedId(null);
      setEditState(null);
      return;
    }
    setExpandedId(c.id);
    setEditState(toEditState(c));
    setError('');
  }

  async function handleSaveEdit(id: number) {
    if (!editState) return;
    setSaving(true);
    setError('');
    try {
      await labWorklogApi.updateCategoryOption({
        id,
        name: editState.name.trim(),
        defaultDailyWage: editState.defaultDailyWage ? Number(editState.defaultDailyWage) : null,
        defaultWithholdingApplied: editState.defaultWithholdingApplied,
        overtimeThresholdHours: editState.overtimeThresholdHours ? Number(editState.overtimeThresholdHours) : undefined,
        overtimeExtraRate: editState.overtimeExtraRatePct ? Number(editState.overtimeExtraRatePct) / 100 : undefined,
      });
      refetchAll();
      setExpandedId(null);
      setEditState(null);
    } catch (e) {
      setError(getErrorMessage(e, '저장에 실패했어요'));
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    await labWorklogApi.reorderCategoryOptions(reordered.map((c) => c.id));
    refetchAll();
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await labWorklogApi.createCategoryOption({ name: newCategoryName.trim() });
      setNewCategoryName('');
      setAddingCategory(false);
      refetchAll();
    } catch (e) {
      setError(getErrorMessage(e, '분류 추가에 실패했어요'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddJob(category: string) {
    if (!newJobName.trim()) return;
    try {
      await labWorklogApi.createJobOption(newJobName.trim(), category);
      setNewJobName('');
      jobsQ.refetch();
    } catch (e) {
      setError(getErrorMessage(e, '업무 추가에 실패했어요'));
    }
  }

  async function handleDeleteJob(id: number) {
    await labWorklogApi.deleteJobOption(id);
    jobsQ.refetch();
  }

  return (
    <SheetModal visible={visible} onClose={onClose} header="분류/업무 관리">
      <View style={{ gap: 10 }}>
        {categories.map((c, i) => {
          const expanded = expandedId === c.id;
          const catJobs = jobs.filter((j) => j.category === c.name);
          return (
            <View key={c.id} style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Pressable style={styles.headerRow} onPress={() => toggleExpand(c)}>
                <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '700' }}>{c.name}</Text>
                <View style={styles.moveRow}>
                  <Pressable hitSlop={8} disabled={i === 0} onPress={() => handleMove(i, -1)}>
                    <Text style={{ color: i === 0 ? theme.textMuted : theme.text, fontSize: 15, opacity: i === 0 ? 0.4 : 1 }}>▲</Text>
                  </Pressable>
                  <Pressable hitSlop={8} disabled={i === categories.length - 1} onPress={() => handleMove(i, 1)}>
                    <Text style={{ color: i === categories.length - 1 ? theme.textMuted : theme.text, fontSize: 15, opacity: i === categories.length - 1 ? 0.4 : 1 }}>▼</Text>
                  </Pressable>
                  <Text style={{ color: theme.textMuted, fontSize: 13 }}>{expanded ? '▴' : '▾'}</Text>
                </View>
              </Pressable>

              {expanded && editState && (
                <View style={styles.editArea}>
                  <TextField variant="box" placeholder="분류 이름" value={editState.name} onChangeText={(v) => setEditState({ ...editState, name: v })} style={{ marginBottom: 10 }} />
                  <View style={styles.row2}>
                    <TextField
                      variant="box"
                      placeholder="기본 일급여 (미지정 시 자동)"
                      value={editState.defaultDailyWage}
                      onChangeText={(v) => setEditState({ ...editState, defaultDailyWage: v })}
                      keyboardType="numeric"
                      suffix="원"
                      style={{ flex: 1 }}
                    />
                  </View>
                  <View style={styles.row2}>
                    <TextField
                      variant="box"
                      placeholder="초과근무 임계시간"
                      value={editState.overtimeThresholdHours}
                      onChangeText={(v) => setEditState({ ...editState, overtimeThresholdHours: v })}
                      keyboardType="numeric"
                      suffix="시간"
                      style={{ flex: 1 }}
                    />
                    <TextField
                      variant="box"
                      placeholder="초과수당 가산율"
                      value={editState.overtimeExtraRatePct}
                      onChangeText={(v) => setEditState({ ...editState, overtimeExtraRatePct: v })}
                      keyboardType="numeric"
                      suffix="%"
                      style={{ flex: 1 }}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '600' }}>원천징수(3.3%) 기본 적용</Text>
                    <Switch checked={editState.defaultWithholdingApplied} onCheckedChange={(v) => setEditState({ ...editState, defaultWithholdingApplied: v })} />
                  </View>

                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700', marginTop: 4, marginBottom: 8 }}>업무 항목</Text>
                  <View style={styles.jobChipRow}>
                    {catJobs.map((j) => (
                      <View key={j.id} style={[styles.jobChip, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                        <Text style={{ color: theme.text, fontSize: 12.5 }}>{j.name}</Text>
                        <Pressable hitSlop={8} onPress={() => handleDeleteJob(j.id)}>
                          <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <View style={styles.row2}>
                    <TextField variant="box" placeholder="새 업무 이름" value={newJobName} onChangeText={setNewJobName} style={{ flex: 1 }} />
                    <Pressable style={[styles.smallBtn, { borderColor: theme.border }]} onPress={() => handleAddJob(c.name)}>
                      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>추가</Text>
                    </Pressable>
                  </View>

                  {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 6 }}>{error}</Text> : null}
                  <View style={{ marginTop: 10 }}>
                    <Button display="full" size="small" type="primary" loading={saving} onPress={() => handleSaveEdit(c.id)}>
                      저장
                    </Button>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {addingCategory ? (
          <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card, padding: 12 }]}>
            <View style={styles.row2}>
              <TextField variant="box" placeholder="새 분류 이름" value={newCategoryName} onChangeText={setNewCategoryName} style={{ flex: 1 }} />
              <Button size="small" type="primary" loading={saving} onPress={handleAddCategory}>
                추가
              </Button>
            </View>
          </View>
        ) : (
          <Pressable style={[styles.addBtn, { borderColor: theme.border }]} onPress={() => setAddingCategory(true)}>
            <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>+ 분류 추가</Text>
          </Pressable>
        )}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  moveRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  editArea: { paddingHorizontal: 14, paddingBottom: 14 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  jobChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  jobChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  addBtn: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  smallBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
});
