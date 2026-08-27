import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import SheetModal from '../../../components/sheets/SheetModal';
import Button from '../../../components/ui/Button';
import TextField from '../../../components/ui/TextField';
import Segmented from '../../../components/common/Segmented';
import Switch from '../../../components/ui/Switch';
import FormRow from '../../../components/common/FormRow';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import DatePicker from '../../../components/common/DatePicker';
import { labWorklogApi, type WorklogRecord, type WorklogCategoryOption, type WorklogPhoto, type PayStatus } from '../../../api/lab-worklog';
import { useTheme } from '../../../lib/theme';
import { todayLocal } from '../../../lib/date';
import { getErrorMessage } from '../../../lib/error';

interface WorklogEntryFormProps {
  visible: boolean;
  record: WorklogRecord | null;
  categories: WorklogCategoryOption[];
  defaultDate: string;
  onClose: () => void;
  onSaved: (mode: 'create' | 'edit' | 'delete') => void;
}

const PAY_STATUS_OPTIONS: { value: PayStatus; label: string }[] = [
  { value: 'RECEIVED', label: '수령완료' },
  { value: 'EXPECTED', label: '수령예정' },
  { value: 'UNPAID', label: '미수령' },
  { value: 'DAYOFF', label: '휴무' },
];

export default function WorklogEntryForm({ visible, record, categories, defaultDate, onClose, onSaved }: WorklogEntryFormProps) {
  const theme = useTheme();
  const isEdit = !!record;

  const [title, setTitle] = useState('');
  const [workDate, setWorkDate] = useState(todayLocal());
  const [category, setCategory] = useState('');
  const [payStatus, setPayStatus] = useState<PayStatus>('EXPECTED');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakHours, setBreakHours] = useState('1');
  const [dailyWage, setDailyWage] = useState('');
  const [amountOverride, setAmountOverride] = useState('');
  const [withholdingApplied, setWithholdingApplied] = useState(false);
  const [address, setAddress] = useState('');
  const [jobs, setJobs] = useState<string[]>([]);
  const [photos, setPhotos] = useState<WorklogPhoto[]>([]);
  const [memo, setMemo] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');

  const jobOptionsQ = useQuery({ queryKey: ['lab-worklog-jobs'], queryFn: labWorklogApi.jobOptions, enabled: visible, staleTime: 60_000 });
  const jobChoices = (jobOptionsQ.data ?? []).filter((j) => j.category === category);

  useEffect(() => {
    if (!visible) return;
    if (record) {
      setTitle(record.title);
      setWorkDate(record.workDate);
      setCategory(record.category);
      setPayStatus(record.payStatus);
      setStartTime(record.startTime ?? '');
      setEndTime(record.endTime ?? '');
      setBreakHours(String(record.breakHours ?? 1));
      setDailyWage(record.dailyWage ? String(record.dailyWage) : '');
      setAmountOverride(record.amountOverride != null ? String(record.amountOverride) : '');
      setWithholdingApplied(record.withholdingApplied);
      setAddress(record.address ?? '');
      setJobs(record.jobs ?? []);
      setPhotos(record.photos ?? []);
      setMemo(record.memo ?? '');
    } else {
      setTitle('');
      setWorkDate(defaultDate > todayLocal() ? defaultDate : todayLocal());
      setCategory(categories[0]?.name ?? '');
      setPayStatus('EXPECTED');
      setStartTime('');
      setEndTime('');
      setBreakHours('1');
      setDailyWage('');
      setAmountOverride('');
      setWithholdingApplied(categories[0]?.defaultWithholdingApplied ?? false);
      setAddress('');
      setJobs([]);
      setPhotos([]);
      setMemo('');
    }
    setError('');
  }, [visible, record]);

  function toggleJob(name: string) {
    setJobs((prev) => (prev.includes(name) ? prev.filter((j) => j !== name) : [...prev, name]));
  }

  async function handlePickPhotos() {
    const remaining = 5 - photos.length;
    if (remaining <= 0) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('사진 접근 권한이 필요해요');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });
      if (result.canceled || result.assets.length === 0) return;
      setUploadingPhoto(true);
      const files = result.assets.map((a, i) => {
        const ext = (a.mimeType?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        return { uri: a.uri, name: `photo_${Date.now()}_${i}.${ext}`, type: a.mimeType || 'image/jpeg' };
      });
      const uploaded = await labWorklogApi.uploadPhotos(files);
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(getErrorMessage(e, '사진 업로드에 실패했어요'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  function removePhoto(filename: string) {
    setPhotos((prev) => prev.filter((p) => p.filename !== filename));
  }

  const isValid = title.trim().length > 0 && !!workDate;

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const dto = {
        title: title.trim(),
        workDate,
        category: category || undefined,
        payStatus,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        breakHours: breakHours ? Number(breakHours) : undefined,
        jobs,
        dailyWage: dailyWage ? Number(dailyWage) : undefined,
        amountOverride: amountOverride ? Number(amountOverride) : null,
        withholdingApplied,
        address: address || undefined,
        photos,
        memo: memo || undefined,
      };
      if (isEdit && record) {
        await labWorklogApi.update(record.id, dto);
        onSaved('edit');
      } else {
        await labWorklogApi.create(dto);
        onSaved('create');
      }
    } catch (e) {
      setError(getErrorMessage(e, '저장에 실패했어요. 다시 시도해 주세요.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!record) return;
    setDeleting(true);
    try {
      await labWorklogApi.delete(record.id);
      setDeleteConfirm(false);
      onSaved('delete');
    } catch (e) {
      setError(getErrorMessage(e, '삭제에 실패했어요.'));
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header={isEdit ? '근무 기록 수정' : '근무 기록 추가'}
      cta={
        <>
          {error ? <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={saving} onPress={handleSave}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </>
      }
      overlay={<DatePicker visible={datePickerVisible} value={workDate} onSelect={setWorkDate} onClose={() => setDatePickerVisible(false)} />}
    >
      <TextField variant="line" placeholder="현장명 (예: 송도 / 학익)" value={title} onChangeText={setTitle} style={{ marginBottom: 12 }} />

      <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
        <FormRow label="근무일" value={workDate === todayLocal() ? `오늘 (${workDate.slice(5).replace('-', '/')})` : workDate} onPress={() => setDatePickerVisible(true)} />
      </View>

      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={styles.chipRow}>
            {categories.map((c) => {
              const active = c.name === category;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.name)}
                  style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.card }]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: active ? theme.brand : theme.text }}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View style={styles.segWrap}>
        <Segmented options={PAY_STATUS_OPTIONS.map((o) => o.label)} value={PAY_STATUS_OPTIONS.find((o) => o.value === payStatus)?.label ?? '수령예정'} onChange={(label) => setPayStatus(PAY_STATUS_OPTIONS.find((o) => o.label === label)!.value)} />
      </View>

      <View style={styles.row2}>
        <TextField variant="box" placeholder="시작 (08:00)" value={startTime} onChangeText={setStartTime} style={{ flex: 1 }} />
        <TextField variant="box" placeholder="종료 (22:00)" value={endTime} onChangeText={setEndTime} style={{ flex: 1 }} />
      </View>
      <View style={styles.row2}>
        <TextField variant="box" placeholder="휴게시간" value={breakHours} onChangeText={setBreakHours} keyboardType="numeric" suffix="시간" style={{ flex: 1 }} />
        <TextField variant="box" placeholder="일급여 (미지정 시 자동)" value={dailyWage} onChangeText={setDailyWage} keyboardType="numeric" suffix="원" style={{ flex: 1 }} />
      </View>

      <TextField variant="box" placeholder="실수령 직접입력 (선택)" value={amountOverride} onChangeText={setAmountOverride} keyboardType="numeric" suffix="원" style={{ marginBottom: 12 }} />

      <View style={styles.switchRow}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>원천징수(3.3%) 적용</Text>
        <Switch checked={withholdingApplied} onCheckedChange={setWithholdingApplied} />
      </View>

      {jobChoices.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>업무 (다중 선택)</Text>
          <View style={styles.chipRow}>
            {jobChoices.map((j) => {
              const active = jobs.includes(j.name);
              return (
                <Pressable
                  key={j.id}
                  onPress={() => toggleJob(j.name)}
                  style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.card }]}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? theme.brand : theme.text }}>{j.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <TextField variant="box" placeholder="주소 (선택)" value={address} onChangeText={setAddress} style={{ marginBottom: 12 }} />

      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>사진 ({photos.length}/5)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photoRow}>
            {photos.map((p) => (
              <View key={p.filename} style={styles.photoThumbWrap}>
                <Image source={{ uri: p.url }} style={styles.photoThumb} />
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(p.filename)} hitSlop={6}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>×</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < 5 && (
              <Pressable style={[styles.photoAdd, { borderColor: theme.border }]} onPress={handlePickPhotos} disabled={uploadingPhoto}>
                <Text style={{ color: theme.textMuted, fontSize: 20 }}>{uploadingPhoto ? '···' : '+'}</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>

      <TextInput
        style={[styles.memoInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
        placeholder="메모 (선택)"
        placeholderTextColor={theme.textMuted}
        multiline
        numberOfLines={3}
        value={memo}
        onChangeText={setMemo}
      />

      {isEdit && (
        <Pressable style={styles.deleteRow} onPress={() => setDeleteConfirm(true)}>
          <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>이 기록 삭제하기</Text>
        </Pressable>
      )}

      <ConfirmDialog
        visible={deleteConfirm}
        title="근무 기록을 삭제할까요?"
        confirmText="삭제하기"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(false)}
      />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  fieldsCard: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  segWrap: { marginBottom: 12 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  memoInput: { minHeight: 72, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingTop: 10, fontSize: 14, textAlignVertical: 'top', marginBottom: 8 },
  deleteRow: { alignItems: 'center', paddingVertical: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 64, height: 64, borderRadius: 10 },
  photoRemove: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoAdd: { width: 64, height: 64, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
