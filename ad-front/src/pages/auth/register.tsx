import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { saveTokens } from '../../lib/storage';
import { useAuthStore } from '../../stores/auth.store';
import TossEmoji from '../../components/common/TossEmoji';
import Loader from '../../components/ui/Loader';
import { TE } from '../../lib/toss-emoji';
import styles from './auth.module.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: res } = await api.post('/auth/register', {
        email,
        password,
        name: name || undefined,
      });
      const payload = res.data ?? res;

      await saveTokens(payload.accessToken, payload.refreshToken);
      setAuth(
        { accessToken: payload.accessToken, refreshToken: payload.refreshToken },
        payload.user,
      );
      navigate('/auth/onboarding', { replace: true });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '회원가입에 실패했어요.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.logoArea}>
        <div className={styles.logoBox}>
          <TossEmoji code={TE.party} size={44} />
        </div>
        <span className={styles.appName}>회원가입</span>
        <span className={styles.appDesc}>{'자산일기와 함께\n기록을 시작해요'}</span>
      </div>

      <form className={styles.bottomArea} onSubmit={handleSubmit}>
        <div className={styles.form}>
          <input
            className={styles.input}
            type="text"
            placeholder="이름 (선택)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
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
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        <button className={styles.submitBtn} type="submit" disabled={submitting}>
          {submitting ? <Loader color="#fff" /> : '가입하기'}
        </button>

        <span className={styles.switchText}>
          이미 계정이 있나요?{' '}
          <Link to="/login" className={styles.switchLink}>
            로그인
          </Link>
        </span>
      </form>
    </div>
  );
}
