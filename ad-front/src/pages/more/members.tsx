import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import ListRow from '../../components/ui/ListRow';
import Border from '../../components/ui/Border';
import ScreenHeader from '../../components/common/ScreenHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppToast from '../../components/common/AppToast';
import RoleBadge from '../../components/common/RoleBadge';
import InviteSheet from '../../components/sheets/InviteSheet';
import JoinSheet from '../../components/sheets/JoinSheet';
import SheetModal from '../../components/sheets/SheetModal';
import TossEmoji from '../../components/common/TossEmoji';
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import { Icon } from '../../components/common/Icon';
import { TE } from '../../lib/toss-emoji';
import { useUpdateRole, useRemoveMember } from '../../queries/mutations';
import type { MemberRole } from '../../types/api';
import styles from './members.module.css';

const ROLE_OPTIONS: { key: MemberRole; label: string }[] = [
  { key: 'OWNER',  label: '소유자' },
  { key: 'EDITOR', label: '편집자' },
  { key: 'VIEWER', label: '조회자' },
];

export default function MembersPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const data = useDataSource();
  const myRole = useMockRole();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [rolePicker, setRolePicker] = useState<{ memberId: string; currentRole: MemberRole } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState('');
  const updateRole = useUpdateRole();
  const removeMember = useRemoveMember();
  const isOwner = myRole === 'OWNER';

  async function handleRoleChange(role: MemberRole) {
    if (!rolePicker || updateRole.isPending) return;
    try {
      await updateRole.mutateAsync({ userId: Number(rolePicker.memberId), role });
      setToast('역할을 변경했어요');
    } catch {
      setToast('역할 변경에 실패했어요');
    } finally { setRolePicker(null); }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    try {
      await removeMember.mutateAsync(Number(removeTarget.id));
      setToast(`${removeTarget.name}님을 내보냈어요`);
    } catch {
      setToast('내보내기에 실패했어요');
    } finally { setRemoveTarget(null); }
  }

  return (
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <ScreenHeader title="멤버 관리" onBack={() => navigate(-1)} />
      <div className={styles.scroll}>
        <span className={styles.subtitle} style={{ color: theme.textMuted }}>
          우리집 자산을 함께 기록·조회하는 멤버들이에요.
        </span>

        {/* 멤버 리스트 */}
        {data.members.map((m, idx) => (
          <React.Fragment key={m.id}>
            <ListRow
              left={
                <div className={styles.avatar} style={{ backgroundColor: m.avatar }}>
                  <span className={styles.avatarText}>{m.initial}</span>
                </div>
              }
              contents={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.memberName} style={{ color: theme.text }}>{m.name}</span>
                  <span className={styles.memberJoined} style={{ color: theme.textMuted }}>{m.joined || '-'} 합류</span>
                </div>
              }
              right={
                <div className={styles.rightWrap}>
                  <RoleBadge role={m.role as MemberRole} />
                  {isOwner && m.role !== 'OWNER' && (
                    <div className={styles.ownerActions}>
                      <button
                        type="button"
                        className={styles.roleBtn}
                        style={{ borderColor: theme.border }}
                        onClick={() => setRolePicker({ memberId: m.id, currentRole: m.role as MemberRole })}
                      >
                        {Icon.chevronDown(theme.textMuted, 14)}
                      </button>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        style={{ borderColor: theme.danger }}
                        onClick={() => setRemoveTarget({ id: m.id, name: m.name })}
                      >
                        <span className={styles.removeBtnText} style={{ color: theme.danger }}>내보내기</span>
                      </button>
                    </div>
                  )}
                </div>
              }
              verticalPadding="small"
            />
            {idx < data.members.length - 1 && <Border type="full" />}
          </React.Fragment>
        ))}

        <Border type="full" height={16} />

        {/* 액션 */}
        {isOwner ? (
          <div className={styles.actions}>
            <Button display="full" size="big" type="primary" onPress={() => setInviteOpen(true)}>
              + 멤버 초대하기
            </Button>
            <Button display="full" size="big" type="primary" style="weak" leftAccessory={<TossEmoji code={TE.link} size={16} />} onPress={() => setJoinOpen(true)}>
              초대 코드로 합류하기
            </Button>
            <span className={styles.helperText} style={{ color: theme.textMuted }}>
              초대장은 7일간 유효해요. 만료 전에 합류해야 해요.
            </span>
          </div>
        ) : (
          <div className={styles.actions}>
            <Button display="full" size="big" type="primary" style="weak" onPress={() => setJoinOpen(true)}>
              초대 코드로 합류하기
            </Button>
            <div className={styles.lockBox} style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <TossEmoji code={TE.lock} size={24} />
              <span className={styles.lockText} style={{ color: theme.textMuted }}>
                멤버 초대·관리는 소유자만 가능해요
              </span>
            </div>
          </div>
        )}
      </div>

      <InviteSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} />
      <JoinSheet visible={joinOpen} onClose={() => setJoinOpen(false)} />

      {/* 역할 변경 피커 */}
      <SheetModal visible={!!rolePicker} onClose={() => setRolePicker(null)} header="역할 변경">
        <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column' }}>
          {ROLE_OPTIONS.filter((o) => o.key !== 'OWNER').map((opt) => (
            <ListRow
              key={opt.key}
              contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{opt.label}</span>}
              right={rolePicker?.currentRole === opt.key ? Icon.check(theme.brand, 16) : undefined}
              onPress={() => handleRoleChange(opt.key)}
              verticalPadding="small"
            />
          ))}
        </div>
      </SheetModal>

      <ConfirmDialog
        visible={!!removeTarget}
        title="멤버를 내보낼까요?"
        description={removeTarget ? `${removeTarget.name}님이 이 가구에서 제외돼요.` : undefined}
        confirmText="내보내기"
        danger
        loading={removeMember.isPending}
        onConfirm={confirmRemove}
        onClose={() => setRemoveTarget(null)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </div>
  );
}
