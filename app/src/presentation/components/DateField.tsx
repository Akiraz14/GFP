import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  dateFromIso,
  formatDisplayDate,
  isoDateFromDate,
  parseDisplayDate,
  type IsoDate,
} from '../../business/dates/localDate';
import { openDatePicker } from './datePicker';
import { TextField } from './TextField';
import { COLORS } from './theme';

type DateFieldProps = {
  label: string;
  placeholder: string;
  calendarLabel: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  // Fecha máxima del calendario: hoy (HU4-CA04).
  maximumDate: IsoDate;
  disabled?: boolean;
  testID: string;
};

// Fecha con ingreso manual «DD/MM/AAAA» y botón de calendario (HU4, D-03).
export function DateField({
  label,
  placeholder,
  calendarLabel,
  value,
  onChange,
  error,
  maximumDate,
  disabled = false,
  testID,
}: DateFieldProps) {
  async function pick() {
    const current = parseDisplayDate(value);
    const initial =
      current !== null && current <= maximumDate ? current : maximumDate;
    const picked = await openDatePicker({
      value: dateFromIso(initial),
      maximumDate: dateFromIso(maximumDate),
    });
    if (picked !== null) {
      onChange(formatDisplayDate(isoDateFromDate(picked)));
    }
  }

  return (
    <View style={styles.row}>
      <View style={styles.input}>
        <TextField
          editable={!disabled}
          error={error}
          label={label}
          onChangeText={onChange}
          placeholder={placeholder}
          testID={testID}
          value={value}
        />
      </View>
      <Pressable
        accessibilityLabel={calendarLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => {
          pick();
        }}
        style={styles.calendar}
        testID={`${testID}-calendar`}
      >
        <Text style={styles.calendarGlyph}>📅</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', flexDirection: 'row' },
  input: { flex: 1 },
  calendar: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginLeft: 8,
    // Alinea el botón con la caja de texto, bajo la etiqueta.
    marginTop: 26,
    width: 48,
  },
  calendarGlyph: { fontSize: 20 },
});
