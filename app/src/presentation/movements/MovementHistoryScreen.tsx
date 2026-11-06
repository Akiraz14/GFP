import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CategoryGateway } from '../../business/categories/categoryManagement';
import { formatDisplayDate, todayIso } from '../../business/dates/localDate';
import {
  filterInputFrom,
  hasActiveFilters,
  toMovementFilters,
  validateFilterInput,
  type MovementFilterErrors,
  type MovementFilterInput,
} from '../../business/movements/movementFilters';
import type { MovementGateway } from '../../business/movements/movementManagement';
import { formatMoney } from '../../business/money/money';
import type { Category } from '../../infrastructure/database/repositories/categoryRepository';
import {
  NO_MOVEMENT_FILTERS,
  type MovementFilters,
  type MovementListItem,
  type MovementTotals,
  type MovementType,
} from '../../infrastructure/database/repositories/movementRepository';
import type { UserSession } from '../../services/session/sessionManager';
import { CategoryIcon } from '../categories/CategoryIcon';
import { ActionButton } from '../components/ActionButton';
import { DateField } from '../components/DateField';
import { FormScrollView } from '../components/FormScrollView';
import { MessageDialog } from '../components/MessageDialog';
import { SelectField } from '../components/SelectField';
import { COLORS } from '../components/theme';
import { BalanceSummary } from './BalanceSummary';
import { HISTORY_TEXTS as TEXTS } from './historyTexts';

type MovementHistoryScreenProps = {
  movements: MovementGateway;
  categories: CategoryGateway;
  session: UserSession;
  // Filtros con los que abre al llegar desde Análisis (HU9) o Recomendaciones (HU10).
  initialFilters?: MovementFilters;
  onNewMovement: () => void;
  // HU7: «Movimiento con foto».
  onCaptureReceipt: () => void;
  // HU5-CA07: abre HU4 en modo edición.
  onEdit: (movementId: string) => void;
  onOpenCategories: () => void;
  onSessionExpired: () => void;
  now?: () => number;
};

const TYPE_OPTIONS: { value: '' | MovementType; label: string }[] = [
  { value: '', label: TEXTS.options.allTypes },
  { value: 'income', label: TEXTS.types.income },
  { value: 'expense', label: TEXTS.types.expense },
];

function filterMessages(errors: MovementFilterErrors) {
  return {
    from: errors.from ? TEXTS.errors.dateInvalid : null,
    to:
      errors.to === 'before_start'
        ? TEXTS.errors.toBeforeFrom
        : errors.to === 'invalid'
        ? TEXTS.errors.dateInvalid
        : null,
  };
}

function signedAmount(movement: MovementListItem): string {
  return `${movement.type === 'income' ? '+' : '-'}${formatMoney(
    movement.amountCents,
  )}`;
}

