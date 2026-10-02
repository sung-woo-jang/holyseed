import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import { installDownloadedApk, startApkDownload } from '../../lib/apk-update';
import { useApkUpdateStore } from '../../lib/apk-update/store';

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
}

/** 새 설치 파일(APK)이 올라오면 앱 안에서 받아 설치까지 — OTA로 못 고치는 네이티브 변경용 */
export default function ApkUpdateModal() {
  const theme = useTheme();
  const { phase, visible, info, progress, error, set } = useApkUpdateStore();
  if (phase === 'idle' || !info) return null;

  const close = () => set({ visible: false, ...(phase === 'available' ? { dismissedCode: info.versionCode, phase: 'idle' as const } : {}) });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {phase === 'error' ? '업데이트에 실패했어요' : '새 앱 버전이 있어요'}
          </Text>
          <Text style={[styles.desc, { color: theme.textMuted }]}>
            {phase === 'error'
              ? error
              : `v${info.versionName} · ${mb(info.size)}${info.notes ? `\n${info.notes}` : ''}${
                  phase === 'available' ? '\n받은 뒤 설치 화면이 열리면 "업데이트"를 눌러 주세요.' : ''
                }`}
          </Text>

          {phase === 'downloading' && (
            <View style={styles.progressWrap}>
              <View style={[styles.track, { backgroundColor: theme.border }]}>
                <View style={[styles.fill, { backgroundColor: theme.brand, width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={[styles.pct, { color: theme.textMuted }]}>{Math.round(progress * 100)}%</Text>
            </View>
          )}

          {phase === 'ready' && (
            <Text style={[styles.desc, { color: theme.textMuted }]}>설치 화면이 안 뜨거나 닫았다면 아래 버튼을 다시 눌러 주세요.</Text>
          )}

          <View style={styles.buttons}>
            <Pressable style={[styles.btn, { backgroundColor: theme.bg }]} onPress={close}>
              <Text style={[styles.btnText, { color: theme.text }]}>{phase === 'downloading' ? '숨기기' : phase === 'available' ? '나중에' : '닫기'}</Text>
            </Pressable>
            {phase !== 'downloading' && (
              <Pressable
                style={[styles.btn, { backgroundColor: theme.brand }]}
                onPress={() => void (phase === 'ready' ? installDownloadedApk() : startApkDownload())}
              >
                <Text style={[styles.btnText, { color: '#fff' }]}>
                  {phase === 'ready' ? '설치하기' : phase === 'error' ? '다시 시도' : '받아서 설치'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  dialog: { width: '100%', maxWidth: 340, borderRadius: 18, padding: 22, gap: 6 },
  title: { fontSize: 17, fontWeight: '700' },
  desc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  pct: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
});
