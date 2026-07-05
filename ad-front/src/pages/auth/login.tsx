import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
