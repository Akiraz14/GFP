import { Modal, StyleSheet, Text, View } from 'react-native';
import type { Category } from '../../infrastructure/database/repositories/categoryRepository';
import { ActionButton } from '../components/ActionButton';
import { DismissibleOverlay } from '../components/DismissibleOverlay';
import { Icon } from '../components/Icon';
import { COLORS } from '../components/theme';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORY_TEXTS as TEXTS } from './categoryTexts';

type CategoryDeleteDialogProps = {
  category: Category;
  reassignCount: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Modal de eliminación del mockup de HU8 (F3 a F6): ícono de alerta y título centrados, la
// categoría, la advertencia en el recuadro amarillo, el recuento centrado y «Confirmar» en rojo.
export function CategoryDeleteDialog({
  category,
  reassignCount,
  busy,
  onCancel,
  onConfirm,
}: CategoryDeleteDialogProps) {
  const income = category.type === 'income';
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <DismissibleOverlay
        disabled={busy}
        onDismiss={onCancel}
        style={styles.overlay}
        testID="category-delete-dialog-backdrop"
      >
        <View
          accessibilityRole="alert"
          style={styles.dialog}
          testID="category-delete-dialog"
        >
          <View style={styles.alertCircle} testID="category-delete-alert">
            <Icon color={COLORS.error} name="alertTriangle" size={26} />
          </View>
          <Text
            accessibilityRole="header"
            style={styles.title}
            testID="category-delete-title"
          >
            {TEXTS.messages.deleteQuestion}
          </Text>
          <View style={styles.chip} testID="category-delete-category">
            <CategoryIcon icon={category.icon} size={32} />
            <Text style={styles.chipName}>{category.name}</Text>
            <View
              style={[
                styles.badge,
                income ? styles.badgeIncome : styles.badgeExpense,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: income ? COLORS.success : COLORS.error },
                ]}
              >
                {TEXTS.types[category.type]}
              </Text>
            </View>
          </View>
          <View style={styles.warning} testID="category-delete-warning">
            <Icon color={COLORS.warningText} name="info" size={18} />
            <Text style={styles.warningText}>
              {TEXTS.messages.deleteWarning}
            </Text>
          </View>
          {reassignCount > 0 && (
            <Text style={styles.count} testID="category-delete-count">
              {TEXTS.messages.reassignCount(reassignCount)}
            </Text>
          )}
          <View style={styles.actions}>
            <ActionButton
              disabled={busy}
              label={TEXTS.buttons.cancel}
              onPress={onCancel}
              testID="category-delete-cancel"
            />
            <ActionButton
              disabled={busy}
              label={TEXTS.buttons.confirm}
              onPress={onConfirm}
              testID="category-delete-confirm"
              variant="destructive"
            />
          </View>
        </View>
      </DismissibleOverlay>
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
    borderRadius: 16,
    padding: 20,
  },
  alertCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  title: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 10,
  },
  chipName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  badge: { borderRadius: 6, marginLeft: 8, paddingHorizontal: 6 },
  badgeIncome: { backgroundColor: '#E3F4E8' },
  badgeExpense: { backgroundColor: '#FBE6E4' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  warning: {
    alignItems: 'flex-start',
    backgroundColor: COLORS.warningSoft,
    borderColor: COLORS.warningBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 10,
  },
  warningText: {
    color: COLORS.warningText,
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  count: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginBottom: 14,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', marginHorizontal: -4 },
});
