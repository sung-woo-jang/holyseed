import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { householdsApi } from '../api';
import RoleBadge from '../components/common/RoleBadge';
import { useHousehold, useIsOwner } from '../hooks';
import { qk } from '../queries/keys';

interface MoreScreenProps {
  onCategoriesPress: () => void;
}

export default function MoreScreen({ onCategoriesPress }: MoreScreenProps) {
  const { household } = useHousehold();
  const isOwner = useIsOwner();
  const [showMembers, setShowMembers] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: qk.members(household?.id ?? 0),
    queryFn: () => householdsApi.members(household!.id),
    enabled: !!household && showMembers,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>더보기</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>가구</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => setShowMembers((v) => !v)}>
          <Text style={styles.menuLabel}>멤버 관리</Text>
          <Text style={styles.menuChevron}>{showMembers ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showMembers && members.map((m) => (
          <View key={m.id} style={styles.memberRow}>
            <View style={[styles.avatar, { backgroundColor: m.user.avatarColor }]}>
              <Text style={styles.avatarText}>{m.user.initial}</Text>
            </View>
            <Text style={styles.memberName}>{m.user.name}</Text>
            <RoleBadge role={m.role} />
          </View>
        ))}

        {isOwner && (
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text style={styles.menuLabel}>초대 링크 생성</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>관리</Text>
        <TouchableOpacity style={styles.menuItem} onPress={onCategoriesPress}>
          <Text style={styles.menuLabel}>카테고리 관리</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: '800', color: '#191F28', marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 12, color: '#8B95A1', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  menuLabel: { fontSize: 15, color: '#191F28' },
  menuChevron: { fontSize: 15, color: '#8B95A1' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  memberName: { flex: 1, fontSize: 14, color: '#191F28' },
});
