import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export type DatePickerRequest = {
  value: Date;
  maximumDate?: Date;
};

// Abre el calendario nativo de Android (D-03) y resuelve con la fecha elegida, o con null
// si el usuario lo cierra sin elegir.
export function openDatePicker(
  request: DatePickerRequest,
): Promise<Date | null> {
  return new Promise(resolve => {
    DateTimePickerAndroid.open({
      value: request.value,
      mode: 'date',
      maximumDate: request.maximumDate,
      onValueChange: (_event, date) => resolve(date),
      onDismiss: () => resolve(null),
      onError: () => resolve(null),
    });
  });
}
