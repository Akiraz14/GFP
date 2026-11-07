// Adaptado de daniela888-li/GFP (8bfa533, 4c7cd2f) a las API del repositorio canónico.
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { processColor } from 'react-native';
import {
  evaluateRecommendations,
  type Recommendation,
} from '../../src/analysis/recommendations';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import { RecommendationService } from '../../src/business/recommendations/recommendationService';
import { AnalysisScreen } from '../../src/presentation/analysis/AnalysisScreen';
import { RecommendationsScreen } from '../../src/presentation/recommendations/RecommendationsScreen';
import { SessionManager } from '../../src/services/session/sessionManager';
import { item } from '../../testing/movementFixtures';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const NOW = new Date(2026, 10, 15, 12).getTime();

async function setup(movements: string[][]) {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  const service = new MovementManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
    now: () => NOW,
  });
  const recommendations = new RecommendationService({
    database,
    sessions,
    now: () => NOW,
  });
  const session = sessions.start(userId);
  for (const [type, amount, date, categoryId] of movements) {
    await service.create(session, {
      type,
      amount,
      date,
      categoryId,
      description: '',
    });
  }
  return {
    database,
    service,
    recommendations,
    sessions,
    session,
    onOpenHistory: jest.fn(),
  };
}

const DATA = [
  ['income', '1000', '02/11/2026', 'salary'],
  ['expense', '750', '03/11/2026', 'housing'],
  ['expense', '250', '04/11/2026', 'food'],
  ['expense', '999', '03/10/2026', 'food'],
];

