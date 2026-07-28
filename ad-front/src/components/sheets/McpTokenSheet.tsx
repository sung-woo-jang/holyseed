import { useState } from 'react';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useCreateMcpToken } from '../../queries/mutations';
import { getErrorMessage } from '../../lib/error';
import styles from './McpTokenSheet.module.css';

interface McpTokenSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function McpTokenSheet({ visible, onClose }: McpTokenSheetProps) {
  const theme = useTheme();
  const [label, setLabel] = useState('');
  const [connectorUrl, setConnectorUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const createToken = useCreateMcpToken();

  async function handleCreate() {
    setError('');
    try {
      const result = await createToken.mutateAsync(label.trim() || undefined);
      setConnectorUrl(result.connectorUrl);
    } catch (e: any) {
      setError(getErrorMessage(e, 'MCP 토큰 발급에 실패했어요.'));
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(connectorUrl);
    } catch {
      // 클립보드 권한 거부 등 — URL이 화면에 보이므로 무시
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setLabel(''); setConnectorUrl(''); setError(''); setCopied(false);
    onClose();
  }

  return (
    <SheetModal visible={visible} onClose={handleClose} header="MCP 토큰 발급">
      {!connectorUrl ? (
        <div className={styles.body}>
          <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>라벨 (선택)</span>
          <TextField variant="line" placeholder="예: 아이폰, 맥북" value={label} onChangeText={setLabel} />
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button display="full" size="big" type="primary" loading={createToken.isPending} onPress={handleCreate}>
            발급하기
          </Button>
        </div>
      ) : (
        <div className={styles.body}>
          <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>커넥터 URL</span>
          <div className={styles.codeBox} style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <span className={styles.codeText} style={{ color: theme.brand }}>{connectorUrl}</span>
          </div>
          <span className={styles.hintText} style={{ color: theme.textMuted }}>
            claude.ai → 설정 → 커넥터 → 커스텀 커넥터 추가에 이 URL을 붙여넣으세요.
          </span>
          <div className={styles.btnRow}>
            <button
              type="button"
              className={styles.actionBtn}
              style={{ backgroundColor: copied ? theme.brandSoft : theme.bg, borderColor: theme.border }}
              onClick={handleCopy}
            >
              <span className={styles.actionBtnText} style={{ color: copied ? theme.brand : theme.text }}>
                {copied ? '복사됨!' : 'URL 복사'}
              </span>
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              style={{ backgroundColor: theme.brand, borderColor: 'transparent' }}
              onClick={handleClose}
            >
              <span className={styles.actionBtnText} style={{ color: '#fff' }}>닫기</span>
            </button>
          </div>
        </div>
      )}
    </SheetModal>
  );
}
