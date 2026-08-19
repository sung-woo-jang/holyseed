import { StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

interface TextFieldBigProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  suffix?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function TextFieldBig({ placeholder, value, onChangeText, keyboardType = 'default', suffix, autoFocus, style }: TextFieldBigProps) {
  const theme = useTheme();
  return (
    <View style={[styles.field, style]}>
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType === 'numeric' ? 'number-pad' : 'default'}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
      />
      {suffix && <Text style={[styles.suffix, { color: theme.textMuted }]}>{suffix}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  input: { fontSize: 36, fontWeight: '800', textAlign: 'center', minWidth: 60 },
  suffix: { fontSize: 18, fontWeight: '600', marginLeft: 6 },
});
