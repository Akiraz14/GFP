import { Modal, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { COLORS } from './theme';

export type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  testID?: string;
};

type MessageDialogProps = {
  message: string;
  actions: readonly DialogAction[];
  onRequestClose: () => void;
  testID?: string;
};

export function MessageDialog({
  message,
  actions,
  onRequestClose,
  testID,
}: MessageDialogProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      transparent
      visible
    >
      <View style={styles.overlay}>
        <View accessibilityRole="alert" style={styles.dialog} testID={testID}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {actions.map(action => (
              <ActionButton
                key={action.label}
                label={action.label}
                onPress={action.onPress}
                testID={action.testID}
                variant={action.variant ?? 'primary'}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
  },
  message: { color: COLORS.text, fontSize: 17, marginBottom: 20 },
  actions: { flexDirection: 'row' },
});
