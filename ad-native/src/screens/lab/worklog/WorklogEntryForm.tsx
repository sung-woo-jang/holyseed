import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { todayLocal, timeStringToDate, dateToTimeString } from '../../../lib/date';
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
  { value: 'SCHEDULED', label: '근무예정' },
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
  const [breakHours, setBreakHours] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [amountOverride, setAmountOverride] = useState('');
  const [withholdingApplied, setWithholdingApplied] = useState(false);
  const [halfPay, setHalfPay] = useState(false);
  const [address, setAddress] = useState('');
  const [jobs, setJobs] = useState<string[]>([]);
  const [photos, setPhotos] = useState<WorklogPhoto[]>([]);
  const [memo, setMemo] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<WorklogPhoto | null>(null);
  const [error, setError] = useState('');

  function applyCategoryDefaults(categoryName: string) {
    const opt = categories.find((c) => c.name === categoryName);
    setStartTime(opt?.defaultStartTime ?? '');
    setEndTime(opt?.defaultEndTime ?? '');
    setBreakHours(opt?.defaultBreakHours != null ? String(opt.defaultBreakHours) : '');
    setDailyWage(opt?.defaultDailyWage != null ? String(opt.defaultDailyWage) : '');
    setWithholdingApplied(opt?.defaultWithholdingApplied ?? false);
    setAddress(opt?.defaultAddress ?? '');
  }

  function handleSelectCategory(categoryName: string) {
    setCategory(categoryName);
    if (!isEdit) applyCategoryDefaults(categoryName);
  }

  const jobOptionsQ = useQuery({ queryKey: ['lab-worklog-jobs'], queryFn: labWorklogApi.jobOptions, enabled: visible, staleTime: 60_000 });
  const jobChoices = (jobOptionsQ.data ?? []).filter((j) => j.category === category);
  const titlesQ = useQuery({ queryKey: ['lab-worklog-titles'], queryFn: labWorklogApi.titles, enabled: visible, staleTime: 60_000 });
  const titleSuggestions = titlesQ.data ?? [];

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
      setHalfPay(record.halfPay);
      setAddress(record.address ?? '');
      setJobs(record.jobs ?? []);
      setPhotos(record.photos ?? []);
      setMemo(record.memo ?? '');
    } else {
      const initialCategory = categories[0];
      setTitle('');
      setWorkDate(defaultDate > todayLocal() ? defaultDate : todayLocal());
      setCategory(initialCategory?.name ?? '');
      setPayStatus('EXPECTED');
      setStartTime(initialCategory?.defaultStartTime ?? '');
      setEndTime(initialCategory?.defaultEndTime ?? '');
      setBreakHours(initialCategory?.defaultBreakHours != null ? String(initialCategory.defaultBreakHours) : '');
      setDailyWage(initialCategory?.defaultDailyWage != null ? String(initialCategory.defaultDailyWage) : '');
      setAmountOverride('');
      setWithholdingApplied(initialCategory?.defaultWithholdingApplied ?? false);
      setHalfPay(false);
      setAddress(initialCategory?.defaultAddress ?? '');
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
        halfPay,
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
      <TextField variant="line" placeholder="현장명 (예: 송도 / 학익)" value={title} onChangeText={setTitle} style={{ marginBottom: 10 }} />
      {titleSuggestions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={{ marginBottom: 12 }}>
          <View style={styles.chipRow}>
            {titleSuggestions.map((s) => (
              <Pressable key={s.name} onPress={() => setTitle(s.name)} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
        <FormRow label="근무일" value={workDate === todayLocal() ? `오늘 (${workDate.slice(5).replace('-', '/')})` : workDate} onPress={() => setDatePickerVisible(true)} />
      </View>

      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={{ marginBottom: 12 }}>
          <View style={styles.chipRow}>
            {categories.map((c) => {
              const active = c.name === category;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => handleSelectCategory(c.name)}
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
        <Pressable onPress={() => setStartPickerVisible(true)} style={[styles.timeField, { backgroundColor: theme.bg }]}>
          <Text numberOfLines={1} style={{ fontSize: 15, color: startTime ? theme.text : theme.textMuted }}>{startTime || '시작 시간'}</Text>
        </Pressable>
        <Pressable onPress={() => setEndPickerVisible(true)} style={[styles.timeField, { backgroundColor: theme.bg }]}>
          <Text numberOfLines={1} style={{ fontSize: 15, color: endTime ? theme.text : theme.textMuted }}>{endTime || '종료 시간'}</Text>
        </Pressable>
      </View>
      {startPickerVisible && (
        <DateTimePicker
          value={startTime ? timeStringToDate(startTime) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selectedDate) => {
            setStartPickerVisible(false);
            if (event.type === 'set' && selectedDate) setStartTime(dateToTimeString(selectedDate));
          }}
        />
      )}
      {endPickerVisible && (
        <DateTimePicker
          value={endTime ? timeStringToDate(endTime) : new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, selectedDate) => {
            setEndPickerVisible(false);
            if (event.type === 'set' && selectedDate) setEndTime(dateToTimeString(selectedDate));
          }}
        />
      )}
      <View style={styles.row2}>
        <TextField variant="box" placeholder="휴게시간 (미지정 시 자동)" value={breakHours} onChangeText={setBreakHours} keyboardType="numeric" suffix="시간" style={{ flex: 1 }} />
        <TextField variant="box" placeholder="일급여 (미지정 시 자동)" value={dailyWage} onChangeText={setDailyWage} keyboardType="numeric" suffix="원" style={{ flex: 1 }} />
      </View>

      <TextField variant="box" placeholder="실수령 직접입력 (선택)" value={amountOverride} onChangeText={setAmountOverride} keyboardType="numeric" suffix="원" style={{ marginBottom: 12 }} />

      <View style={styles.switchRow}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>원천징수(3.3%) 적용</Text>
        <Switch checked={withholdingApplied} onCheckedChange={setWithholdingApplied} />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>반액 지급</Text>
          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>사정으로 일당의 절반만 받는 경우</Text>
        </View>
        <Switch checked={halfPay} onCheckedChange={setHalfPay} />
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

      <TextField variant="box" placeholder="주소 (미지정 시 자동)" value={address} onChangeText={setAddress} style={{ marginBottom: 12 }} />

      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>사진 ({photos.length}/5)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
          <View style={styles.photoRow}>
            {photos.map((p) => (
              <View key={p.filename} style={styles.photoThumbWrap}>
                <Pressable onPress={() => setPreviewPhoto(p)}>
                  <Image source={{ uri: p.url }} style={styles.photoThumb} />
                </Pressable>
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(p.filename)} hitSlop={6}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>×</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < 5 && (
              <Pressable style={[styles.photoAdd, { borderColor: theme.border }]} onPress={handlePickPhotos} disabled={uploadingPhoto}>
                {uploadingPhoto ? <ActivityIndicator size="small" color={theme.brand} /> : <Text style={{ color: theme.textMuted, fontSize: 20 }}>+</Text>}
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

      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <Pressable style={styles.photoPreviewBackdrop} onPress={() => setPreviewPhoto(null)}>
          <Image source={{ uri: previewPhoto?.url }} style={styles.photoPreviewImage} resizeMode="contain" />
          <Pressable style={styles.photoPreviewClose} onPress={() => setPreviewPhoto(null)} hitSlop={12}>
            <Text style={{ color: '#fff', fontSize: 22 }}>×</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  fieldsCard: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  segWrap: { marginBottom: 12 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  timeField: { flex: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  memoInput: { minHeight: 72, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingTop: 10, fontSize: 14, textAlignVertical: 'top', marginBottom: 8 },
  deleteRow: { alignItems: 'center', paddingVertical: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 64, height: 64, borderRadius: 10 },
  photoRemove: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoAdd: { width: 64, height: 64, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoPreviewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  photoPreviewImage: { width: '100%', height: '80%' },
  photoPreviewClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
