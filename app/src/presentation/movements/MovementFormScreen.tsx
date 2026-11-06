import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CategoryGateway } from '../../business/categories/categoryManagement';
import {
  formatDisplayDate,
  todayIso,
  type IsoDate,
} from '../../business/dates/localDate';
import type {
  MovementGateway,
  MovementSaveResult,
} from '../../business/movements/movementManagement';
import {
  DESCRIPTION_MAX_LENGTH,
  MOVEMENT_TYPES,
  categoriesForType,
  isCategoryAllowed,
  validateMovementInput,
  type MovementFieldErrors,
  type MovementInput,
} from '../../business/movements/movementRules';
import {
  amountInputFromCents,
  formatMoney,
  maskAmountInput,
} from '../../business/money/money';
import type { Category } from '../../infrastructure/database/repositories/categoryRepository';
import type {
  Movement,
  MovementType,
} from '../../infrastructure/database/repositories/movementRepository';
import type { UserSession } from '../../services/session/sessionManager';
import { ActionButton } from '../components/ActionButton';
import { DateField } from '../components/DateField';
import { FormScrollView } from '../components/FormScrollView';
import { MessageDialog } from '../components/MessageDialog';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { COLORS } from '../components/theme';
import { MOVEMENT_TEXTS as TEXTS } from './movementTexts';

// Datos leídos de un comprobante (HU7-CA07 a CA09): el tipo queda en Gasto y lo que el OCR no
// identificó va vacío. Nada se guarda hasta que el usuario pulse «Guardar movimiento».
export type MovementPrefill = {
  amount: string;
  date: string;
  description: string;
};

export type MovementFormMode =
  | { mode: 'create'; prefill?: MovementPrefill }
  | { mode: 'edit'; movementId: string };

type MovementFormScreenProps = {
  movements: MovementGateway;
  categories: CategoryGateway;
  session: UserSession;
  params: MovementFormMode;
  // Cancelar, Atrás y «Volver al historial» regresan al historial (HU4-CA12, E07-D3).
  onDone: () => void;
  onSessionExpired: () => void;
  now?: () => number;
};

// Tipo preseleccionado del formulario nuevo (E07-D2).
const DEFAULT_TYPE: MovementType = 'expense';

function emptyInput(today: IsoDate): MovementInput {
  return {
    type: DEFAULT_TYPE,
    amount: '',
    date: formatDisplayDate(today),
    categoryId: '',
    description: '',
  };
}

function inputFromMovement(movement: Movement): MovementInput {
  return {
    type: movement.type,
    amount: amountInputFromCents(movement.amountCents),
    date: formatDisplayDate(movement.occurredOn),
    categoryId: movement.categoryId,
    description: movement.description ?? '',
  };
}

function fieldMessages(errors: MovementFieldErrors) {
  const date =
    errors.date === 'future'
      ? TEXTS.errors.dateFuture
      : errors.date === 'invalid'
      ? TEXTS.errors.dateInvalid
      : errors.date === 'required'
      ? TEXTS.errors.dateRequired
      : null;
  const category =
    errors.categoryId === 'incompatible'
      ? TEXTS.errors.categoryIncompatible
      : errors.categoryId === 'required'
      ? TEXTS.errors.categoryRequired
      : null;
  return {
    type: errors.type ? TEXTS.errors.typeRequired : null,
    amount: errors.amount ? TEXTS.errors.amountInvalid : null,
    date,
    category,
    description: errors.description ? TEXTS.errors.descriptionTooLong : null,
  };
}

type Saved = { movement: Movement; categoryName: string };

function TypeIndicator({ type }: { type: MovementType }) {
  const income = type === 'income';
  return (
    <View
      accessibilityLabel={TEXTS.accessibility.typeIndicator(type)}
      style={[
        styles.indicator,
        income ? styles.indicatorIncome : styles.indicatorExpense,
      ]}
      testID={`movement-type-indicator-${type}`}
    >
      <Text
        style={[styles.indicatorGlyph, income ? styles.income : styles.expense]}
      >
        {income ? '↑' : '↓'}
      </Text>
    </View>
  );
}

