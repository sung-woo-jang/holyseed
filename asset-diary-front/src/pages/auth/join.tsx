import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

export const Route = createRoute('/auth/join', {
  component: JoinPage,
});

function JoinPage() {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const { setHouseholds } = useAuthStore();
  const code = (params as Record<string, string>)['code'] ?? '';
  const [preview, setPreview] = useState<{ householdName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (code) loadPreview(code);
    else setLoading(false);
  }, [code]);

  async function loadPreview(inviteCode: string) {
    try {
      const { data } = await api.post(`/invitations/${inviteCode}/preview`);
      setPreview(data.data ?? data);
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvite() {
    setJoining(true);
    try {
      await api.post(`/invitations/${code}/accept`);
      const { data } = await api.get('/households');
      setHouseholds(data.data ?? data);
      navigation.navigate('/');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182F6" />
      </View>
    );
  }

  if (!preview) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>유효하지 않은 초대 코드입니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>초대를 받았어요</Text>
      <Text style={styles.householdName}>{preview.householdName}</Text>
      <Text style={styles.role}>{preview.role} 권한으로 참여</Text>
      <TouchableOpacity style={styles.btn} onPress={acceptInvite} disabled={joining}>
        {joining ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>참여하기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#191F28', marginBottom: 16 },
  householdName: { fontSize: 20, fontWeight: '600', color: '#3182F6', marginBottom: 8 },
  role: { fontSize: 14, color: '#8B95A1', marginBottom: 40 },
  btn: { backgroundColor: '#3182F6', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { fontSize: 16, color: '#FF3B30' },
});
