import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../lib/theme';
import Loader from '../../components/ui/Loader';

// 초대 코드로 합류하기는 더보기 탭까지 포팅한 뒤(6단계) 함께 붙인다.
export default function OnboardingScreen() {
  const theme = useTheme();
  const { setHouseholds } = useAuthStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function createHousehold() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/households', { name: name.trim(), icon: '🏠' });
      const h = data.data ?? data;
      setHouseholds([{ id: h.id, name: h.name, icon: h.icon, role: 'OWNER' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.card }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>가구를 만들어보세요</Text>
        <Text style={[styles.desc, { color: theme.textMuted }]}>
          가족이나 파트너와 함께 자산을 관리할 수 있어요.
        </Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="가구 이름 (예: 우리 가족)"
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
        />
        <Pressable
          style={[styles.submitBtn, { backgroundColor: theme.brand, opacity: !name.trim() || loading ? 0.5 : 1 }]}
          onPress={createHousehold}
          disabled={!name.trim() || loading}
        >
          {loading ? <Loader color="#fff" /> : <Text style={styles.submitBtnText}>가구 만들기</Text>}
        </Pressable>
        <Text style={[styles.note, { color: theme.textMuted }]}>
          초대 코드로 합류하기는 곧 지원될 예정이에요
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 32 },
  input: { height: 48, borderBottomWidth: 1, fontSize: 16, marginBottom: 16 },
  submitBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, textAlign: 'center', marginTop: 14 },
});
