import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../lib/theme';

export default function JoinPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { setHouseholds } = useAuthStore();
  const code = searchParams.get('code') ?? '';
  const [preview, setPreview] = useState<{ householdName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (code) loadPreview(code);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      navigate('/');
    } finally {
      setJoining(false);
    }
  }

  const center: React.CSSProperties = {
    flex: 1,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };

  if (loading) {
    return (
      <div style={center}>
        <Loader size="large" />
      </div>
    );
  }

  if (!preview) {
    return (
      <div style={center}>
        <span style={{ fontSize: 16, color: theme.danger }}>유효하지 않은 초대 코드입니다.</span>
      </div>
    );
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
      <span style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginBottom: 16 }}>초대를 받았어요</span>
      <span style={{ fontSize: 20, fontWeight: 600, color: theme.brand, marginBottom: 8 }}>{preview.householdName}</span>
      <span style={{ fontSize: 14, color: theme.textMuted, marginBottom: 40 }}>{preview.role} 권한으로 참여</span>
      <Button display="full" size="big" type="primary" loading={joining} onPress={acceptInvite}>
        참여하기
      </Button>
    </div>
  );
}
