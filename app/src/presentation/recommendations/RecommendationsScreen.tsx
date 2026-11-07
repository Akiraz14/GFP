import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  Recommendation,
  RecommendationRule,
} from '../../analysis/recommendations';
import type { RecommendationGateway } from '../../business/recommendations/recommendationService';
import type { MovementFilters } from '../../infrastructure/database/repositories/movementRepository';
import type { UserSession } from '../../services/session/sessionManager';
import { ActionButton } from '../components/ActionButton';
import { Icon, type IconName } from '../components/Icon';
import { MessageDialog } from '../components/MessageDialog';
import { COLORS } from '../components/theme';

const TEXTS = {
  title: 'Recomendaciones',
  subtitle: 'Sugerencias personalizadas para tus finanzas',
  section: 'Recomendaciones Automatizadas',
  empty: '¡Todo en orden! No hay recomendaciones o alertas por el momento.',
  viewMovements: 'Ver movimientos asociados',
  viewCurrentIncome: 'Ver ingresos de este mes',
  viewPreviousIncome: 'Ver ingresos del mes anterior',
  showOthers: (count: number) => `Ver otras categorías (${count})`,
  hideOthers: 'Ocultar otras categorías',
  openCategory: (name: string) => `Ver movimientos de ${name}`,
  dismiss: 'Descartar recomendación',
  disclaimer:
    'Las recomendaciones son generadas automáticamente con fines informativos basados en tus registros y no constituyen asesoramiento financiero profesional ni sobre productos de inversión o crédito.',
  loadFailed: 'No fue posible cargar las recomendaciones. Intenta de nuevo',
  dismissFailed: 'No fue posible descartar la recomendación. Intenta de nuevo',
  accept: 'Aceptar',
} as const;

const WARNING_COLOR = '#E08A1E';

// Ícono y color de cada regla: se aplican al ícono y al borde de severidad de la tarjeta.
export const RULE_APPEARANCE: Readonly<
  Record<RecommendationRule, { icon: IconName; color: string }>
> = {
  R1: { icon: 'activity', color: COLORS.error },
  R2: { icon: 'flame', color: COLORS.error },
  R3: { icon: 'trendingUp', color: COLORS.error },
  R4: { icon: 'trendingDown', color: COLORS.success },
  R5: { icon: 'award', color: COLORS.success },
  R6: { icon: 'clock', color: WARNING_COLOR },
  R7: { icon: 'arrowDownLeft', color: WARNING_COLOR },
  R8: { icon: 'info', color: WARNING_COLOR },
  SAVINGS: { icon: 'lightbulb', color: COLORS.success },
};

type RecommendationsScreenProps = {
  gateway: RecommendationGateway;
  session: UserSession;
  onOpenHistory: (filters: MovementFilters) => void;
  onSessionExpired: () => void;
};

// Historial filtrado de una recomendación (HU10): período, tipo y categoría de la regla. R1 y
// R8 muestran ingresos y gastos del período; R6 los gastos; R7 los ingresos.
export function historyFiltersOf(
  item: Recommendation,
  range = item.range,
  categoryId = item.categoryId,
): MovementFilters {
  return {
    from: range.from,
    to: range.to,
    type: item.movementType,
    categoryId,
  };
}