describe('HU9 screen', () => {
  async function renderAnalysis(movements = DATA) {
    const context = await setup(movements);
    await render(
      <AnalysisScreen
        gateway={context.service}
        now={() => NOW}
        onNewMovement={jest.fn()}
        onOpenHistory={context.onOpenHistory}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    return context;
  }

  test('shows the literal empty state and hides the charts', async () => {
    await renderAnalysis([]);
    expect(
      await screen.findByText(
        'No hay suficientes movimientos registrados para generar el análisis financiero de este período',
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId('analysis-categories')).toBeNull();
  });

  test('calculates the KPIs of the current month', async () => {
    await renderAnalysis();
    expect(await screen.findByTestId('analysis-income')).toHaveTextContent(
      '$1.000,00',
    );
    expect(screen.getByTestId('analysis-expense')).toHaveTextContent(
      '$1.000,00',
    );
    expect(screen.getByTestId('analysis-balance')).toHaveTextContent('$0,00');
  });

  test('changing the period updates every total', async () => {
    await renderAnalysis();
    await screen.findByTestId('analysis-income');
    await fireEvent.press(screen.getByTestId('analysis-period-quarter'));
    await waitFor(() =>
      expect(screen.getByTestId('analysis-expense')).toHaveTextContent(
        '$1.999,00',
      ),
    );
  });

  test('a category shows its amount and opens the filtered history', async () => {
    const { onOpenHistory } = await renderAnalysis();
    await fireEvent.press(await screen.findByTestId('analysis-share-housing'));
    expect(screen.getByTestId('analysis-donut')).toBeTruthy();
    expect(screen.getByTestId('analysis-selected')).toHaveTextContent(
      /\$750,00/,
    );
    await fireEvent.press(screen.getByTestId('analysis-view-movements'));
    expect(onOpenHistory).toHaveBeenCalledWith({
      from: '2026-11-01',
      to: '2026-11-15',
      type: 'expense',
      categoryId: 'housing',
    });
  });

  test('the chart button alternates to the evolution', async () => {
    await renderAnalysis();
    await screen.findByTestId('analysis-categories');
    await fireEvent.press(screen.getByTestId('analysis-mode-evolution'));
    expect(await screen.findByTestId('analysis-evolution')).toBeTruthy();
    expect(screen.getByTestId('analysis-lines')).toBeTruthy();
    expect(screen.queryByTestId('analysis-categories')).toBeNull();
  });

  test('applies a custom range and rejects an invalid one', async () => {
    await renderAnalysis();
    await screen.findByTestId('analysis-income');
    await fireEvent.press(screen.getByTestId('analysis-period-custom'));
    await fireEvent.press(screen.getByTestId('analysis-apply'));
    expect(
      await screen.findByText('Ingrese un rango de fechas válido'),
    ).toBeTruthy();
    await fireEvent.changeText(
      screen.getByTestId('analysis-from'),
      '01/10/2026',
    );
    await fireEvent.changeText(screen.getByTestId('analysis-to'), '31/10/2026');
    await fireEvent.press(screen.getByTestId('analysis-apply'));
    await waitFor(() =>
      expect(screen.getByTestId('analysis-expense')).toHaveTextContent(
        '$999,00',
      ),
    );
  });
});

describe('HU10 screen', () => {
  async function renderRecommendations(movements: string[][]) {
    const context = await setup(movements);
    await render(
      <RecommendationsScreen
        gateway={context.recommendations}
        onOpenHistory={context.onOpenHistory}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    return context;
  }

  test('shows the literal empty state and the disclaimer', async () => {
    await renderRecommendations([]);
    expect(
      await screen.findByText(
        '¡Todo en orden! No hay recomendaciones o alertas por el momento.',
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('recommendations-disclaimer')).toHaveTextContent(
      /no constituyen asesoramiento financiero profesional/,
    );
  });

  test('shows a card that opens the history with its filters', async () => {
    const { onOpenHistory } = await renderRecommendations([
      ['expense', '100', '03/11/2026', 'food'],
    ]);
    await fireEvent.press(
      await screen.findByTestId('recommendation-open-no-income'),
    );
    expect(onOpenHistory).toHaveBeenCalledWith({
      from: '2026-11-01',
      to: '2026-11-30',
      type: null,
      categoryId: null,
    });
  });

  test('«Descartar» removes the card and it stays hidden when the screen opens again (I-27)', async () => {
    const context = await renderRecommendations([
      ['expense', '100', '03/11/2026', 'food'],
    ]);
    await fireEvent.press(
      await screen.findByTestId('recommendation-dismiss-no-income'),
    );
    await waitFor(() =>
      expect(screen.queryByTestId('recommendation-no-income')).toBeNull(),
    );
    await screen.unmount();
    await render(
      <RecommendationsScreen
        gateway={context.recommendations}
        onOpenHistory={jest.fn()}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    expect(
      await screen.findByTestId('recommendation-critical-category-food'),
    ).toBeTruthy();
    expect(screen.queryByTestId('recommendation-no-income')).toBeNull();
  });

  test('R2 and R3 cards open the history with their category and the expense type', async () => {
    const { onOpenHistory } = await renderRecommendations([
      ['income', '1000', '02/11/2026', 'salary'],
      ['expense', '800', '03/11/2026', 'food'],
      ['expense', '100', '03/11/2026', 'transport'],
    ]);
    await fireEvent.press(
      await screen.findByTestId('recommendation-open-critical-category-food'),
    );
    expect(onOpenHistory).toHaveBeenCalledWith({
      from: '2026-11-01',
      to: '2026-11-30',
      type: 'expense',
      categoryId: 'food',
    });
    expect(
      screen.getByText('Monto evaluado: $800,00 - Mes actual'),
    ).toBeTruthy();
  });

  test('HU2-CA10: an expired session leaves the screen', async () => {
    const context = await setup([]);
    const onSessionExpired = jest.fn();
    context.sessions.end();
    await render(
      <RecommendationsScreen
        gateway={context.recommendations}
        onOpenHistory={jest.fn()}
        onSessionExpired={onSessionExpired}
        session={context.session}
      />,
    );
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalled());
  });
});

describe('Tasks 34 and 35: legibility and accessibility', () => {
  test('Task 34: the evolution legend shows its colour as a swatch and reads only the label', async () => {
    const context = await setup(DATA);
    await render(
      <AnalysisScreen
        gateway={context.service}
        now={() => NOW}
        onNewMovement={jest.fn()}
        onOpenHistory={context.onOpenHistory}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    await screen.findByTestId('analysis-categories');
    await fireEvent.press(screen.getByTestId('analysis-mode-evolution'));
    await screen.findByTestId('analysis-evolution');
    expect(screen.getByText('Ingresos')).toBeTruthy();
    expect(screen.getByText('Gastos')).toBeTruthy();
    expect(screen.queryByText(/■/)).toBeNull();
  });

  test('Task 35: the severity glyph is decorative and «Descartar» names its card', async () => {
    const context = await setup([['expense', '100', '03/11/2026', 'food']]);
    await render(
      <RecommendationsScreen
        gateway={context.recommendations}
        onOpenHistory={context.onOpenHistory}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    const dismiss = await screen.findByTestId(
      'recommendation-dismiss-no-income',
    );
    expect(dismiss.props.accessibilityLabel).toMatch(
      /^Descartar recomendación: \S/,
    );
  });
});

describe('E-COR: HU9 and HU10 fidelity (G1-G7, H1)', () => {
  async function renderAnalysis(data = DATA) {
    const context = await setup(data);
    await render(
      <AnalysisScreen
        gateway={context.service}
        now={() => NOW}
        onNewMovement={jest.fn()}
        onOpenHistory={context.onOpenHistory}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    await screen.findByTestId('analysis-categories');
    return context;
  }
  const hidden = { includeHiddenElements: true };

  test('G1-G4: section icons and the grouped period selector', async () => {
    await renderAnalysis();
    expect(screen.getByTestId('icon-calendar', hidden)).toBeTruthy();
    expect(screen.getByTestId('icon-summary', hidden)).toBeTruthy();
    expect(screen.getByTestId('icon-pieChart', hidden)).toBeTruthy();
    expect(
      within(screen.getByTestId('analysis-period-group')).getByTestId(
        'analysis-period-month',
      ),
    ).toBeTruthy();
  });

  test('G5: the selected category and its value are two separate elements', async () => {
    await renderAnalysis();
    const [first] = screen.getAllByTestId(/^analysis-share-/);
    await fireEvent.press(first);
    expect(screen.getByTestId('analysis-selected-name')).toHaveTextContent(
      /^\S.* · \d+%$/,
    );
    expect(screen.getByTestId('analysis-selected-amount')).toHaveTextContent(
      /^\$[\d.]+,\d{2}$/,
    );
  });

  test('G6, G7: smooth waves and a coloured trend with its icon', async () => {
    await renderAnalysis();
    await fireEvent.press(screen.getByTestId('analysis-mode-evolution'));
    await screen.findByTestId('analysis-evolution');
    const wave = screen.getByTestId('analysis-wave-income', hidden);
    expect(wave.props.d).toMatch(/^M[\d.,]+( C[\d.,]+ [\d.,]+ [\d.,]+)*$/);
    const box = screen.getByTestId('analysis-trend-box');
    const up = screen.queryByTestId('analysis-trend-icon-up', hidden);
    expect(box).toHaveStyle({
      backgroundColor: up === null ? '#FDECEA' : '#E6F4EA',
    });
  });

  test('H1: «Recomendaciones Automatizadas» starts with the sparkles icon', async () => {
    const context = await setup([['expense', '100', '03/11/2026', 'food']]);
    await render(
      <RecommendationsScreen
        gateway={context.recommendations}
        onOpenHistory={context.onOpenHistory}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    await screen.findByText('Recomendaciones Automatizadas');
    expect(
      screen.getByTestId('recommendations-section-icon', hidden),
    ).toBeTruthy();
  });
});

describe('AJ-04 and AJ-05: savings tip and session dismissal on the screen', () => {
  async function show(context: Awaited<ReturnType<typeof setup>>) {
    return render(
      <RecommendationsScreen
        gateway={context.recommendations}
        onOpenHistory={context.onOpenHistory}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
  }

  test('a positive balance shows the green «Consejo de Ahorro» card', async () => {
    const context = await setup([
      ['income', '500000', '01/11/2026', 'salary'],
      ['expense', '100', '03/11/2026', 'food'],
      ['expense', '100', '03/11/2026', 'transport'],
    ]);
    await show(context);
    const card = await screen.findByTestId('recommendation-savings-tip');
    expect(within(card).getByText('Consejo de Ahorro')).toBeTruthy();
    expect(card).toHaveStyle({ borderLeftColor: '#1B6E3A' });
  });

  test('a dismissed card stays hidden when the screen opens again in the same session', async () => {
    const context = await setup([['expense', '100', '03/11/2026', 'food']]);
    const view = await show(context);
    await fireEvent.press(
      await screen.findByTestId('recommendation-dismiss-no-income'),
    );
    await waitFor(() =>
      expect(screen.queryByTestId('recommendation-no-income')).toBeNull(),
    );
    await view.unmount();
    await show(context);
    await screen.findByTestId('recommendation-critical-category-food');
    expect(screen.queryByTestId('recommendation-no-income')).toBeNull();
  });
});

type Node = { props: Record<string, unknown>; children: unknown[] };

// Colores de trazo de un ícono SVG (react-native-svg los entrega procesados).
function strokesOf(node: Node): unknown[] {
  const own = node.props.stroke === undefined ? [] : [node.props.stroke];
  return [
    ...own,
    ...node.children
      .filter((child): child is Node => typeof child === 'object')
      .flatMap(strokesOf),
  ];
}

describe('Extended recommendations on the screen', () => {
  const hidden = { includeHiddenElements: true };
  const session = { sessionId: 's1', userId: 'u1', startedAt: 1 };

  async function show(recommendations: Recommendation[]) {
    const onOpenHistory = jest.fn();
    await render(
      <RecommendationsScreen
        gateway={{
          list: async () => ({ status: 'ok', recommendations }),
          dismiss: async () => ({ status: 'dismissed' }),
        }}
        onOpenHistory={onOpenHistory}
        onSessionExpired={jest.fn()}
        session={session}
      />,
    );
    await screen.findByText('Recomendaciones Automatizadas');
    return onOpenHistory;
  }

  const salary = (date: string, cents: number) =>
    item(date, 'income', cents, 'salary', 'Salario');

  // Cada escenario activa una de las nueve recomendaciones.
  const SCENARIOS: [string, string, string, Parameters<typeof item>[]][] = [
    [
      'negative-balance',
      'activity',
      '#B3261E',
      [['2026-11-02', 'expense', 2000]],
    ],
    [
      'critical-category-food',
      'flame',
      '#B3261E',
      [['2026-11-02', 'expense', 900]],
    ],
    ['savings-tip', 'lightbulb', '#1B6E3A', [['2026-11-02', 'expense', 100]]],
    [
      'unusual-increase-food',
      'trendingUp',
      '#B3261E',
      [
        ['2026-10-20', 'expense', 100],
        ['2026-11-02', 'expense', 200],
      ],
    ],
    [
      'spending-reduced',
      'trendingDown',
      '#1B6E3A',
      [
        ['2026-10-02', 'expense', 1000],
        ['2026-11-02', 'expense', 100],
      ],
    ],
    [
      'stable-habit',
      'award',
      '#1B6E3A',
      [
        ['2026-10-02', 'expense', 100],
        ['2026-11-02', 'expense', 100],
      ],
    ],
    [
      'early-spending-alert',
      'clock',
      '#E08A1E',
      [['2026-11-02', 'expense', 900]],
    ],
    [
      'lower-income',
      'arrowDownLeft',
      '#E08A1E',
      [['2026-10-01', 'income', 5000, 'salary', 'Salario']],
    ],
  ];

  test.each(SCENARIOS)(
    '%s shows the %s icon in %s',
    async (id, icon, color, rows) => {
      const movements = [
        salary('2026-11-01', 1000),
        ...rows.map(row => item(...row)),
      ];
      await show(evaluateRecommendations(movements, '2026-11-04'));
      const card = screen.getByTestId(`recommendation-${id}`);
      expect(card).toHaveStyle({ borderLeftColor: color });
      const glyph = screen.getByTestId(`recommendation-icon-${id}`, hidden);
      expect(within(glyph).getByTestId(`icon-${icon}`, hidden)).toBeTruthy();
      const strokes = strokesOf(
        within(glyph).getByTestId(`icon-${icon}`, hidden),
      );
      expect(strokes.length).toBeGreaterThan(0);
      expect(strokes).toEqual(
        strokes.map(() => ({ type: 0, payload: processColor(color) })),
      );
      expect(within(card).queryByText(/[🔺⚠️ℹ️]/u)).toBeNull();
    },
  );

  test('no-income shows the info icon in orange and opens the period movements', async () => {
    const onOpenHistory = await show(
      evaluateRecommendations(
        [item('2026-11-02', 'expense', 100)],
        '2026-11-04',
      ),
    );
    expect(screen.getByTestId('recommendation-no-income')).toHaveStyle({
      borderLeftColor: '#E08A1E',
    });
    const glyph = screen.getByTestId('recommendation-icon-no-income', hidden);
    expect(within(glyph).getByTestId('icon-info', hidden)).toBeTruthy();
    expect(screen.queryByTestId('recommendation-negative-balance')).toBeNull();
    await fireEvent.press(screen.getByTestId('recommendation-open-no-income'));
    expect(onOpenHistory).toHaveBeenCalledWith({
      from: '2026-11-01',
      to: '2026-11-30',
      type: null,
      categoryId: null,
    });
  });

  test('the early alert opens the expenses of the current month', async () => {
    const onOpenHistory = await show(
      evaluateRecommendations(
        [salary('2026-11-01', 1000), item('2026-11-02', 'expense', 900)],
        '2026-11-04',
      ),
    );
    await fireEvent.press(
      screen.getByTestId('recommendation-open-early-spending-alert'),
    );
    expect(onOpenHistory).toHaveBeenCalledWith({
      from: '2026-11-01',
      to: '2026-11-30',
      type: 'expense',
      categoryId: null,
    });
  });

  test('lower income opens the incomes of the current and the previous period', async () => {
    const onOpenHistory = await show(
      evaluateRecommendations(
        [salary('2026-10-01', 5000), salary('2026-11-01', 1000)],
        '2026-11-04',
      ),
    );
    await fireEvent.press(
      screen.getByTestId('recommendation-open-lower-income'),
    );
    expect(onOpenHistory).toHaveBeenLastCalledWith({
      from: '2026-11-01',
      to: '2026-11-04',
      type: 'income',
      categoryId: null,
    });
    await fireEvent.press(
      screen.getByTestId('recommendation-open-previous-lower-income'),
    );
    expect(onOpenHistory).toHaveBeenLastCalledWith({
      from: '2026-10-01',
      to: '2026-10-04',
      type: 'income',
      categoryId: null,
    });
    expect(screen.getByText('Ver ingresos de este mes')).toBeTruthy();
    expect(screen.getByText('Ver ingresos del mes anterior')).toBeTruthy();
  });

  test('several categories: one card, the top category and the others on demand', async () => {
    const onOpenHistory = await show(
      evaluateRecommendations(
        [
          salary('2026-11-01', 100000),
          item('2026-10-02', 'expense', 1000),
          item('2026-11-02', 'expense', 500),
          item('2026-10-02', 'expense', 1000, 'transport', 'Transporte'),
          item('2026-11-02', 'expense', 100, 'transport', 'Transporte'),
        ],
        '2026-11-04',
      ),
    );
    expect(
      screen.getAllByTestId(/^recommendation-spending-reduced$/),
    ).toHaveLength(1);
    await fireEvent.press(
      screen.getByTestId('recommendation-open-spending-reduced'),
    );
    expect(onOpenHistory).toHaveBeenLastCalledWith({
      from: '2026-11-01',
      to: '2026-11-04',
      type: 'expense',
      categoryId: 'transport',
    });
    const toggle = screen.getByTestId('recommendation-others-spending-reduced');
    expect(toggle).toHaveTextContent('Ver otras categorías (1)');
    expect(
      screen.queryByTestId('recommendation-related-spending-reduced-food'),
    ).toBeNull();
    await fireEvent.press(toggle);
    expect(toggle).toHaveTextContent('Ocultar otras categorías');
    const related = screen.getByTestId(
      'recommendation-related-spending-reduced-food',
    );
    expect(related).toHaveTextContent(/Alimentación.*bajó 50%/);
    expect(related.props.accessibilityLabel).toBe(
      'Ver movimientos de Alimentación',
    );
    await fireEvent.press(related);
    expect(onOpenHistory).toHaveBeenLastCalledWith({
      from: '2026-11-01',
      to: '2026-11-04',
      type: 'expense',
      categoryId: 'food',
    });
  });

  test('a new rule is dismissed for the session like the others', async () => {
    const context = await setup([
      ['income', '1000', '01/11/2026', 'salary'],
      ['expense', '900', '02/11/2026', 'food'],
    ]);
    const view = await render(
      <RecommendationsScreen
        gateway={context.recommendations}
        onOpenHistory={jest.fn()}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    await fireEvent.press(
      await screen.findByTestId('recommendation-dismiss-early-spending-alert'),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId('recommendation-early-spending-alert'),
      ).toBeNull(),
    );
    await view.unmount();
    await render(
      <RecommendationsScreen
        gateway={context.recommendations}
        onOpenHistory={jest.fn()}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    await screen.findByTestId('recommendation-critical-category-food');
    expect(
      screen.queryByTestId('recommendation-early-spending-alert'),
    ).toBeNull();
    expect(screen.queryByTestId('recommendation-savings-tip')).toBeNull();
  });
});
