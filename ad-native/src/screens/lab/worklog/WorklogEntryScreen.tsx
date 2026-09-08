import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../../components/ui/Button';
import TextField from '../../../components/ui/TextField';
import Segmented from '../../../components/common/Segmented';
import Switch from '../../../components/ui/Switch';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import DatePicker from '../../../components/common/DatePicker';
import { labWorklogApi, type WorklogPhoto, type PayStatus } from '../../../api/lab-worklog';
import { useTheme } from '../../../lib/theme';
import { useKeyboardScrollRegistration, KeyboardScrollProvider } from '../../../lib/keyboard-scroll';
import { todayLocal, timeStringToDate, dateToTimeString } from '../../../lib/date';
import { getErrorMessage } from '../../../lib/error';
import type { WorklogStackParamList } from '../../../navigation/WorklogStack';

type Props = NativeStackScreenProps<WorklogStackParamList, 'WorklogEntry'>;

const PAY_STATUS_OPTIONS: { value: PayStatus; label: string }[] = [
  { value: 'SCHEDULED', label: '근무예정' },
  { value: 'RECEIVED', label: '수령완료' },
  { value: 'EXPECTED', label: '수령예정' },
  { value: 'UNPAID', label: '미수령' },
  { value: 'DAYOFF', label: '휴무' },
];

const ICON = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function IconInfo({ color }: { color: string }) {
  const p = { ...ICON, stroke: color };
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Rect x={4} y={5} width={16} height={16} rx={2.5} {...p} />
      <Path d="M8 3v4M16 3v4M4 10h16" {...p} />
    </Svg>
  );
}
function IconClock({ color }: { color: string }) {
  const p = { ...ICON, stroke: color };
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} {...p} />
      <Path d="M12 7v5l3.5 2" {...p} />
    </Svg>
  );
}
function IconWallet({ color }: { color: string }) {
  const p = { ...ICON, stroke: color };
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" {...p} />
      <Path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-4" {...p} />
      <Path d="M16 13h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4Z" {...p} />
    </Svg>
  );
}
function IconNotes({ color }: { color: string }) {
  const p = { ...ICON, stroke: color };
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" {...p} />
      <Path d="M9 12h6M9 16h6" {...p} />
    </Svg>
  );
}