function MovementCard({
  movement,
  onEdit,
  onDelete,
}: {
  movement: MovementListItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const income = movement.type === 'income';
  const title = movement.description ?? movement.categoryName;
  return (
    <View style={styles.card} testID={`movement-row-${movement.id}`}>
      <View style={styles.cardTop}>
        <CategoryIcon icon={movement.categoryIcon} size={32} />
        <Text
          numberOfLines={1}
          style={[styles.chip, income ? styles.chipIncome : styles.chipExpense]}
        >
          {movement.categoryName.toLocaleUpperCase('es')}
        </Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          numberOfLines={1}
          style={[styles.amount, income ? styles.income : styles.expense]}
          testID={`movement-amount-${movement.id}`}
        >
          {signedAmount(movement)}
        </Text>
      </View>
      <Text
        numberOfLines={2}
        style={styles.cardTitle}
        testID={`movement-title-${movement.id}`}
      >
        {title}
      </Text>
      <Text style={styles.cardMeta}>
        {formatDisplayDate(movement.occurredOn)} •{' '}
        {income ? TEXTS.types.income : TEXTS.types.expense}
      </Text>
      <View style={styles.cardActions}>
        <Pressable
          accessibilityLabel={TEXTS.accessibility.edit(title)}
          accessibilityRole="button"
          onPress={onEdit}
          style={styles.cardAction}
          testID={`movement-edit-${movement.id}`}
        >
          <Text style={styles.editText}>✏️ {TEXTS.buttons.edit}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={TEXTS.accessibility.delete(title)}
          accessibilityRole="button"
          onPress={onDelete}
          style={styles.cardAction}
          testID={`movement-delete-${movement.id}`}
        >
          <Text style={styles.deleteText}>🗑️ {TEXTS.buttons.delete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Pantalla de HU5: historial de movimientos con filtros y eliminación.
export function MovementHistoryScreen({
  movements,
  categories,
  session,
  initialFilters = NO_MOVEMENT_FILTERS,
  onNewMovement,
  onCaptureReceipt,
  onEdit,
  onOpenCategories,
  onSessionExpired,
  now = Date.now,
}: MovementHistoryScreenProps) {
  const [draft, setDraft] = useState<MovementFilterInput>(() =>
    filterInputFrom(initialFilters),
  );
  const [applied, setApplied] = useState<MovementFilters>(initialFilters);
  const [totals, setTotals] = useState<MovementTotals | null>(null);
  const startFilters = useRef(initialFilters);
  const [errors, setErrors] = useState<MovementFilterErrors>({});
  const [items, setItems] = useState<MovementListItem[] | null>(null);
  const [options, setOptions] = useState<Category[]>([]);
  const [toDelete, setToDelete] = useState<MovementListItem | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const mounted = useRef(true);
  // La navegación crea la función en cada render; se guarda para no repetir la carga.
  const sessionExpired = useRef(onSessionExpired);
  sessionExpired.current = onSessionExpired;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (filters: MovementFilters) => {
      setItems(null);
      const result = await movements.list(session, filters);
      if (!mounted.current) {
        return;
      }
      if (result.status === 'session_expired') {
        sessionExpired.current();
        return;
      }
      if (result.status !== 'ok') {
        setItems([]);
        setDialog(TEXTS.messages.loadFailed);
        return;
      }
      setItems(result.movements);
      // HU6-CA01 y CA04: los totales se leen de la base con cada carga de la lista, también
      // al volver de crear o editar y después de eliminar.
      const summary = await movements.totals(session);
      if (mounted.current && summary.status === 'ok') {
        setTotals(summary.totals);
      }
    },
    [movements, session],
  );

  // HU5-CA02 y HU8-CA08: las categorías del filtro se consultan al abrir el historial.
  useEffect(() => {
    let active = true;
    categories.listActiveCategories(session).then(result => {
      if (!active || !mounted.current) {
        return;
      }
      if (result.status === 'session_expired') {
        sessionExpired.current();
      } else if (result.status === 'ok') {
        setOptions(result.categories);
      }
    });
    load(startFilters.current);
    return () => {
      active = false;
    };
  }, [categories, session, load]);

  function change(patch: Partial<MovementFilterInput>) {
    setDraft(previous => ({ ...previous, ...patch }));
  }

  // HU5-CA03: los filtros se aplican solo al pulsar «Filtrar».
  function filter() {
    const found = validateFilterInput(draft);
    setErrors(found);
    const filters = toMovementFilters(draft);
    if (filters === null) {
      return;
    }
    setDeleted(false);
    setApplied(filters);
    load(filters);
  }

  function clearFilters() {
    setDraft(filterInputFrom(NO_MOVEMENT_FILTERS));
    setErrors({});
    setDeleted(false);
    setApplied(NO_MOVEMENT_FILTERS);
    load(NO_MOVEMENT_FILTERS);
  }

  // HU5-CA06: borrado físico y lista actualizada con los filtros aplicados.
  async function confirmDelete() {
    if (toDelete === null || busy) {
      return;
    }
    setBusy(true);
    const result = await movements.remove(session, toDelete.id);
    if (!mounted.current) {
      return;
    }
    setBusy(false);
    setToDelete(null);
    if (result.status === 'session_expired') {
      onSessionExpired();
      return;
    }
    if (result.status === 'failed') {
      setDialog(TEXTS.messages.deleteFailed);
      return;
    }
    if (result.status === 'not_found') {
      setDialog(TEXTS.messages.notFound);
    } else {
      setDeleted(true);
    }
    load(applied);
  }

  const messages = filterMessages(errors);
  const today = todayIso(now());
  const filtered = hasActiveFilters(applied);

  return (
    <View style={styles.screen} testID="movement-history">
      <FormScrollView contentStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text accessibilityRole="header" style={styles.title}>
              {TEXTS.title}
            </Text>
            <Text style={styles.subtitle}>{TEXTS.subtitle}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenCategories}
            style={styles.categoriesLink}
            testID="open-categories"
          >
            <Text style={styles.categoriesText}>
              {TEXTS.buttons.categories}
            </Text>
          </Pressable>
        </View>
        <BalanceSummary totals={totals} />
        <Text style={styles.sectionTitle}>{TEXTS.filtersTitle}</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <DateField
              calendarLabel={TEXTS.accessibility.openCalendar}
              error={messages.from}
              label={TEXTS.labels.from}
              maximumDate={today}
              onChange={from => change({ from })}
              placeholder={TEXTS.placeholders.date}
              testID="history-from"
              value={draft.from}
            />
          </View>
          <View style={styles.half}>
            <DateField
              calendarLabel={TEXTS.accessibility.openCalendar}
              error={messages.to}
              label={TEXTS.labels.to}
              maximumDate={today}
              onChange={to => change({ to })}
              placeholder={TEXTS.placeholders.date}
              testID="history-to"
              value={draft.to}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <SelectField
              error={null}
              label={TEXTS.labels.type}
              onChange={type => change({ type: type as '' | MovementType })}
              options={TYPE_OPTIONS}
              placeholder={TEXTS.options.allTypes}
              testID="history-type"
              value={draft.type}
            />
          </View>
          <View style={styles.half}>
            <SelectField
              error={null}
              label={TEXTS.labels.category}
              onChange={categoryId => change({ categoryId })}
              options={[
                { value: '', label: TEXTS.options.allCategories },
                ...options.map(category => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
              placeholder={TEXTS.options.allCategories}
              testID="history-category"
              value={draft.categoryId}
            />
          </View>
        </View>
        <View style={styles.buttons}>
          <ActionButton
            label={TEXTS.buttons.clearFilters}
            onPress={clearFilters}
            testID="history-clear-filters"
          />
          <ActionButton
            label={TEXTS.buttons.filter}
            onPress={filter}
            testID="history-filter"
            variant="primary"
          />
        </View>
        {deleted && (
          <Text
            accessibilityRole="alert"
            style={styles.banner}
            testID="history-deleted"
          >
            ✓ {TEXTS.delete.done}
          </Text>
        )}
        <Text style={styles.sectionTitle}>{TEXTS.listTitle}</Text>
        {items === null ? (
          <ActivityIndicator
            color={COLORS.primary}
            style={styles.loading}
            testID="history-loading"
          />
        ) : items.length === 0 ? (
          <View style={styles.empty} testID="history-empty">
            <Text style={styles.emptyGlyph}>{filtered ? '🔍' : '📄'}</Text>
            <Text style={styles.emptyTitle}>
              {filtered
                ? TEXTS.empty.noResultsTitle
                : TEXTS.empty.noMovementsTitle}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filtered
                ? TEXTS.empty.noResultsSubtitle
                : TEXTS.empty.noMovementsSubtitle}
            </Text>
          </View>
        ) : (
          <View testID="history-list">
            {items.map(movement => (
              <MovementCard
                key={movement.id}
                movement={movement}
                onDelete={() => setToDelete(movement)}
                onEdit={() => onEdit(movement.id)}
              />
            ))}
          </View>
        )}
        <View style={styles.buttons}>
          <ActionButton
            label={TEXTS.buttons.newMovement}
            onPress={onNewMovement}
            testID="open-movement-form"
            variant="primary"
          />
        </View>
        <View style={styles.buttons}>
          <ActionButton
            label={TEXTS.buttons.receipt}
            onPress={onCaptureReceipt}
            testID="open-receipt-capture"
          />
        </View>
      </FormScrollView>
      {toDelete !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.cancel,
              onPress: () => setToDelete(null),
              testID: 'movement-delete-cancel',
              variant: 'secondary',
            },
            {
              label: TEXTS.buttons.confirm,
              onPress: () => {
                confirmDelete();
              },
              testID: 'movement-delete-confirm',
            },
          ]}
          message={`${TEXTS.delete.question}\n\n${TEXTS.delete.warning}`}
          onRequestClose={() => setToDelete(null)}
          testID="movement-delete-dialog"
        />
      )}
      {dialog !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.accept,
              onPress: () => setDialog(null),
              testID: 'history-dialog-accept',
            },
          ]}
          message={dialog}
          onRequestClose={() => setDialog(null)}
          testID="history-dialog"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 32 },
  header: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 16 },
  headerText: { flex: 1 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: COLORS.mutedText, fontSize: 15, marginTop: 2 },
  categoriesLink: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 12,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  categoriesText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  row: { flexDirection: 'row', marginHorizontal: -4 },
  half: { flex: 1, paddingHorizontal: 4 },
  buttons: { flexDirection: 'row', marginHorizontal: -4, marginVertical: 8 },
  banner: {
    backgroundColor: '#E3F4E8',
    borderRadius: 8,
    color: COLORS.success,
    fontSize: 15,
    marginVertical: 8,
    padding: 12,
  },
  loading: { marginTop: 24 },
  empty: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
  },
  emptyGlyph: { fontSize: 36 },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  chip: {
    borderRadius: 6,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipIncome: { backgroundColor: '#E3F4E8', color: COLORS.success },
  chipExpense: { backgroundColor: '#FBE6E4', color: COLORS.error },
  amount: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
    textAlign: 'right',
  },
  income: { color: COLORS.success },
  expense: { color: COLORS.error },
  // Task 30: the description reads as the card title (prototype) and long ones are cut.
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  cardMeta: { color: COLORS.mutedText, fontSize: 14, marginTop: 2 },
  cardActions: {
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 6,
  },
  cardAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  editText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  deleteText: { color: COLORS.error, fontSize: 15, fontWeight: '600' },
});
