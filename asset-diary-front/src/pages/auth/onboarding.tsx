import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, TextField } from '@toss/tds-react-native';
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
      <View style={styles.field}>
        <TextField
          variant="line"
          placeholder="가구 이름 (예: 우리 가족)"
          value={name}
          onChangeText={setName}
        />
      </View>
      <Button
        display="full"
        size="big"
        type="primary"
        disabled={!name.trim()}
        loading={loading}
        onPress={createHousehold}
      >
        가구 만들기
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 8 },
  desc: { fontSize: 14, color: '#8B95A1', marginBottom: 32, lineHeight: 20 },
  field: { marginBottom: 16 },
});
