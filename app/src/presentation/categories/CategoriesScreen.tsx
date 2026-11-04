import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  CategoryDeleteResult,
  CategoryGateway,
  CategorySaveResult,
} from '../../business/categories/categoryManagement';
import type { Category } from '../../infrastructure/database/repositories/categoryRepository';
import type { UserSession } from '../../services/session/sessionManager';
import { ActionButton } from '../components/ActionButton';
import { MessageDialog } from '../components/MessageDialog';
import { COLORS } from '../components/theme';
import { CategoryFormSheet } from './CategoryFormSheet';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORY_TEXTS as TEXTS } from './categoryTexts';

type CategoriesScreenProps = {
  gateway: CategoryGateway;
  session: UserSession;
  onBack: () => void;
  onSessionExpired: () => void;
};

type FormState = { category: Category | null } | null;

function failureMessage(
  status:
    | Exclude<CategorySaveResult['status'], 'saved'>
    | Exclude<CategoryDeleteResult['status'], 'deleted'>,
  fallback: string,
): string {
  if (status === 'protected') {
    return TEXTS.messages.notEditable;
  }
  return status === 'not_found' ? TEXTS.messages.notFound : fallback;
}

function TypeBadge({ category }: { category: Category }) {
  const income = category.type === 'income';
  return (
    <View
      style={[styles.badge, income ? styles.badgeIncome : styles.badgeExpense]}
    >
      <Text
        style={[
          styles.badgeText,
          income ? styles.incomeText : styles.expenseText,
        ]}
      >
        {TEXTS.types[category.type]}
      </Text>
    </View>
  );
}

// Pantalla «Categorías» de HU8: categorías del sistema con candado (HU8-CA02) y categorías
// propias con «Editar» y «Eliminar» (HU8-CA06, HU8-CA07a, HU8-CA07b).
export function CategoriesScreen({
  gateway,
  session,
  onBack,
  onSessionExpired,
}: CategoriesScreenProps) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const result = await gateway.listActiveCategories(session);
    if (!mounted.current) {
      return;
    }
    if (result.status === 'ok') {
      setCategories(result.categories);
    } else if (result.status === 'session_expired') {
      onSessionExpired();
    } else {
      setCategories([]);
      setDialog(TEXTS.messages.loadFailed);
    }
  }, [gateway, session, onSessionExpired]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function confirmDelete() {
    if (toDelete === null || deleting) {
      return;
    }
    setDeleting(true);
    const result = await gateway.remove(session, toDelete.id);
    if (!mounted.current) {
      return;
    }
    setDeleting(false);
    setToDelete(null);
    if (result.status === 'session_expired') {
      onSessionExpired();
      return;
    }
    if (result.status !== 'deleted') {
      setDialog(failureMessage(result.status, TEXTS.messages.deleteFailed));
    }
    await reload();
  }

  const system = (categories ?? []).filter(category => category.isSystem);
  const own = (categories ?? []).filter(category => !category.isSystem);

  return (
    <View style={styles.screen} testID="categories-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="link"
          onPress={onBack}
          style={styles.back}
          testID="categories-back"
        >
          <Text style={styles.backText}>‹ {TEXTS.buttons.back}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          {TEXTS.screenTitle}
        </Text>
        <Text style={styles.subtitle}>{TEXTS.screenSubtitle}</Text>
        <View style={styles.newButton}>
          <ActionButton
            label={TEXTS.buttons.newCategory}
            onPress={() => setForm({ category: null })}
            testID="categories-new"
            variant="primary"
          />
        </View>
        {categories === null ? (
          <ActivityIndicator
            color={COLORS.primary}
            style={styles.loading}
            testID="categories-loading"
          />
        ) : (
          <>
            <Text accessibilityRole="header" style={styles.section}>
              {TEXTS.sections.system}
            </Text>
            {system.map(category => (
              <View
                key={category.id}
                style={styles.row}
                testID={`category-row-${category.id}`}
              >
                <CategoryIcon icon={category.icon} />
                <Text style={styles.name}>{category.name}</Text>
                <TypeBadge category={category} />
                <Text
                  accessibilityLabel={TEXTS.accessibility.locked}
                  style={styles.lock}
                  testID={`category-lock-${category.id}`}
                >
                  🔒
                </Text>
              </View>
            ))}
            <Text accessibilityRole="header" style={styles.section}>
              {TEXTS.sections.own}
            </Text>
            {own.length === 0 && (
              <Text style={styles.empty} testID="categories-empty">
                {TEXTS.emptyOwn}
              </Text>
            )}
            {own.map(category => (
              <View
                key={category.id}
                style={styles.row}
                testID={`category-row-${category.id}`}
              >
                <CategoryIcon icon={category.icon} />
                <Text style={styles.name}>{category.name}</Text>
                <TypeBadge category={category} />
                <Pressable
                  accessibilityLabel={TEXTS.accessibility.edit(category.name)}
                  accessibilityRole="button"
                  onPress={() => setForm({ category })}
                  style={[styles.action, styles.firstAction]}
                  testID={`category-edit-${category.id}`}
                >
                  <Text style={styles.actionGlyph}>✏️</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={TEXTS.accessibility.delete(category.name)}
                  accessibilityRole="button"
                  onPress={() => setToDelete(category)}
                  style={styles.action}
                  testID={`category-delete-${category.id}`}
                >
                  <Text style={styles.actionGlyph}>🗑️</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      {form !== null && (
        <CategoryFormSheet
          category={form.category}
          gateway={gateway}
          onCancel={() => setForm(null)}
          onFailure={status => {
            setForm(null);
            if (status === 'session_expired') {
              onSessionExpired();
              return;
            }
            setDialog(failureMessage(status, TEXTS.messages.saveFailed));
            reload();
          }}
          onSaved={() => {
            setForm(null);
            reload();
          }}
          session={session}
        />
      )}
      {toDelete !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.cancel,
              onPress: () => setToDelete(null),
              testID: 'category-delete-cancel',
              variant: 'secondary',
            },
            {
              label: TEXTS.buttons.confirm,
              onPress: () => {
                confirmDelete();
              },
              testID: 'category-delete-confirm',
            },
          ]}
          message={`${TEXTS.messages.deleteQuestion}\n\n«${toDelete.name}» · ${
            TEXTS.types[toDelete.type]
          }\n\n${TEXTS.messages.deleteWarning}`}
          onRequestClose={() => setToDelete(null)}
          testID="category-delete-dialog"
        />
      )}
      {dialog !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.accept,
              onPress: () => setDialog(null),
              testID: 'categories-dialog-accept',
            },
          ]}
          message={dialog}
          onRequestClose={() => setDialog(null)}
          testID="categories-dialog"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { color: COLORS.primary, fontSize: 16 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLORS.mutedText, fontSize: 15, marginTop: 2 },
  newButton: { flexDirection: 'row', marginHorizontal: -4, marginVertical: 16 },
  loading: { marginTop: 24 },
  section: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  name: { color: COLORS.text, flexShrink: 1, fontSize: 16, marginLeft: 10 },
  badge: { borderRadius: 6, marginLeft: 8, paddingHorizontal: 6 },
  badgeIncome: { backgroundColor: '#E3F4E8' },
  badgeExpense: { backgroundColor: '#FBE6E4' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  incomeText: { color: COLORS.success },
  expenseText: { color: COLORS.error },
  lock: { fontSize: 18, marginLeft: 'auto', paddingHorizontal: 8 },
  action: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  firstAction: { marginLeft: 'auto' },
  actionGlyph: { fontSize: 18 },
  empty: { color: COLORS.mutedText, fontSize: 15, marginBottom: 8 },
});
