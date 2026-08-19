import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

interface TextFieldProps {
  variant?: 'line' | 'box';
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  keyboardType?: 'default' | 'numeric';
  suffix?: string;
  maxLength?: number;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
}

const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { variant = 'box', placeholder, value, onChangeText, label, keyboardType = 'default', suffix, maxLength, autoFocus, style, onFocus, onSubmitEditing },
  ref,
) {
  const theme = useTheme();
  return (
    <View style={style}>
      {label && <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>}
      <View
        style={[
          styles.field,
          variant === 'line'
            ? { borderBottomWidth: 1, borderColor: theme.border }
            : { backgroundColor: theme.bg, borderRadius: 10, paddingHorizontal: 12 },
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          value={value}
          maxLength={maxLength}
          autoFocus={autoFocus}
          keyboardType={keyboardType === 'numeric' ? 'number-pad' : 'default'}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="next"
        />
        {suffix && <Text style={[styles.suffix, { color: theme.textMuted }]}>{suffix}</Text>}
      </View>
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  label: { fontSize: 12, marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 4 },
  suffix: { fontSize: 13, marginLeft: 6 },
});