function Section({ icon, title, theme, children }: { icon: React.ReactNode; title: string; theme: ReturnType<typeof useTheme>; children: React.ReactNode }) {
  return (
    <View style={[styles.section, { backgroundColor: theme.card }]}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIconWrap, { backgroundColor: theme.brandSoft }]}>{icon}</View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function WorklogEntryScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { record, defaultDate } = route.params;
  const isEdit = !!record;
  const { scrollRef, scrollToInput, keyboardHeight } = useKeyboardScrollRegistration();

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
  const memoRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? '근무 기록 수정' : '근무 기록 추가' });
  }, [navigation, isEdit]);

  const categoriesQ = useQuery({ queryKey: ['lab-worklog-categories'], queryFn: labWorklogApi.categoryOptions, staleTime: 300_000 });
  const categories = categoriesQ.data ?? [];

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

  const jobOptionsQ = useQuery({ queryKey: ['lab-worklog-jobs'], queryFn: labWorklogApi.jobOptions, staleTime: 60_000 });
  const jobChoices = (jobOptionsQ.data ?? []).filter((j) => j.category === category);
  const titleOptionsQ = useQuery({ queryKey: ['lab-worklog-title-options'], queryFn: labWorklogApi.titleOptions, staleTime: 60_000 });
  const titleSuggestions = (titleOptionsQ.data ?? []).filter((t) => t.category === category).slice(0, 12);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

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
        navigation.navigate('WorklogHome', { savedMode: 'edit', savedAt: Date.now() });
      } else {
        await labWorklogApi.create(dto);
        navigation.navigate('WorklogHome', { savedMode: 'create', savedAt: Date.now() });
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
      navigation.navigate('WorklogHome', { savedMode: 'delete', savedAt: Date.now() });
    } catch (e) {
      setError(getErrorMessage(e, '삭제에 실패했어요.'));
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + keyboardHeight }]}>
          <KeyboardScrollProvider value={scrollToInput}>
            <Section icon={<IconInfo color={theme.brand} />} title="기본 정보" theme={theme}>
              <TextField variant="line" placeholder="현장명 (예: 송도 / 학익)" value={title} onChangeText={setTitle} style={{ marginBottom: 10 }} />
              {titleSuggestions.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={{ marginBottom: 12 }}>
                  <View style={styles.chipRow}>
                    {titleSuggestions.map((s) => (
                      <Pressable key={s.id} onPress={() => setTitle(s.name)} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{s.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}

              {categories.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={{ marginBottom: 12 }}>
                  <View style={styles.chipRow}>
                    {categories.map((c) => {
                      const active = c.name === category;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => handleSelectCategory(c.name)}
                          style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.bg }]}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: active ? theme.brand : theme.text }}>{c.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              <Pressable onPress={() => setDatePickerVisible(true)} style={[styles.box, { backgroundColor: theme.bg, marginBottom: 12 }]}>
                <Text style={{ fontSize: 15, color: theme.text, fontWeight: '600' }}>{workDate === todayLocal() ? `오늘 (${workDate.slice(5).replace('-', '/')})` : workDate}</Text>
              </Pressable>

              <Segmented
                options={PAY_STATUS_OPTIONS.map((o) => o.label)}
                value={PAY_STATUS_OPTIONS.find((o) => o.value === payStatus)?.label ?? '수령예정'}
                onChange={(label) => setPayStatus(PAY_STATUS_OPTIONS.find((o) => o.label === label)!.value)}
              />
            </Section>

            <Section icon={<IconClock color={theme.brand} />} title="근무 시간" theme={theme}>
              <View style={styles.row2}>
                <Pressable onPress={() => setStartPickerVisible(true)} style={[styles.box, { backgroundColor: theme.bg, flex: 1 }]}>
                  <Text numberOfLines={1} style={{ fontSize: 15, color: startTime ? theme.text : theme.textMuted, fontWeight: '600' }}>{startTime || '시작 시간'}</Text>
                </Pressable>
                <Pressable onPress={() => setEndPickerVisible(true)} style={[styles.box, { backgroundColor: theme.bg, flex: 1 }]}>
                  <Text numberOfLines={1} style={{ fontSize: 15, color: endTime ? theme.text : theme.textMuted, fontWeight: '600' }}>{endTime || '종료 시간'}</Text>
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
              <TextField variant="box" placeholder="휴게시간 (미지정 시 자동)" value={breakHours} onChangeText={setBreakHours} keyboardType="numeric" suffix="시간" />
            </Section>

            <Section icon={<IconWallet color={theme.brand} />} title="급여" theme={theme}>
              <View style={styles.row2}>
                <TextField variant="box" placeholder="일급여 (미지정 시 자동)" value={dailyWage} onChangeText={setDailyWage} keyboardType="numeric" suffix="원" style={{ flex: 1 }} />
                <TextField variant="box" placeholder="실수령 직접입력 (선택)" value={amountOverride} onChangeText={setAmountOverride} keyboardType="numeric" suffix="원" style={{ flex: 1 }} />
              </View>

              <View style={styles.switchRow}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>원천징수(3.3%) 적용</Text>
                <Switch checked={withholdingApplied} onCheckedChange={setWithholdingApplied} />
              </View>

              <View style={[styles.switchRow, { marginBottom: 0 }]}>
                <View>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>반액 지급</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>사정으로 일당의 절반만 받는 경우</Text>
                </View>
                <Switch checked={halfPay} onCheckedChange={setHalfPay} />
              </View>
            </Section>

            <Section icon={<IconNotes color={theme.brand} />} title="추가 정보" theme={theme}>
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
                          style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.bg }]}
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
                ref={memoRef}
                style={[styles.memoInput, { color: theme.text, backgroundColor: theme.bg }]}
                placeholder="메모 (선택)"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                value={memo}
                onChangeText={setMemo}
                onFocus={() => scrollToInput(memoRef.current)}
              />
            </Section>

            {isEdit && (
              <Pressable style={styles.deleteRow} onPress={() => setDeleteConfirm(true)}>
                <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>이 기록 삭제하기</Text>
              </Pressable>
            )}
          </KeyboardScrollProvider>
        </ScrollView>

        <View style={[styles.ctaWrap, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {error ? <Text style={{ color: theme.danger, fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={saving} onPress={handleSave}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <DatePicker visible={datePickerVisible} value={workDate} onSelect={setWorkDate} onClose={() => setDatePickerVisible(false)} />

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
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 32 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1 },
  section: { borderRadius: 18, padding: 16, marginBottom: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 13.5, fontWeight: '800' },
  box: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  memoInput: { minHeight: 72, borderRadius: 10, paddingHorizontal: 14, paddingTop: 10, fontSize: 14, textAlignVertical: 'top' },
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
