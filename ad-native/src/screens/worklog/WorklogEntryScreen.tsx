import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import Switch from '../../components/ui/Switch';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppToast from '../../components/common/AppToast';
import DatePicker from '../../components/common/DatePicker';
import { worklogApi, type WorklogPhoto, type WorklogRecord, type PayStatus } from '../../api/worklog';
import { krw } from '../../lib/format';
import { useTheme } from '../../lib/theme';
import { useKeyboardScrollRegistration, KeyboardScrollProvider } from '../../lib/keyboard-scroll';
import { todayLocal, timeStringToDate, dateToTimeString, shiftDay } from '../../lib/date';
import { invalidateWorklog } from '../../queries/worklog-cache';
import { getErrorMessage } from '../../lib/error';
import type { WorklogStackParamList } from '../../navigation/WorklogStack';
import { popToScreen } from '../../lib/nav-return';

type Props = NativeStackScreenProps<WorklogStackParamList, 'WorklogEntry'>;

const PAY_MULTIPLIER_OPTIONS = [0.5, 1, 1.5, 2];

const PAY_STATUS_OPTIONS: { value: PayStatus; label: string }[] = [
  { value: 'SCHEDULED', label: '근무예정' },
  { value: 'RECEIVED', label: '수령완료' },
  { value: 'EXPECTED', label: '수령예정' },
  { value: 'UNPAID', label: '미수령' },
  { value: 'DAYOFF', label: '휴무' },
];

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const wd = WEEKDAY_KO[new Date(y!, m! - 1, d!).getDay()];
  const rel = date === todayLocal() ? ' · 오늘' : date === shiftDay(todayLocal(), -1) ? ' · 어제' : '';
  return `${y}년 ${m}월 ${d}일 (${wd})${rel}`;
}

function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits ? Number(digits).toLocaleString() : '';
}

