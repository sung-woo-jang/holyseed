import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

export const Route = createRoute('/auth/onboarding', {
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigation = Route.useNavigation();
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
      navigation.navigate('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>가구를 만들어보세요</Text>
      <Text style={styles.desc}>가족이나 파트너와 함께 자산을 관리할 수 있어요.</Text>
      <TextInput
        style={styles.input}
        placeholder="가구 이름 (예: 우리 가족)"
        value={name}
        onChangeText={setName}
        maxLength={20}
      />
      <TouchableOpacity
        style={[styles.btn, !name.trim() && styles.btnDisabled]}
        onPress={createHousehold}
        disabled={!name.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>가구 만들기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 8 },
  desc: { fontSize: 14, color: '#8B95A1', marginBottom: 32, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: '#3182F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#C9CEDD' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
