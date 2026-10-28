import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FieldError } from './FieldError';
import { COLORS } from './theme';

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  placeholder: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  disabled?: boolean;
  testID: string;
};

export function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled = false,
  testID,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, error !== null && styles.fieldError]}
        testID={testID}
      >
        <Text
          style={[styles.text, selected ? styles.value : styles.placeholder]}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <View
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.indicator}
          testID={`${testID}-indicator`}
        >
          <View style={[styles.chevron, disabled && styles.chevronDisabled]} />
        </View>
      </Pressable>
      <FieldError message={error} testID={`${testID}-error`} />
      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet} testID={`${testID}-options`}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map(option => (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => {
                    setOpen(false);
                    onChange(option.value);
                  }}
                  style={styles.option}
                  testID={`${testID}-option-${option.value}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      option.value === value && styles.optionSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { color: COLORS.text, fontSize: 15, marginBottom: 6 },
  field: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    flexDirection: 'row',
    minHeight: 48,
    paddingLeft: 12,
    paddingVertical: 8,
  },
  fieldError: { borderColor: COLORS.error },
  text: { flex: 1 },
  indicator: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    width: 40,
  },
  chevron: {
    borderBottomWidth: 2,
    borderColor: COLORS.mutedText,
    borderRightWidth: 2,
    height: 10,
    marginTop: -4,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  chevronDisabled: { borderColor: COLORS.disabled },
  value: { color: COLORS.text, fontSize: 16 },
  placeholder: { color: COLORS.mutedText, fontSize: 16 },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    maxHeight: '80%',
    paddingVertical: 12,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  option: { paddingHorizontal: 16, paddingVertical: 12 },
  optionText: { color: COLORS.text, fontSize: 16 },
  optionSelected: { color: COLORS.primary, fontWeight: '700' },
});
