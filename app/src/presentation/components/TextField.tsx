import { useRef, useState, type ReactNode, type Ref } from 'react';
import {
  Pressable,
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
import { Icon } from './Icon';
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
  required?: boolean;
  optional?: boolean;
  prefix?: string;
  inputColor?: string;
  secureToggle?: boolean;
};

export const TEXT_FIELD_TEXTS = {
  optional: '(opcional)',
  showPassword: 'Mostrar contraseña',
  hidePassword: 'Ocultar contraseña',
} as const;

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
  required = false,
  optional = false,
  prefix,
  inputColor,
  secureToggle = false,
  secureTextEntry,
  accessibilityLabel,
  ...inputProps
}: TextFieldProps) {
  const containerRef = useRef<ViewInstance>(null);
  const registry = useFocusedFieldRegistry();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const framed = prefix !== undefined || secureToggle;
  const frameStyles = [
    styles.input,
    focused && styles.inputFocused,
    error !== null && styles.inputError,
  ];
  const input = (
    <TextInput
      {...inputProps}
      accessibilityLabel={accessibilityLabel ?? label}
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
      placeholderTextColor={COLORS.placeholder}
      ref={ref}
      secureTextEntry={secureToggle ? !revealed : secureTextEntry}
      style={[
        framed ? styles.framedInput : frameStyles,
        inputColor !== undefined && { color: inputColor },
      ]}
      testID={testID}
      underlineColorAndroid="transparent"
      value={value}
    />
  );
  return (
    <View collapsable={false} ref={containerRef} style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {optional && (
          <Text style={styles.optional}>{TEXT_FIELD_TEXTS.optional}</Text>
        )}
      </View>
      {framed ? (
        <View style={[frameStyles, styles.frame]} testID={`${testID}-frame`}>
          {prefix !== undefined && (
            <Text
              style={[
                styles.prefix,
                inputColor !== undefined && { color: inputColor },
              ]}
              testID={`${testID}-prefix`}
            >
              {prefix}
            </Text>
          )}
          {input}
          {secureToggle && (
            <Pressable
              accessibilityLabel={
                revealed
                  ? TEXT_FIELD_TEXTS.hidePassword
                  : TEXT_FIELD_TEXTS.showPassword
              }
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setRevealed(current => !current)}
              style={styles.toggle}
              testID={`${testID}-visibility`}
            >
              <Icon
                color={COLORS.mutedText}
                name={revealed ? 'eyeOff' : 'eye'}
              />
            </Pressable>
          )}
        </View>
      ) : (
        input
      )}
      <FieldError message={error} testID={`${testID}-error`} />
      {helper}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  labelRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: COLORS.text, flexShrink: 1, fontSize: 15 },
  required: { color: COLORS.error },
  optional: { color: COLORS.placeholder, fontSize: 13, marginLeft: 8 },
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
  frame: { alignItems: 'center', flexDirection: 'row' },
  framedInput: {
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 0,
  },
  prefix: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  toggle: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 36,
  },
});
