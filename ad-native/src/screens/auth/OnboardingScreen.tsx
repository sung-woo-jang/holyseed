import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../lib/theme';
import Loader from '../../components/ui/Loader';
import JoinSheet from '../../components/sheets/JoinSheet';

export default function OnboardingScreen() {
  const theme = useTheme();
  const { setHouseholds } = useAuthStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
        <Pressable style={styles.joinLink} onPress={() => setJoinOpen(true)}>
          <Text style={[styles.joinLinkText, { color: theme.brand }]}>초대 코드로 합류하기</Text>
        </Pressable>
      </View>

      <JoinSheet visible={joinOpen} onClose={() => setJoinOpen(false)} />
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
  joinLink: { alignItems: 'center', marginTop: 14, padding: 4 },
  joinLinkText: { fontSize: 13, fontWeight: '600' },
});
