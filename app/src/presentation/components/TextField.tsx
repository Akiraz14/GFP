import { useRef, useState, type ReactNode, type Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
  type ViewInstance,
} from 'react-native';
import { FieldError } from './FieldError';
import { useFocusedFieldRegistry } from './FormScrollView';
import { COLORS } from './theme';

type TextFieldProps = Omit<
  TextInputProps,
  'onChangeText' | 'value' | 'style' | 'underlineColorAndroid'
> & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error: string | null;
  testID: string;
  helper?: ReactNode;
  ref?: Ref<TextInputInstance>;
};

export function TextField({
  label,
  value,
  onChangeText,
  error,
  testID,
  editable = true,
  onFocus,
  onBlur,
  helper,
  ref,
  ...inputProps
}: TextFieldProps) {
  const containerRef = useRef<ViewInstance>(null);
  const registry = useFocusedFieldRegistry();
  const [focused, setFocused] = useState(false);
  return (
    <View collapsable={false} ref={containerRef} style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        editable={editable}
        onBlur={event => {
          setFocused(false);
          if (containerRef.current !== null) {
            registry?.blur(containerRef.current);
          }
          onBlur?.(event);
        }}
        onChangeText={onChangeText}
        onFocus={event => {
          setFocused(true);
          if (containerRef.current !== null) {
            registry?.focus(containerRef.current);
          }
          onFocus?.(event);
        }}
        ref={ref}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error !== null && styles.inputError,
        ]}
        testID={testID}
        underlineColorAndroid="transparent"
        value={value}
      />
      <FieldError message={error} testID={`${testID}-error`} />
      {helper}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { color: COLORS.text, fontSize: 15, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    paddingHorizontal: 11,
  },
  inputError: { borderColor: COLORS.error },
});
