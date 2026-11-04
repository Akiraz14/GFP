import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  CategoryGateway,
  CategorySaveResult,
} from '../../business/categories/categoryManagement';
import {
  CATEGORY_NAME_MAX_LENGTH,
  normalizeCategoryName,
  validateCategoryInput,
  type CategoryFieldErrors,
} from '../../business/categories/categoryRules';
import {
  CATEGORY_ICON_IDS,
  CATEGORY_TYPES,
  type CategoryIconId,
  type CategoryType,
} from '../../infrastructure/database/categoryCatalogs';
import type { Category } from '../../infrastructure/database/repositories/categoryRepository';
import type { UserSession } from '../../services/session/sessionManager';
import { ActionButton } from '../components/ActionButton';
import { FieldError } from '../components/FieldError';
import { TextField } from '../components/TextField';
import { COLORS } from '../components/theme';
import { CATEGORY_ICON_GLYPHS, CategoryIcon } from './CategoryIcon';
import { CATEGORY_TEXTS as TEXTS } from './categoryTexts';

type CategoryFormSheetProps = {
  gateway: CategoryGateway;
  session: UserSession;
  // Categoría que se edita; null para crear una nueva.
  category: Category | null;
  onSaved: (category: Category) => void;
  onCancel: () => void;
  // Resultados que no son errores de campo: sesión vencida, protegida, inexistente o fallo.
  onFailure: (result: Exclude<CategorySaveResult['status'], 'saved'>) => void;
};

function nameMessage(
  errors: CategoryFieldErrors,
  duplicate: boolean,
): string | null {
  if (duplicate) {
    return TEXTS.messages.duplicate;
  }
  if (errors.name === 'required') {
    return TEXTS.messages.nameRequired;
  }
  return errors.name === 'too_long'
    ? TEXTS.messages.nameTooLong(CATEGORY_NAME_MAX_LENGTH)
    : null;
}

export function CategoryFormSheet({
  gateway,
  session,
  category,
  onSaved,
  onCancel,
  onFailure,
}: CategoryFormSheetProps) {
  const editing = category !== null;
  const [name, setName] = useState(category?.name ?? '');
  // El prototipo muestra «Gasto» seleccionado al crear.
  const [type, setType] = useState<CategoryType>(category?.type ?? 'expense');
  const [icon, setIcon] = useState<CategoryIconId | null>(
    category?.icon ?? null,
  );
  const [errors, setErrors] = useState<CategoryFieldErrors>({});
  const [duplicate, setDuplicate] = useState(false);
  const [busy, setBusy] = useState(false);
  const check = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Comprobación del nombre mientras se escribe (prototipo, E06-D6). Solo cuenta la
  // respuesta de la última comprobación.
  function handleNameChange(value: string) {
    setName(value);
    setErrors(current => ({ ...current, name: undefined }));
    setDuplicate(false);
    const ticket = ++check.current;
    if (normalizeCategoryName(value).length === 0) {
      return;
    }
    gateway.checkName(session, value, category?.id).then(result => {
      if (mounted.current && ticket === check.current) {
        setDuplicate(result.status === 'taken');
      }
    });
  }

  async function handleSave() {
    if (busy) {
      return;
    }
    const input = { name, type, icon: icon ?? '' };
    const localErrors = validateCategoryInput(input);
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      return;
    }
    setBusy(true);
    const result =
      category !== null
        ? await gateway.update(session, category.id, input)
        : await gateway.create(session, input);
    if (!mounted.current) {
      return;
    }
    setBusy(false);
    if (result.status === 'saved') {
      onSaved(result.category);
    } else if (result.status === 'duplicate_name') {
      setDuplicate(true);
    } else if (result.status === 'invalid_input') {
      setErrors(result.errors);
    } else {
      onFailure(result.status);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible>
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <View style={styles.sheet} testID="category-form">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={styles.title}>
              {editing ? TEXTS.form.editTitle : TEXTS.form.createTitle}
            </Text>
            <Text style={styles.subtitle}>{TEXTS.form.subtitle}</Text>
            <TextField
              autoCapitalize="sentences"
              editable={!busy}
              error={nameMessage(errors, duplicate)}
              label={TEXTS.form.nameLabel}
              maxLength={CATEGORY_NAME_MAX_LENGTH + 10}
              onChangeText={handleNameChange}
              placeholder={TEXTS.form.namePlaceholder}
              testID="category-name"
              value={name}
            />
            <Text style={styles.label}>{TEXTS.form.typeLabel}</Text>
            <View accessibilityRole="radiogroup" style={styles.segment}>
              {CATEGORY_TYPES.map(option => {
                const selected = option === type;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: busy }}
                    disabled={busy}
                    key={option}
                    onPress={() => setType(option)}
                    style={[
                      styles.segmentOption,
                      selected && styles.segmentSelected,
                    ]}
                    testID={`category-type-${option}`}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        option === 'income' ? styles.income : styles.expense,
                        selected && styles.segmentTextSelected,
                      ]}
                    >
                      {TEXTS.types[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>{TEXTS.form.iconLabel}</Text>
            <View style={styles.icons}>
              {CATEGORY_ICON_IDS.map(option => {
                const selected = option === icon;
                return (
                  <Pressable
                    accessibilityLabel={TEXTS.accessibility.icon(
                      CATEGORY_ICON_GLYPHS[option].label,
                    )}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: busy }}
                    disabled={busy}
                    key={option}
                    onPress={() => {
                      setIcon(option);
                      setErrors(current => ({ ...current, icon: undefined }));
                    }}
                    style={[styles.iconOption, selected && styles.iconSelected]}
                    testID={`category-icon-${option}`}
                  >
                    <CategoryIcon icon={option} size={40} />
                  </Pressable>
                );
              })}
            </View>
            <FieldError
              message={
                errors.icon !== undefined ? TEXTS.messages.iconRequired : null
              }
              testID="category-icon-error"
            />
            <View style={styles.buttons}>
              <ActionButton
                disabled={busy}
                label={TEXTS.buttons.cancel}
                onPress={onCancel}
                testID="category-cancel"
              />
              <ActionButton
                disabled={busy || duplicate}
                label={TEXTS.buttons.save}
                onPress={() => {
                  handleSave();
                }}
                testID="category-save"
                variant="primary"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: COLORS.mutedText, fontSize: 15, marginBottom: 16 },
  label: { color: COLORS.text, fontSize: 15, marginBottom: 6 },
  segment: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 4,
  },
  segmentOption: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  segmentText: { fontSize: 16 },
  segmentTextSelected: { fontWeight: '700' },
  income: { color: COLORS.success },
  expense: { color: COLORS.error },
  icons: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  iconOption: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 26,
    borderWidth: 2,
    height: 52,
    justifyContent: 'center',
    margin: 4,
    width: 52,
  },
  iconSelected: { borderColor: COLORS.primary },
  buttons: { flexDirection: 'row', marginHorizontal: -4, marginTop: 20 },
});
