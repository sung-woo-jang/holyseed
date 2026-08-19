import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

interface ListHeaderProps {
  title: ReactNode;
  lower?: ReactNode;
  right?: ReactNode;
}

function ListHeaderRoot({ title, lower, right }: ListHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.texts}>
        {title}
        {lower}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

function TitleParagraph({ typography = 't4', children }: { typography?: 't4' | 't5'; children: ReactNode }) {
  const theme = useTheme();
  return <Text style={{ fontSize: typography === 't4' ? 20 : 14, fontWeight: '800', color: theme.text }}>{children}</Text>;
}

function DescriptionParagraph({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>{children}</Text>;
}

const ListHeader = Object.assign(ListHeaderRoot, { TitleParagraph, DescriptionParagraph });
export default ListHeader;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  texts: { flex: 1 },
});
