import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Segmented from '../../../components/common/Segmented';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import { vrApi, type VrEventDto } from '../../../api/vr';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';

const LEVEL_OPTIONS = ['전체', 'info', 'warn', 'error'];
const LEVEL_MAP: Record<string, string> = { 전체: 'all', info: 'info', warn: 'warn', error: 'error' };

function kst(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function VrSystemScreen() {
  const theme = useTheme();
  const [level, setLevel] = useState('전체');
  const [cursor, setCursor] = useState(0);
  const [events, setEvents] = useState<VrEventDto[]>([]);

  const statusQ = useQuery({ queryKey: ['vr-status'], queryFn: vrApi.status, refetchInterval: 30_000 });
  const eventsQ = useQuery({ queryKey: ['vr-events', cursor, level], queryFn: () => vrApi.events(cursor, LEVEL_MAP[level]) });

  useEffect(() => {
    if (!eventsQ.data) return;
    setEvents((prev) => (cursor === 0 ? eventsQ.data!.events : [...prev, ...eventsQ.data!.events]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsQ.data]);

  function changeLevel(v: string) {
    setLevel(v);
    setCursor(0);
  }

  const engine = statusQ.data?.engine;

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {engine && (
        <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statusRow}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>엔진 모드</Text>
            <View style={[styles.badge, { backgroundColor: engine.mode === 'live' ? theme.danger + '22' : theme.brandSoft }]}>
              <Text style={{ color: engine.mode === 'live' ? theme.danger : theme.brand, fontSize: 11, fontWeight: '800' }}>
                {engine.mode === 'live' ? 'LIVE' : 'DRY-RUN'}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>스케줄러</Text>
            <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>{engine.schedulerEnabled ? '켜짐' : '꺼짐'}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>다음 실행</Text>
            <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>{engine.nextRun ? kst(engine.nextRun) : '—'}</Text>
          </View>
          {engine.lastRun && (
            <View style={[styles.lastRun, { borderTopColor: theme.border }]}>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                마지막 실행 {kst(engine.lastRun.endedAt)} ·{' '}
                <Text style={{ color: engine.lastRun.level === 'error' ? theme.danger : engine.lastRun.level === 'warn' ? '#F5A623' : theme.textMuted, fontWeight: '700' }}>
                  {engine.lastRun.level.toUpperCase()}
                </Text>
              </Text>
              <Text style={{ color: theme.text, fontSize: 12.5, marginTop: 2 }}>{engine.lastRun.summary}</Text>
            </View>
          )}
        </View>
      )}

      <View style={{ marginBottom: 12 }}>
        <Segmented options={LEVEL_OPTIONS} value={level} onChange={changeLevel} small />
      </View>

      {eventsQ.isLoading && cursor === 0 ? (
        <View style={styles.center}>
          <Loader size="large" />
        </View>
      ) : events.length === 0 ? (
        <EmptyState iconCode={TE.receipt} title="이벤트가 없어요" />
      ) : (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {events.map((e, i) => (
            <View key={e.id} style={[styles.row, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
              <View style={styles.rowTop}>
                <Text
                  style={{
                    color: e.level === 'error' ? theme.danger : e.level === 'warn' ? '#F5A623' : theme.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {e.level.toUpperCase()}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>{kst(e.ts)}</Text>
              </View>
              <Text style={{ color: theme.text, fontSize: 13, marginTop: 3 }}>{e.message}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 10.5, marginTop: 2 }}>{e.source}</Text>
            </View>
          ))}
        </View>
      )}

      {eventsQ.data?.nextCursor != null && (
        <Pressable style={[styles.moreBtn, { borderColor: theme.border }]} onPress={() => setCursor(eventsQ.data!.nextCursor!)}>
          <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>더 보기</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { paddingVertical: 40, alignItems: 'center' },
  statusCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14, gap: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  lastRun: { borderTopWidth: 1, paddingTop: 8, marginTop: 2 },
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  row: { padding: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  moreBtn: { marginTop: 12, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
});
