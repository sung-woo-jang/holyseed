import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { saveTokens } from '../../lib/storage';
import { useAuthStore } from '../../stores/auth.store';
import { loadHouseholds } from '../../components/AuthBootstrap';
import TossEmoji from '../../components/common/TossEmoji';
import Loader from '../../components/ui/Loader';
import { TE } from '../../lib/toss-emoji';
import styles from './auth.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 소셜 로그인 실패 후 리다이렉트 (?error=oauth)
  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setError('소셜 로그인에 실패했어요. 다시 시도해 주세요.');
    }
  }, [searchParams]);

  function handleGoogleLogin() {
    window.location.href = '/api/ad/auth/google';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLogging(true);
    setError(null);
    try {
      const { data: res } = await api.post('/auth/login', { email, password });
      const payload = res.data ?? res;

      await saveTokens(payload.accessToken, payload.refreshToken);
      setAuth(
        { accessToken: payload.accessToken, refreshToken: payload.refreshToken },
        payload.user,
      );
      await loadHouseholds();
      navigate('/', { replace: true });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '로그인에 실패했어요.';
      setError(msg);
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.logoArea}>
        <div className={styles.logoBox}>
          <TossEmoji code={TE.ledger} size={44} />
        </div>
        <span className={styles.appName}>자산일기</span>
        <span className={styles.appDesc}>{'우리 가족의 자산을\n함께 기록하고 관리해요'}</span>
      </div>

      <form className={styles.bottomArea} onSubmit={handleSubmit}>
        <div className={styles.form}>
          <input
            className={styles.input}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        <button className={styles.submitBtn} type="submit" disabled={logging}>
          {logging ? <Loader color="#fff" /> : '로그인'}
        </button>

        <div className={styles.dividerRow}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>또는</span>
          <span className={styles.dividerLine} />
        </div>

        <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
          </svg>
          구글로 계속하기
        </button>

        <span className={styles.switchText}>
          아직 계정이 없나요?{' '}
          <Link to="/register" className={styles.switchLink}>
            회원가입
          </Link>
        </span>

        <span className={styles.note}>
          {'로그인 시 자산일기 이용약관 및\n개인정보 처리방침에 동의하게 됩니다'}
        </span>
      </form>
    </div>
  );
}
