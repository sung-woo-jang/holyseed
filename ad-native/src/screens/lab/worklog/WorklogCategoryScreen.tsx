import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import DateTimePicker from '@react-native-community/datetimepicker';
import TextField from '../../../components/ui/TextField';
import Switch from '../../../components/ui/Switch';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { labWorklogApi, type WorklogCategoryOption, type WorklogJobOption, type WorklogTitleOption } from '../../../api/lab-worklog';
import Border from '../../../components/ui/Border';
import { useTheme } from '../../../lib/theme';
import { getErrorMessage } from '../../../lib/error';
import { timeStringToDate, dateToTimeString } from '../../../lib/date';

interface EditState {
  name: string;
  defaultDailyWage: string;
  defaultWithholdingApplied: boolean;
  overtimeThresholdHours: string;
  overtimeExtraRatePct: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultBreakHours: string;
  defaultAddress: string;
}

function toEditState(c: WorklogCategoryOption): EditState {
  return {
    name: c.name,
    defaultDailyWage: c.defaultDailyWage != null ? String(c.defaultDailyWage) : '',
    defaultWithholdingApplied: c.defaultWithholdingApplied,
    overtimeThresholdHours: String(c.overtimeThresholdHours),
    overtimeExtraRatePct: String(Math.round(c.overtimeExtraRate * 1000) / 10),
    defaultStartTime: c.defaultStartTime ?? '',
    defaultEndTime: c.defaultEndTime ?? '',
    defaultBreakHours: c.defaultBreakHours != null ? String(c.defaultBreakHours) : '',
    defaultAddress: c.defaultAddress ?? '',
  };
}