// Pantalla de HU4: registro (y edición) de un movimiento.
export function MovementFormScreen({
  movements,
  categories,
  session,
  params,
  onDone,
  onSessionExpired,
  now = Date.now,
}: MovementFormScreenProps) {
  const editing = params.mode === 'edit';
  const today = todayIso(now());
  const [input, setInput] = useState<MovementInput>(() =>
    params.mode === 'create' && params.prefill !== undefined
      ? {
          ...emptyInput(today),
          ...params.prefill,
          amount: maskAmountInput(params.prefill.amount),
          type: 'expense',
        }
      : emptyInput(today),
  );
  // Aviso de HU7 cuando el comprobante no se leyó completo (adaptado de daniela888-li/GFP).
  const [prefillNote, setPrefillNote] = useState(
    params.mode === 'create' &&
      params.prefill !== undefined &&
      Object.values(params.prefill).some(value => value === ''),
  );
  const [original, setOriginal] = useState<Movement | null>(null);
  const [options, setOptions] = useState<Category[] | null>(null);
  const [errors, setErrors] = useState<MovementFieldErrors>({});
  const [banner, setBanner] = useState<'error' | 'updated' | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [dialog, setDialog] = useState<{
    message: string;
    leave: boolean;
  } | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // HU4-CA02 y HU8-CA08: las categorías se consultan al abrir el formulario, sin caché.
  const load = useCallback(async () => {
    const listed = await categories.listActiveCategories(session);
    if (!mounted.current) {
      return;
    }
    if (listed.status === 'session_expired') {
      onSessionExpired();
      return;
    }
    if (listed.status !== 'ok') {
      setOptions([]);
      setDialog({ message: TEXTS.messages.loadFailed, leave: true });
      return;
    }
    if (params.mode === 'edit') {
      const found = await movements.get(session, params.movementId);
      if (!mounted.current) {
        return;
      }
      if (found.status === 'session_expired') {
        onSessionExpired();
        return;
      }
      if (found.status !== 'ok') {
        setOptions([]);
        setDialog({
          message:
            found.status === 'not_found'
              ? TEXTS.messages.notFound
              : TEXTS.messages.loadFailed,
          leave: true,
        });
        return;
      }
      // HU4-CA10: el modo edición carga todos los datos registrados.
      setOriginal(found.movement);
      setInput(inputFromMovement(found.movement));
    }
    setOptions(listed.categories);
  }, [categories, movements, session, params, onSessionExpired]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onDone();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onDone]);

  const currentCategoryId = original?.categoryId ?? null;
  const type = input.type as MovementType;
  const available = useMemo(
    () => categoriesForType(options ?? [], type, currentCategoryId),
    [options, type, currentCategoryId],
  );
  const messages = fieldMessages(errors);
  const descriptionLength = Array.from(input.description.trim()).length;

  function change(patch: Partial<MovementInput>) {
    setInput(previous => ({ ...previous, ...patch }));
    setBanner(previous => (previous === 'updated' ? null : previous));
  }

  // D-02: al cambiar el tipo se borra la categoría que deje de ser compatible.
  function changeType(next: MovementType) {
    const selected = (options ?? []).find(
      category => category.id === input.categoryId,
    );
    const keep =
      selected !== undefined &&
      isCategoryAllowed(selected, next, currentCategoryId);
    change({ type: next, categoryId: keep ? input.categoryId : '' });
    setErrors(previous => ({ ...previous, type: undefined }));
  }

  // HU4-CA11: «Limpiar» vuelve a los valores iniciales del formulario nuevo.
  function clear() {
    setPrefillNote(false);
    setInput(emptyInput(todayIso(now())));
    setErrors({});
    setBanner(null);
  }

  function handleFailure(
    result: Exclude<MovementSaveResult, { status: 'saved' }>,
  ) {
    if (result.status === 'session_expired') {
      onSessionExpired();
    } else if (result.status === 'invalid_input') {
      setErrors(result.errors);
      setBanner('error');
    } else if (result.status === 'not_found') {
      setDialog({ message: TEXTS.messages.notFound, leave: true });
    } else {
      setDialog({ message: TEXTS.messages.saveFailed, leave: false });
    }
  }

  async function save() {
    if (busy) {
      return;
    }
    // HU4-CA01, CA04, CA05, CA06 y CA13: se valida antes de escribir.
    const found = validateMovementInput(input, todayIso(now()));
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setBanner('error');
      return;
    }
    setBusy(true);
    const result =
      params.mode === 'edit'
        ? await movements.update(session, params.movementId, input)
        : await movements.create(session, input);
    if (!mounted.current) {
      return;
    }
    setBusy(false);
    if (result.status !== 'saved') {
      handleFailure(result);
      return;
    }
    setErrors({});
    if (params.mode === 'edit') {
      // HU4-CA08 (edición): mensaje de actualización en el mismo formulario.
      setOriginal(result.movement);
      setInput(inputFromMovement(result.movement));
      setBanner('updated');
      return;
    }
    // HU4-CA08 y CA09: confirmación y formulario limpio (E07-D4, I-03).
    const categoryName =
      (options ?? []).find(
        category => category.id === result.movement.categoryId,
      )?.name ?? '';
    setInput(emptyInput(todayIso(now())));
    setBanner(null);
    setSaved({ movement: result.movement, categoryName });
  }

  if (saved !== null) {
    const { movement, categoryName } = saved;
    return (
      <View style={styles.screen} testID="movement-success">
        <FormScrollView contentStyle={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.successGlyph}>✓</Text>
          </View>
          <Text accessibilityRole="header" style={styles.successTitle}>
            {TEXTS.success.title}
          </Text>
          <Text accessibilityRole="alert" style={styles.successMessage}>
            {TEXTS.success.created}
          </Text>
          <View style={styles.summary} testID="movement-success-summary">
            <Text
              style={[
                styles.summaryAmount,
                movement.type === 'income' ? styles.income : styles.expense,
              ]}
            >
              {formatMoney(movement.amountCents)}
            </Text>
            <Text style={styles.summaryLine}>
              {TEXTS.types[movement.type]} · {categoryName}
            </Text>
            <Text style={styles.summaryLine}>
              {formatDisplayDate(movement.occurredOn)}
            </Text>
            {movement.description !== null && (
              <Text style={styles.summaryLine}>{movement.description}</Text>
            )}
          </View>
          <View style={styles.buttons}>
            <ActionButton
              label={TEXTS.buttons.backToHistory}
              onPress={onDone}
              testID="movement-success-back"
              variant="primary"
            />
          </View>
        </FormScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="movement-form">
      <FormScrollView contentStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text accessibilityRole="header" style={styles.title}>
              {editing ? TEXTS.editTitle : TEXTS.createTitle}
            </Text>
            <Text style={styles.subtitle}>
              {editing ? TEXTS.editSubtitle : TEXTS.createSubtitle}
            </Text>
          </View>
          <TypeIndicator type={type} />
        </View>
        {prefillNote && (
          <Text
            accessibilityRole="alert"
            style={[styles.banner, styles.bannerNotice]}
            testID="movement-prefill-note"
          >
            {TEXTS.prefill.partial}
          </Text>
        )}
        {banner === 'error' && (
          <Text
            accessibilityRole="alert"
            style={[styles.banner, styles.bannerError]}
            testID="movement-form-error"
          >
            {TEXTS.errors.form}
          </Text>
        )}
        {banner === 'updated' && (
          <Text
            accessibilityRole="alert"
            style={[styles.banner, styles.bannerSuccess]}
            testID="movement-form-updated"
          >
            {TEXTS.success.updated}
          </Text>
        )}
        {options === null ? (
          <ActivityIndicator
            color={COLORS.primary}
            style={styles.loading}
            testID="movement-form-loading"
          />
        ) : (
          <>
            <Text style={styles.label}>{TEXTS.labels.type}</Text>
            <View accessibilityRole="radiogroup" style={styles.segment}>
              {MOVEMENT_TYPES.map(option => {
                const selected = option === type;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: busy }}
                    disabled={busy}
                    key={option}
                    onPress={() => changeType(option)}
                    style={[
                      styles.segmentOption,
                      selected && styles.segmentSelected,
                    ]}
                    testID={`movement-type-${option}`}
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
            <TextField
              editable={!busy}
              error={messages.amount}
              helper={
                <Text style={styles.counter} testID="movement-amount-help">
                  {TEXTS.amountHelp}
                </Text>
              }
              keyboardType="number-pad"
              label={TEXTS.labels.amount}
              onChangeText={amount =>
                change({ amount: maskAmountInput(amount) })
              }
              placeholder={TEXTS.placeholders.amount}
              selection={{
                start: input.amount.length,
                end: input.amount.length,
              }}
              testID="movement-amount"
              value={input.amount}
            />
            <DateField
              calendarLabel={TEXTS.accessibility.openCalendar}
              disabled={busy}
              error={messages.date}
              label={TEXTS.labels.date}
              maximumDate={today}
              onChange={date => change({ date })}
              placeholder={TEXTS.placeholders.date}
              testID="movement-date"
              value={input.date}
            />
            <SelectField
              disabled={busy}
              error={messages.category}
              label={TEXTS.labels.category}
              onChange={categoryId => change({ categoryId })}
              options={available.map(category => ({
                value: category.id,
                label: category.name,
              }))}
              placeholder={TEXTS.placeholders.category}
              testID="movement-category"
              value={input.categoryId}
            />
            <TextField
              editable={!busy}
              error={messages.description}
              helper={
                <Text
                  style={[
                    styles.counter,
                    descriptionLength > DESCRIPTION_MAX_LENGTH &&
                      styles.counterOver,
                  ]}
                  testID="movement-description-counter"
                >
                  {TEXTS.descriptionCounter(
                    descriptionLength,
                    DESCRIPTION_MAX_LENGTH,
                  )}
                </Text>
              }
              label={TEXTS.labels.description}
              multiline
              onChangeText={description => change({ description })}
              placeholder={TEXTS.placeholders.description}
              testID="movement-description"
              value={input.description}
            />
            <View style={styles.buttons}>
              <ActionButton
                disabled={busy}
                label={editing ? TEXTS.buttons.update : TEXTS.buttons.save}
                onPress={() => {
                  save();
                }}
                testID="movement-save"
                variant="primary"
              />
            </View>
            <View style={styles.buttons}>
              {!editing && (
                <ActionButton
                  disabled={busy}
                  label={TEXTS.buttons.clear}
                  onPress={clear}
                  testID="movement-clear"
                />
              )}
              <ActionButton
                disabled={busy}
                label={TEXTS.buttons.cancel}
                onPress={onDone}
                testID="movement-cancel"
              />
            </View>
          </>
        )}
      </FormScrollView>
      {dialog !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.accept,
              onPress: () => {
                const leave = dialog.leave;
                setDialog(null);
                if (leave) {
                  onDone();
                }
              },
              testID: 'movement-dialog-accept',
            },
          ]}
          message={dialog.message}
          onRequestClose={() => setDialog(null)}
          testID="movement-dialog"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 16 },
  headerText: { flex: 1 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: COLORS.mutedText, fontSize: 15, marginTop: 2 },
  indicator: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginLeft: 12,
    width: 48,
  },
  indicatorIncome: { backgroundColor: '#E3F4E8' },
  indicatorExpense: { backgroundColor: '#FBE6E4' },
  indicatorGlyph: { fontSize: 24, fontWeight: '700' },
  banner: {
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 14,
    padding: 12,
  },
  bannerError: { backgroundColor: '#FBE6E4', color: COLORS.error },
  bannerNotice: { backgroundColor: '#FFF4CE', color: COLORS.text },
  bannerSuccess: { backgroundColor: '#E3F4E8', color: COLORS.success },
  loading: { marginTop: 24 },
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
    justifyContent: 'center',
    minHeight: 44,
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
  counter: {
    alignSelf: 'flex-end',
    color: COLORS.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  counterOver: { color: COLORS.error },
  buttons: { flexDirection: 'row', marginHorizontal: -4, marginTop: 12 },
  successIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#E3F4E8',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginTop: 24,
    width: 80,
  },
  successGlyph: { color: COLORS.success, fontSize: 40, fontWeight: '700' },
  successTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  successMessage: {
    color: COLORS.mutedText,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  summary: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    padding: 16,
  },
  summaryAmount: { fontSize: 26, fontWeight: '700' },
  summaryLine: { color: COLORS.text, fontSize: 15, marginTop: 6 },
});
