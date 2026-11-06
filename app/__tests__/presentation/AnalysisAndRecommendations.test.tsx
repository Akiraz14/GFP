// Adaptado de daniela888-li/GFP (8bfa533, 4c7cd2f) a las API del repositorio canónico.
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import { RecommendationService } from '../../src/business/recommendations/recommendationService';
import { AnalysisScreen } from '../../src/presentation/analysis/AnalysisScreen';
import { RecommendationsScreen } from '../../src/presentation/recommendations/RecommendationsScreen';
import { SessionManager } from '../../src/services/session/sessionManager';
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
      await screen.findByTestId('recommendation-open-negative-balance'),
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
      await screen.findByTestId('recommendation-dismiss-negative-balance'),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId('recommendation-negative-balance'),
      ).toBeNull(),
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
    expect(screen.queryByTestId('recommendation-negative-balance')).toBeNull();
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
      'recommendation-dismiss-negative-balance',
    );
    expect(dismiss.props.accessibilityLabel).toMatch(
      /^Descartar recomendación: \S/,
    );
  });
});