export default function WorklogCategoryScreen() {
  const theme = useTheme();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newJobName, setNewJobName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [defaultStartPickerVisible, setDefaultStartPickerVisible] = useState(false);
  const [defaultEndPickerVisible, setDefaultEndPickerVisible] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editingTitleName, setEditingTitleName] = useState('');
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [editingJobName, setEditingJobName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const categoriesQ = useQuery({ queryKey: ['lab-worklog-categories'], queryFn: labWorklogApi.categoryOptions });
  const jobsQ = useQuery({ queryKey: ['lab-worklog-jobs'], queryFn: labWorklogApi.jobOptions });
  const titleOptionsQ = useQuery({ queryKey: ['lab-worklog-title-options'], queryFn: labWorklogApi.titleOptions });
  const titleOptions = titleOptionsQ.data ?? [];

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
        defaultStartTime: editState.defaultStartTime || null,
        defaultEndTime: editState.defaultEndTime || null,
        defaultBreakHours: editState.defaultBreakHours ? Number(editState.defaultBreakHours) : null,
        defaultAddress: editState.defaultAddress || null,
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

  async function handleReorder(data: WorklogCategoryOption[]) {
    await labWorklogApi.reorderCategoryOptions(data.map((c) => c.id));
    refetchAll();
  }

  async function handleDeleteCategory(id: number) {
    setDeletingCategory(true);
    try {
      await labWorklogApi.deleteCategoryOption(id);
      setDeletingCategoryId(null);
      if (expandedId === id) {
        setExpandedId(null);
        setEditState(null);
      }
      refetchAll();
    } catch (e) {
      setError(getErrorMessage(e, '분류 삭제에 실패했어요'));
    } finally {
      setDeletingCategory(false);
    }
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

  function startEditJob(j: WorklogJobOption) {
    setEditingJobId(j.id);
    setEditingJobName(j.name);
  }

  async function handleSaveJobName() {
    if (editingJobId == null || !editingJobName.trim()) return;
    try {
      await labWorklogApi.renameJobOption(editingJobId, editingJobName.trim());
      setEditingJobId(null);
      jobsQ.refetch();
    } catch (e) {
      setError(getErrorMessage(e, '업무 이름 수정에 실패했어요'));
    }
  }

  function startEditTitle(t: WorklogTitleOption) {
    setEditingTitleId(t.id);
    setEditingTitleName(t.name);
  }

  async function handleSaveTitle() {
    if (editingTitleId == null || !editingTitleName.trim()) return;
    try {
      await labWorklogApi.renameTitleOption(editingTitleId, editingTitleName.trim());
      setEditingTitleId(null);
      titleOptionsQ.refetch();
    } catch (e) {
      setError(getErrorMessage(e, '현장명 수정에 실패했어요'));
    }
  }

  async function handleDeleteTitle(id: number) {
    await labWorklogApi.deleteTitleOption(id);
    titleOptionsQ.refetch();
  }

  function renderItem({ item: c, getIndex, drag, isActive }: RenderItemParams<WorklogCategoryOption>) {
    const expanded = expandedId === c.id;
    const catJobs = jobs.filter((j) => j.category === c.name);
    const catTitles = titleOptions.filter((t) => t.category === c.name);
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: isActive ? theme.brandSoft : theme.card }]}>
          <Pressable style={styles.headerRow} onPress={() => toggleExpand(c)}>
            <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '700' }}>{c.name}</Text>
            <View style={styles.moveRow}>
              <Pressable hitSlop={10} onPress={() => setDeletingCategoryId(c.id)}>
                <Text style={{ color: theme.danger, fontSize: 16, fontWeight: '700' }}>×</Text>
              </Pressable>
              <Pressable hitSlop={10} onLongPress={drag} disabled={isActive}>
                <Text style={{ color: theme.textMuted, fontSize: 18, fontWeight: '700' }}>≡</Text>
              </Pressable>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>{expanded ? '▴' : '▾'}</Text>
            </View>
          </Pressable>

          {expanded && editState && (
            <View style={styles.editArea}>
              <TextField variant="box" placeholder="분류 이름" value={editState.name} onChangeText={(v) => setEditState({ ...editState, name: v })} style={{ marginBottom: 12 }} />

              <View style={[styles.section, { backgroundColor: theme.bg }]}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>기본값</Text>
                <TextField
                  variant="box"
                  placeholder="기본 일급여 (미지정 시 자동)"
                  value={editState.defaultDailyWage}
                  onChangeText={(v) => setEditState({ ...editState, defaultDailyWage: v })}
                  keyboardType="numeric"
                  suffix="원"
                  style={{ marginBottom: 10 }}
                />
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
                <View style={[styles.switchRow, { marginBottom: 10 }]}>
                  <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '600' }}>원천징수(3.3%) 기본 적용</Text>
                  <Switch checked={editState.defaultWithholdingApplied} onCheckedChange={(v) => setEditState({ ...editState, defaultWithholdingApplied: v })} />
                </View>

                <View style={styles.row2}>
                  <Pressable onPress={() => setDefaultStartPickerVisible(true)} style={[styles.timeField, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text numberOfLines={1} style={{ fontSize: 14, color: editState.defaultStartTime ? theme.text : theme.textMuted }}>
                      {editState.defaultStartTime || '기본 시작 시간'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setDefaultEndPickerVisible(true)} style={[styles.timeField, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text numberOfLines={1} style={{ fontSize: 14, color: editState.defaultEndTime ? theme.text : theme.textMuted }}>
                      {editState.defaultEndTime || '기본 종료 시간'}
                    </Text>
                  </Pressable>
                </View>
                {defaultStartPickerVisible && (
                  <DateTimePicker
                    value={editState.defaultStartTime ? timeStringToDate(editState.defaultStartTime) : new Date()}
                    mode="time"
                    is24Hour
                    display="default"
                    onChange={(event, selectedDate) => {
                      setDefaultStartPickerVisible(false);
                      if (event.type === 'set' && selectedDate) setEditState({ ...editState, defaultStartTime: dateToTimeString(selectedDate) });
                    }}
                  />
                )}
                {defaultEndPickerVisible && (
                  <DateTimePicker
                    value={editState.defaultEndTime ? timeStringToDate(editState.defaultEndTime) : new Date()}
                    mode="time"
                    is24Hour
                    display="default"
                    onChange={(event, selectedDate) => {
                      setDefaultEndPickerVisible(false);
                      if (event.type === 'set' && selectedDate) setEditState({ ...editState, defaultEndTime: dateToTimeString(selectedDate) });
                    }}
                  />
                )}
                <View style={styles.row2}>
                  <TextField
                    variant="box"
                    placeholder="기본 휴게시간"
                    value={editState.defaultBreakHours}
                    onChangeText={(v) => setEditState({ ...editState, defaultBreakHours: v })}
                    keyboardType="numeric"
                    suffix="시간"
                    style={{ flex: 1 }}
                  />
                </View>
                <TextField
                  variant="box"
                  placeholder="기본 주소"
                  value={editState.defaultAddress}
                  onChangeText={(v) => setEditState({ ...editState, defaultAddress: v })}
                />
              </View>

              <View style={[styles.section, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, marginTop: 10 }]}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>업무 목록</Text>
                <View style={styles.jobChipRow}>
                  {catJobs.map((j) =>
                    editingJobId === j.id ? (
                      <View key={j.id} style={[styles.jobChip, { borderColor: theme.border, backgroundColor: theme.card }]}>
                        <TextField variant="line" value={editingJobName} onChangeText={setEditingJobName} autoFocus style={styles.jobChipInput} />
                        <Pressable hitSlop={8} onPress={handleSaveJobName}>
                          <Text style={{ color: theme.brand, fontSize: 14, fontWeight: '700', marginLeft: 6 }}>✓</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View key={j.id} style={[styles.jobChip, { borderColor: theme.border, backgroundColor: theme.card }]}>
                        <Pressable onPress={() => startEditJob(j)}>
                          <Text style={{ color: theme.text, fontSize: 12.5 }}>{j.name}</Text>
                        </Pressable>
                        <Pressable hitSlop={8} onPress={() => handleDeleteJob(j.id)}>
                          <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>×</Text>
                        </Pressable>
                      </View>
                    ),
                  )}
                </View>
                <View style={styles.row2}>
                  <TextField variant="box" placeholder="새 업무 이름" value={newJobName} onChangeText={setNewJobName} style={{ flex: 1 }} />
                  <Pressable style={[styles.smallBtn, { borderColor: theme.border }]} onPress={() => handleAddJob(c.name)}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>추가</Text>
                  </Pressable>
                </View>
              </View>

              {catTitles.length > 0 && (
                <View style={[styles.section, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, marginTop: 10 }]}>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>현장명</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11.5, marginBottom: 8 }}>수정·삭제는 추천 목록에만 반영되고, 이미 저장된 근무 기록의 현장명은 바뀌지 않아요</Text>
                  {catTitles.map((t, i) => (
                    <View key={t.id}>
                      {i > 0 && <Border type="full" />}
                      {editingTitleId === t.id ? (
                        <View style={[styles.row2, { marginTop: 10, marginBottom: 10 }]}>
                          <TextField variant="box" value={editingTitleName} onChangeText={setEditingTitleName} style={{ flex: 1 }} autoFocus />
                          <Pressable style={[styles.smallBtn, { borderColor: theme.border }]} onPress={handleSaveTitle}>
                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>저장</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.titleRow}>
                          <Text style={{ color: theme.text, fontSize: 13.5, flex: 1 }} numberOfLines={1}>{t.name}</Text>
                          <Pressable hitSlop={8} onPress={() => startEditTitle(t)}>
                            <Text style={{ color: theme.brand, fontSize: 12.5, fontWeight: '700' }}>수정</Text>
                          </Pressable>
                          <Pressable hitSlop={8} onPress={() => handleDeleteTitle(t.id)}>
                            <Text style={{ color: theme.danger, fontSize: 16, fontWeight: '700' }}>×</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 10 }}>{error}</Text> : null}
              <View style={{ marginTop: 10 }}>
                <Button display="full" size="small" type="primary" loading={saving} onPress={() => handleSaveEdit(c.id)}>
                  저장
                </Button>
              </View>
            </View>
          )}
        </View>
      </ScaleDecorator>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <DraggableFlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        onDragEnd={({ data }) => handleReorder(data)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 10 }}>분류를 길게 눌러 ≡ 손잡이를 드래그하면 순서를 바꿀 수 있어요</Text>
        }
        ListFooterComponent={
          <View style={{ marginTop: 10 }}>
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
        }
      />

      <ConfirmDialog
        visible={deletingCategoryId != null}
        title="이 분류를 삭제할까요?"
        confirmText="삭제하기"
        danger
        loading={deletingCategory}
        onConfirm={() => deletingCategoryId != null && handleDeleteCategory(deletingCategoryId)}
        onClose={() => setDeletingCategoryId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  moveRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  editArea: { paddingHorizontal: 14, paddingBottom: 14 },
  section: { borderRadius: 12, padding: 12 },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', marginBottom: 10, letterSpacing: 0.2 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center' },
  timeField: { flex: 1, height: 38, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  jobChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10 },
  jobChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  jobChipInput: { width: 90 },
  addBtn: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  smallBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
});
