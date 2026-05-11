import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}
      <Text style={styles.title}>{title}</Text>
      {right ? <View style={styles.right}>{right}</View> : <View style={styles.backBtn} />}
    </View>
  );
}

interface HeaderButtonProps {
  label: string;
  onPress: () => void;
}

export function HeaderButton({ label, onPress }: HeaderButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  backBtn: { width: 32 },
  backText: { fontSize: 24, color: '#191F28', lineHeight: 28 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#191F28', textAlign: 'center' },
  right: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', width: 'auto' },
  btnText: { fontSize: 14, color: '#3182F6', fontWeight: '600' },
});
