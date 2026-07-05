import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/ui/Loader';
import { api } from '../../lib/api';
import { saveTokens } from '../../lib/storage';
import { useAuthStore } from '../../stores/auth.store';
import { loadHouseholds } from '../../components/AuthBootstrap';

/** 소셜 로그인 콜백 — URL fragment의 토큰을 저장하고 세션을 세팅한다 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');

      // 토큰이 주소창에 남지 않게 즉시 제거
      window.history.replaceState(null, '', window.location.pathname);

      if (!accessToken || !refreshToken) {
        navigate('/login?error=oauth', { replace: true });
        return;
      }

      try {
        await saveTokens(accessToken, refreshToken);
        const { data: res } = await api.get('/users/me');
        await loadHouseholds();
        // setAuth를 마지막에 — 인증 플래그가 서기 전에 가구 목록까지 채워 온보딩 오판 방지
        setAuth({ accessToken, refreshToken }, res.data ?? res);
        navigate('/', { replace: true });
      } catch {
        navigate('/login?error=oauth', { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Loader size="large" />
    </div>
  );
}