// Pantalla de HU10, adaptada de daniela888-li/GFP (4c7cd2f). Las reglas leen el mes actual y el
// anterior de la base local. «Descartar» oculta la tarjeta durante la sesión actual (AJ-05).
export function RecommendationsScreen({
  gateway,
  session,
  onOpenHistory,
  onSessionExpired,
}: RecommendationsScreenProps) {
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const mounted = useRef(true);
  const sessionExpired = useRef(onSessionExpired);
  sessionExpired.current = onSessionExpired;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    async function load() {
      const result = await gateway.list(session);
      if (!mounted.current) {
        return;
      }
      if (result.status === 'ok') {
        setItems(result.recommendations);
      } else if (result.status === 'session_expired') {
        sessionExpired.current();
      } else {
        setItems([]);
        setDialog(TEXTS.loadFailed);
      }
    }
    load();
  }, [gateway, session]);

  async function dismiss(item: Recommendation) {
    const result = await gateway.dismiss(session, item.id);
    if (!mounted.current) {
      return;
    }
    if (result.status === 'dismissed') {
      setItems(current =>
        (current ?? []).filter(other => other.id !== item.id),
      );
    } else if (result.status === 'session_expired') {
      sessionExpired.current();
    } else {
      setDialog(TEXTS.dismissFailed);
    }
  }

  return (
    <View style={styles.screen} testID="recommendations-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {TEXTS.title}
        </Text>
        <Text style={styles.subtitle}>{TEXTS.subtitle}</Text>
        {items === null && (
          <ActivityIndicator
            color={COLORS.primary}
            testID="recommendations-loading"
          />
        )}
        {items !== null && items.length === 0 && (
          <View style={styles.empty} testID="recommendations-empty">
            <Text style={styles.emptyGlyph}>✨</Text>
            <Text style={styles.emptyText}>{TEXTS.empty}</Text>
          </View>
        )}
        {items !== null && items.length > 0 && (
          <View style={styles.sectionRow}>
            <Icon
              color={COLORS.primary}
              name="sparkles"
              size={20}
              testID="recommendations-section-icon"
            />
            <Text
              accessibilityRole="header"
              style={[styles.section, styles.sectionText]}
            >
              {TEXTS.section}
            </Text>
          </View>
        )}
        {(items ?? []).map(item => {
          const appearance = RULE_APPEARANCE[item.rule];
          const open = expanded === item.id;
          return (
            <View
              key={item.id}
              style={[styles.card, { borderLeftColor: appearance.color }]}
              testID={`recommendation-${item.id}`}
            >
              <View style={styles.cardHeader}>
                <View
                  style={styles.glyph}
                  testID={`recommendation-icon-${item.id}`}
                >
                  <Icon
                    color={appearance.color}
                    name={appearance.icon}
                    size={22}
                  />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Pressable
                  accessibilityLabel={`${TEXTS.dismiss}: ${item.title}`}
                  accessibilityRole="button"
                  onPress={() => {
                    dismiss(item);
                  }}
                  style={styles.dismiss}
                  testID={`recommendation-dismiss-${item.id}`}
                >
                  <Text style={styles.dismissText}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.source}>{item.source}</Text>
              <View style={styles.action}>
                <ActionButton
                  label={
                    item.previousRange === null
                      ? TEXTS.viewMovements
                      : TEXTS.viewCurrentIncome
                  }
                  onPress={() => onOpenHistory(historyFiltersOf(item))}
                  testID={`recommendation-open-${item.id}`}
                  variant="primary"
                />
              </View>
              {item.previousRange !== null && (
                <View style={styles.action}>
                  <ActionButton
                    label={TEXTS.viewPreviousIncome}
                    onPress={() => {
                      if (item.previousRange !== null) {
                        onOpenHistory(
                          historyFiltersOf(item, item.previousRange),
                        );
                      }
                    }}
                    testID={`recommendation-open-previous-${item.id}`}
                    variant="secondary"
                  />
                </View>
              )}
              {item.relatedCategories.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => setExpanded(open ? null : item.id)}
                  style={styles.othersToggle}
                  testID={`recommendation-others-${item.id}`}
                >
                  <Text style={styles.othersToggleText}>
                    {open
                      ? TEXTS.hideOthers
                      : TEXTS.showOthers(item.relatedCategories.length)}
                  </Text>
                </Pressable>
              )}
              {open &&
                item.relatedCategories.map(related => (
                  <Pressable
                    accessibilityLabel={TEXTS.openCategory(related.name)}
                    accessibilityRole="button"
                    key={related.categoryId}
                    onPress={() =>
                      onOpenHistory(
                        historyFiltersOf(item, item.range, related.categoryId),
                      )
                    }
                    style={styles.related}
                    testID={`recommendation-related-${item.id}-${related.categoryId}`}
                  >
                    <Text style={styles.relatedName}>{related.name}</Text>
                    <Text style={styles.relatedDetail}>{related.detail}</Text>
                  </Pressable>
                ))}
            </View>
          );
        })}
        <Text style={styles.disclaimer} testID="recommendations-disclaimer">
          {TEXTS.disclaimer}
        </Text>
      </ScrollView>
      {dialog !== null && (
        <MessageDialog
          actions={[{ label: TEXTS.accept, onPress: () => setDialog(null) }]}
          message={dialog}
          onRequestClose={() => setDialog(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 16,
  },
  sectionText: { marginBottom: 0, marginLeft: 8, marginTop: 0 },
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 20 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: COLORS.mutedText, fontSize: 15, marginTop: 4 },
  section: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyGlyph: { fontSize: 40, marginBottom: 10 },
  emptyText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row' },
  glyph: { marginRight: 8 },
  cardTitle: { color: COLORS.text, flex: 1, fontSize: 16, fontWeight: '700' },
  dismiss: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  dismissText: { color: COLORS.mutedText, fontSize: 18 },
  description: { color: COLORS.text, fontSize: 14, marginTop: 4 },
  source: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginTop: 8 },
  action: { flexDirection: 'row', marginTop: 10 },
  othersToggle: { justifyContent: 'center', marginTop: 6, minHeight: 44 },
  othersToggleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  related: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  relatedName: { color: COLORS.text, flex: 1, fontSize: 14 },
  relatedDetail: { color: COLORS.mutedText, fontSize: 14 },
  disclaimer: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
