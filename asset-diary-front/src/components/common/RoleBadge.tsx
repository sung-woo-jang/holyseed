import React from 'react';
import { Badge } from '@toss/tds-react-native';
import type { MemberRole } from '../../types/api';

const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: '소유자',
  EDITOR: '편집자',
  VIEWER: '조회자',
};

type BadgeType = 'blue' | 'teal' | 'elephant';
const ROLE_TYPE: Record<MemberRole, BadgeType> = {
  OWNER: 'blue',
  EDITOR: 'teal',
  VIEWER: 'elephant',
};

export default function RoleBadge({ role }: { role: MemberRole }) {
  return (
    <Badge size="small" type={ROLE_TYPE[role]} badgeStyle="weak">
      {ROLE_LABEL[role]}
    </Badge>
  );
}