function parseMoney(raw: string): number {
  return Number(raw.replace(/[^0-9]/g, ''));
}

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
  const qc = useQueryClient();
  const { scrollRef, scrollToInput, keyboardHeight } = useKeyboardScrollRegistration();

  const [title, setTitle] = useState('');
  const [workDate, setWorkDate] = useState(record?.workDate ?? defaultDate ?? todayLocal());
  const [category, setCategory] = useState('');
  const [payStatus, setPayStatus] = useState<PayStatus>('EXPECTED');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakHours, setBreakHours] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [amountOverride, setAmountOverride] = useState('');
  const [withholdingApplied, setWithholdingApplied] = useState(false);
  const [payMultiplier, setPayMultiplier] = useState(1);
  const [address, setAddress] = useState('');
  const [jobs, setJobs] = useState<string[]>([]);
  const [photos, setPhotos] = useState<WorklogPhoto[]>([]);
  const [memo, setMemo] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingNext, setSavingNext] = useState(false);
  const [toast, setToast] = useState('');
  const autoFilledRef = useRef<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<WorklogPhoto | null>(null);
  const [error, setError] = useState('');
  const memoRef = useRef<TextInput>(null);
  const baselineRef = useRef('');
  const leavingRef = useRef(false);
  const pendingLeaveRef = useRef<(() => void) | null>(null);
  const [initTick, setInitTick] = useState(0);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? '근무 기록 수정' : '근무 기록 추가' });
  }, [navigation, isEdit]);

  const categoriesQ = useQuery({ queryKey: ['worklog-categories'], queryFn: worklogApi.categoryOptions, staleTime: 300_000 });
  const categories = categoriesQ.data ?? [];
  const isDayOff = categories.find((c) => c.name === category)?.isDayOff ?? false;

  // 직접 입력한 값은 지키고, 비어 있거나 이전 분류의 기본값 그대로인 칸만 새 분류 기본값으로 바꾼다
  function applyCategoryDefaults(nextName: string, prevName: string) {
    const next = categories.find((c) => c.name === nextName);
    const prev = categories.find((c) => c.name === prevName);
    const swap = (cur: string, prevDef: string, nextDef: string) => (cur === '' || cur === prevDef ? nextDef : cur);
    setStartTime((cur) => swap(cur, prev?.defaultStartTime ?? '', next?.defaultStartTime ?? ''));
    setEndTime((cur) => swap(cur, prev?.defaultEndTime ?? '', next?.defaultEndTime ?? ''));
    setBreakHours((cur) => swap(cur, prev?.defaultBreakHours != null ? String(prev.defaultBreakHours) : '', next?.defaultBreakHours != null ? String(next.defaultBreakHours) : ''));
    setDailyWage((cur) =>
      swap(cur, prev?.defaultDailyWage != null ? formatMoneyInput(String(prev.defaultDailyWage)) : '', next?.defaultDailyWage != null ? formatMoneyInput(String(next.defaultDailyWage)) : ''),
    );
    setAddress((cur) => swap(cur, prev?.defaultAddress ?? '', next?.defaultAddress ?? ''));
    if (!isEdit) setWithholdingApplied(next?.defaultWithholdingApplied ?? false);
  }

  function handleSelectCategory(categoryName: string) {
    if (categoryName === category) return;
    applyCategoryDefaults(categoryName, category);
    setCategory(categoryName);
    const dayOff = categories.find((c) => c.name === categoryName)?.isDayOff ?? false;
    // 이미 입력한 수령 상태(수령완료 등)는 휴무 여부가 바뀔 때만 초기화
    setPayStatus((cur) => (dayOff ? 'DAYOFF' : cur === 'DAYOFF' ? 'EXPECTED' : cur));
  }

  const jobOptionsQ = useQuery({ queryKey: ['worklog-jobs'], queryFn: worklogApi.jobOptions, staleTime: 60_000 });
  const jobChoices = (jobOptionsQ.data ?? []).filter((j) => j.category === category);
  const titleOptionsQ = useQuery({ queryKey: ['worklog-title-options'], queryFn: worklogApi.titleOptions, staleTime: 60_000 });
  const titleSuggestions = (titleOptionsQ.data ?? []).filter((t) => t.category === category).slice(0, 12);

  const [pickerYm, setPickerYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const dateYm = { year: Number(workDate.slice(0, 4)), month: Number(workDate.slice(5, 7)) };
  const dateRecordsQ = useQuery({
    queryKey: ['worklog', dateYm.year, dateYm.month],
    queryFn: () => worklogApi.search(dateYm.year, dateYm.month),
    staleTime: 60_000,
    enabled: !!workDate,
  });
  const sameDayRecords = (dateRecordsQ.data?.records ?? []).filter((r) => r.workDate === workDate && r.id !== record?.id);
  const pickerRecordsQ = useQuery({
    queryKey: ['worklog', pickerYm.year, pickerYm.month],
    queryFn: () => worklogApi.search(pickerYm.year, pickerYm.month),
    staleTime: 60_000,
  });
  const markedDates = useMemo(() => {
    const byDate = new Map<string, PayStatus[]>();
    (pickerRecordsQ.data?.records ?? []).forEach((r) => {
      const list = byDate.get(r.workDate) ?? [];
      list.push(r.payStatus);
      byDate.set(r.workDate, list);
    });
    const map: Record<string, 'work' | 'dayoff'> = {};
    byDate.forEach((statuses, date) => {
      map[date] = statuses.every((s) => s === 'DAYOFF') ? 'dayoff' : 'work';
    });
    return map;
  }, [pickerRecordsQ.data]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (record) {
      setTitle(record.title);
      setWorkDate(record.workDate);
      setCategory(record.category);
      setPayStatus(record.payStatus);
      setStartTime(record.startTime ?? '');
      setEndTime(record.endTime ?? '');
      setBreakHours(String(record.breakHours ?? 1));
      setDailyWage(record.dailyWage ? formatMoneyInput(String(record.dailyWage)) : '');
      setAmountOverride(record.amountOverride != null ? formatMoneyInput(String(record.amountOverride)) : '');
      setWithholdingApplied(record.withholdingApplied);
      setPayMultiplier(record.payMultiplier);
      setAddress(record.address ?? '');
      setJobs(record.jobs ?? []);
      setPhotos(record.photos ?? []);
      setMemo(record.memo ?? '');
      initializedRef.current = true;
      setInitTick((t) => t + 1);
    }
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  // 새 기록은 분류 목록이 로드된 뒤 첫 분류의 기본값으로 한 번만 채운다 (로드 전에 열면 기본값이 비어 있던 문제)
  useEffect(() => {
    if (record || initializedRef.current || !categoriesQ.isSuccess) return;
    const first = categories[0];
    initializedRef.current = true;
    setWorkDate(defaultDate);
    setCategory(first?.name ?? '');
    setPayStatus(first?.isDayOff ? 'DAYOFF' : 'EXPECTED');
    setStartTime(first?.defaultStartTime ?? '');
    setEndTime(first?.defaultEndTime ?? '');
    setBreakHours(first?.defaultBreakHours != null ? String(first.defaultBreakHours) : '');
    setDailyWage(first?.defaultDailyWage != null ? formatMoneyInput(String(first.defaultDailyWage)) : '');
    setWithholdingApplied(first?.defaultWithholdingApplied ?? false);
    setAddress(first?.defaultAddress ?? '');
    setInitTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesQ.isSuccess]);

  const formSnapshot = JSON.stringify({
    title, workDate, category, payStatus, startTime, endTime, breakHours, dailyWage, amountOverride,
    withholdingApplied, payMultiplier, address, jobs, photos: photos.map((p) => p.filename), memo,
  });
  useEffect(() => {
    baselineRef.current = formSnapshot;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initTick]);
  const dirty = initializedRef.current && baselineRef.current !== '' && formSnapshot !== baselineRef.current;

  // 입력 중 뒤로가기(제스처 포함)로 내용이 날아가지 않도록 확인
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (leavingRef.current || !dirty) return;
      e.preventDefault();
      pendingLeaveRef.current = () => {
        leavingRef.current = true;
        navigation.dispatch(e.data.action);
      };
      setLeaveConfirm(true);
    });
  }, [navigation, dirty]);

  // 현장명 칩을 고르면 그 현장의 가장 최근 기록(최근 6개월)에서 시간·일급여·주소·업무를 채운다 — 직접 입력한 값은 건드리지 않음
  async function handlePickTitle(name: string) {
    setTitle(name);
    if (isEdit) return;
    try {
      const res = await worklogApi.query({ from: shiftDay(todayLocal(), -180), to: todayLocal(), category, titleContains: name });
      const last = res.records
        .filter((r: WorklogRecord) => r.title === name && r.payStatus !== 'DAYOFF')
        .sort((a: WorklogRecord, b: WorklogRecord) => b.workDate.localeCompare(a.workDate))[0];
      if (!last) return;
      const opt = categories.find((c) => c.name === category);
      const auto = autoFilledRef.current;
      const fill = (field: string, cur: string, def: string, next: string) => {
        if (!next) return cur;
        const replaceable = cur === '' || cur === def || cur === auto[field];
        if (!replaceable) return cur;
        auto[field] = next;
        return next;
      };
      setStartTime((cur) => fill('start', cur, opt?.defaultStartTime ?? '', last.startTime ?? ''));
      setEndTime((cur) => fill('end', cur, opt?.defaultEndTime ?? '', last.endTime ?? ''));
      setBreakHours((cur) => fill('break', cur, opt?.defaultBreakHours != null ? String(opt.defaultBreakHours) : '', String(last.breakHours ?? '')));
      setDailyWage((cur) =>
        fill('wage', cur, opt?.defaultDailyWage != null ? formatMoneyInput(String(opt.defaultDailyWage)) : '', last.dailyWage ? formatMoneyInput(String(last.dailyWage)) : ''),
      );
      setAddress((cur) => fill('address', cur, opt?.defaultAddress ?? '', last.address ?? ''));
      setJobs((cur) => (cur.length > 0 ? cur : last.jobs ?? []));
      setToast(`${name}의 최근 기록(${Number(last.workDate.slice(5, 7))}/${Number(last.workDate.slice(8, 10))}) 값을 채웠어요`);
    } catch {
      // 자동 채움은 편의 기능 — 실패해도 입력 흐름은 막지 않는다
    }
  }

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
      const uploaded = await worklogApi.uploadPhotos(files);
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

  // 저장 전 예상 금액 — 서버 계산식 그대로 (입력이 멈추고 0.4초 뒤 요청)
  const previewBody = JSON.stringify({
    workDate,
    category: category || undefined,
    payStatus,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    breakHours: breakHours ? Number(breakHours) : undefined,
    dailyWage: dailyWage ? parseMoney(dailyWage) : undefined,
    amountOverride: amountOverride ? parseMoney(amountOverride) : null,
    withholdingApplied,
    payMultiplier,
  });
  const [debouncedBody, setDebouncedBody] = useState(previewBody);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBody(previewBody), 400);
    return () => clearTimeout(timer);
  }, [previewBody]);
  const previewQ = useQuery({
    queryKey: ['worklog-preview', debouncedBody],
    queryFn: () => worklogApi.preview(JSON.parse(debouncedBody)),
    enabled: !isDayOff && !!category && initializedRef.current,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const preview = isDayOff ? null : previewQ.data;

  const isValid = !!workDate && (isDayOff || title.trim().length > 0);

  async function handleSave(continueNext = false) {
    setError('');
    if (continueNext) setSavingNext(true);
    else setSaving(true);
    try {
      const dto = {
        title: isDayOff ? title.trim() || category : title.trim(),
        workDate,
        category: category || undefined,
        payStatus,
        // 수정에서 비운 칸은 null로 보내야 서버에서 실제로 지워진다
        startTime: startTime || (isEdit ? null : undefined),
        endTime: endTime || (isEdit ? null : undefined),
        breakHours: breakHours ? Number(breakHours) : undefined,
        jobs,
        dailyWage: dailyWage ? parseMoney(dailyWage) : undefined,
        amountOverride: amountOverride ? parseMoney(amountOverride) : null,
        withholdingApplied,
        payMultiplier,
        address: address || (isEdit ? null : undefined),
        photos,
        memo: memo || (isEdit ? null : undefined),
      };
      if (isEdit && record) {
        await worklogApi.update(record.id, dto);
      } else {
        await worklogApi.create(dto);
      }
      await invalidateWorklog(qc);
      if (continueNext && !isEdit) {
        // 같은 현장·시간·일급여 그대로 다음 날로 넘어가 연속 입력 (메모·사진·직접입력 금액은 비움)
        setToast(`${Number(workDate.slice(5, 7))}/${Number(workDate.slice(8, 10))} 저장했어요 · 다음 날을 입력해 주세요`);
        setWorkDate(shiftDay(workDate, 1));
        setMemo('');
        setPhotos([]);
        setAmountOverride('');
        setInitTick((t) => t + 1);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      leavingRef.current = true;
      popToScreen(navigation, 'WorklogHome', { savedMode: isEdit ? 'edit' : 'create', savedAt: Date.now(), savedDate: workDate });
    } catch (e) {
      setError(getErrorMessage(e, '저장에 실패했어요. 다시 시도해 주세요.'));
    } finally {
      setSaving(false);
      setSavingNext(false);
    }
  }

  async function handleDelete() {
    if (!record) return;
    setDeleting(true);
    try {
      await worklogApi.delete(record.id);
      setDeleteConfirm(false);
      await invalidateWorklog(qc);
      leavingRef.current = true;
      popToScreen(navigation, 'WorklogHome', { savedMode: 'delete', savedAt: Date.now(), savedDate: record.workDate });
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
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + keyboardHeight }]}>
          <KeyboardScrollProvider value={scrollToInput}>
            <Section icon={<IconInfo color={theme.brand} />} title="기본 정보" theme={theme}>
              {isDayOff ? (
                <Text style={[styles.hint, { color: theme.textMuted, marginBottom: 12 }]}>현장명 없이 등록돼요</Text>
              ) : (
                <TextField variant="line" placeholder="현장명 (예: 송도 / 학익)" value={title} onChangeText={setTitle} style={{ marginBottom: 10 }} />
              )}
              {!isDayOff && titleSuggestions.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={{ marginBottom: 12 }}>
                  <View style={styles.chipRow}>
                    {titleSuggestions.map((s) => (
                      <Pressable key={s.id} onPress={() => handlePickTitle(s.name)} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.bg }]}>
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

              <View style={styles.dateRow}>
                <Pressable hitSlop={6} onPress={() => setWorkDate((d) => shiftDay(d, -1))} style={[styles.dateStep, { backgroundColor: theme.bg }]}>
                  <Text style={{ fontSize: 18, color: theme.text }}>‹</Text>
                </Pressable>
                <Pressable onPress={() => setDatePickerVisible(true)} style={[styles.box, styles.dateMain, { backgroundColor: theme.bg }]}>
                  <Text style={{ fontSize: 15, color: theme.text, fontWeight: '600' }}>{formatDateLabel(workDate)}</Text>
                </Pressable>
                <Pressable hitSlop={6} onPress={() => setWorkDate((d) => shiftDay(d, 1))} style={[styles.dateStep, { backgroundColor: theme.bg }]}>
                  <Text style={{ fontSize: 18, color: theme.text }}>›</Text>
                </Pressable>
              </View>
              {sameDayRecords.length > 0 && (
                <Text style={[styles.hint, { color: theme.danger, marginBottom: 12 }]}>
                  이 날 이미 {sameDayRecords.length}건 있어요 · {sameDayRecords.map((r) => r.title).join(', ')}
                </Text>
              )}

              {!isDayOff && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {PAY_STATUS_OPTIONS.map((o) => {
                      const active = o.value === payStatus;
                      return (
                        <Pressable
                          key={o.value}
                          onPress={() => setPayStatus(o.value)}
                          style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.bg }]}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: active ? theme.brand : theme.text }}>{o.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </Section>

            {!isDayOff && (
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
                {startTime && endTime && endTime < startTime && (
                  <Text style={[styles.hint, { color: theme.textMuted, marginBottom: 10 }]}>종료가 시작보다 빠르면 다음 날 종료로 계산돼요</Text>
                )}
                <TextField variant="box" placeholder="휴게시간 (미지정 시 자동)" value={breakHours} onChangeText={setBreakHours} keyboardType="numeric" suffix="시간" />
              </Section>
            )}

            {!isDayOff && (
              <Section icon={<IconWallet color={theme.brand} />} title="급여" theme={theme}>
                <View style={styles.row2}>
                  <TextField variant="box" placeholder="일급여 (미지정 시 자동)" value={dailyWage} onChangeText={(t) => setDailyWage(formatMoneyInput(t))} keyboardType="numeric" suffix="원" style={{ flex: 1 }} />
                  <TextField variant="box" placeholder="실수령 직접입력 (선택)" value={amountOverride} onChangeText={(t) => setAmountOverride(formatMoneyInput(t))} keyboardType="numeric" suffix="원" style={{ flex: 1 }} />
                </View>

                <View style={styles.switchRow}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>원천징수(3.3%) 적용</Text>
                  <Switch checked={withholdingApplied} onCheckedChange={setWithholdingApplied} />
                </View>

                <View style={{ marginBottom: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600', marginBottom: 2 }}>공수 배율</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 8 }}>0.5=반대가리(반액 지급), 1.5·2=연장근무 추가 공수</Text>
                  <View style={styles.chipRow}>
                    {PAY_MULTIPLIER_OPTIONS.map((v) => {
                      const active = payMultiplier === v;
                      return (
                        <Pressable
                          key={v}
                          onPress={() => setPayMultiplier(v)}
                          style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.bg }]}
                        >
                          <Text style={{ color: active ? theme.brand : theme.textMuted, fontSize: 13, fontWeight: '700' }}>{v}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Section>
            )}

            <Section icon={<IconNotes color={theme.brand} />} title="추가 정보" theme={theme}>
              {!isDayOff && jobChoices.length > 0 && (
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

              {!isDayOff && <TextField variant="box" placeholder="주소 (미지정 시 자동)" value={address} onChangeText={setAddress} style={{ marginBottom: 12 }} />}

              {!isDayOff && (
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
              )}

              {isDayOff && <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>사유 (선택)</Text>}
              <TextInput
                ref={memoRef}
                style={[styles.memoInput, { color: theme.text, backgroundColor: theme.bg }]}
                placeholder={isDayOff ? '예: 병원 진료, 개인 일정' : '메모 (선택)'}
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                value={memo}
                onChangeText={setMemo}
                onFocus={() => scrollToInput(memoRef.current)}
              />
            </Section>

            {isEdit && record && (
              <Pressable style={styles.deleteRow} onPress={() => navigation.navigate('WorklogSchedule', { copyFrom: record })}>
                <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>다른 날짜로 복사하기</Text>
              </Pressable>
            )}
            {isEdit && (
              <Pressable style={styles.deleteRow} onPress={() => setDeleteConfirm(true)}>
                <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>이 기록 삭제하기</Text>
              </Pressable>
            )}
          </KeyboardScrollProvider>
        </ScrollView>

        <View style={[styles.ctaWrap, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {preview && (
            <View style={[styles.previewRow, { backgroundColor: theme.bg }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>예상 금액</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                  {preview.workedHours != null
                    ? `실근무 ${preview.workedHours}시간${preview.overtimeHours ? ` · 초과 ${preview.overtimeHours}시간` : ''}`
                    : '시간 미입력 · 일급 기준'}
                  {preview.withholdingApplied ? ` · 세전 ${krw(preview.effectiveAmount)}` : ''}
                </Text>
              </View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>
                {preview.withholdingApplied ? '실수령 ' : ''}
                {krw(preview.netAmount)}
              </Text>
            </View>
          )}
          {error ? <Text style={{ color: theme.danger, fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}
          {!error && !isValid ? <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8 }}>{!workDate ? '날짜를 선택해 주세요' : '현장명을 입력해 주세요'}</Text> : null}
          {!isEdit && (
            <View style={{ marginBottom: 8 }}>
              <Button display="full" size="medium" type="primary" style="weak" disabled={!isValid || saving} loading={savingNext} onPress={() => handleSave(true)}>
                저장하고 다음 날 입력
              </Button>
            </View>
          )}
          <Button display="full" size="big" type="primary" disabled={!isValid || savingNext} loading={saving} onPress={() => handleSave(false)}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <DatePicker
        visible={datePickerVisible}
        value={workDate}
        onSelect={setWorkDate}
        onClose={() => setDatePickerVisible(false)}
        markedDates={markedDates}
        onMonthChange={(year, month) => setPickerYm({ year, month })}
      />

      <ConfirmDialog
        visible={leaveConfirm}
        title="입력한 내용이 사라져요"
        description="저장하지 않고 나갈까요?"
        confirmText="나가기"
        danger
        onConfirm={() => {
          setLeaveConfirm(false);
          pendingLeaveRef.current?.();
        }}
        onClose={() => {
          setLeaveConfirm(false);
          pendingLeaveRef.current = null;
        }}
      />

      <ConfirmDialog
        visible={deleteConfirm}
        title="근무 기록을 삭제할까요?"
        confirmText="삭제하기"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(false)}
      />

      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />

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
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dateMain: { flex: 1 },
  dateStep: { width: 44, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  memoInput: { minHeight: 72, borderRadius: 10, paddingHorizontal: 14, paddingTop: 10, fontSize: 14, textAlignVertical: 'top' },
  deleteRow: { alignItems: 'center', paddingVertical: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 12.5 },
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
