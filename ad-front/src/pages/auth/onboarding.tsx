import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../lib/theme';

export default function OnboardingPage() {
  const navigate = useNavigate();
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
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100dvh',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: theme.card,
      }}
    >
      <span style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginBottom: 8 }}>가구를 만들어보세요</span>
      <span style={{ fontSize: 14, color: theme.textMuted, marginBottom: 32, lineHeight: '20px' }}>
        가족이나 파트너와 함께 자산을 관리할 수 있어요.
      </span>
      <div style={{ marginBottom: 16 }}>
        <TextField
          variant="line"
          placeholder="가구 이름 (예: 우리 가족)"
          value={name}
          onChangeText={setName}
        />
      </div>
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
    </div>
  );
}
