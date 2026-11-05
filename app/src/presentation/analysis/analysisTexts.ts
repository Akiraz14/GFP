// Textos visibles de HU9, tomados de daniela888-li/GFP (8bfa533). Literales de la historia o
// de su prototipo. El botón del estado vacío dice «Nuevo movimiento», como el historial.
export const ANALYSIS_TEXTS = {
  title: 'Análisis financiero',
  subtitle: 'Visualiza la distribución y tendencia de tus finanzas',
  period: 'Período de análisis',
  periods: {
    month: 'Mes actual',
    quarter: 'Últimos 3 meses',
    year: 'Año actual',
    custom: 'Rango personalizado',
  },
  from: 'Fecha inicio',
  to: 'Fecha fin',
  apply: 'Aplicar',
  openCalendar: 'Abrir calendario',
  datePlaceholder: 'DD/MM/AAAA',
  invalidRange: 'Ingrese un rango de fechas válido',
  summary: 'Resumen del período',
  income: 'Total Ingresos',
  expense: 'Total Gastos',
  balance: 'Balance',
  byCategory: 'Por categoría',
  byTime: 'Evolución',
  categoriesTitle: 'Gastos por categoría',
  totalExpenses: 'Total gastos',
  noExpenses: 'No hay gastos en este período.',
  selected: 'Categoría seleccionada',
  viewMovements: 'Ver movimientos',
  evolutionTitle: 'Evolución financiera',
  legendIncome: 'Ingresos',
  legendExpense: 'Gastos',
  incomesAhead: (amount: string) =>
    `Tus ingresos superaron los gastos en ${amount}`,
  expensesAhead: (amount: string) =>
    `Tus gastos superaron los ingresos en ${amount}`,
  emptyTitle:
    'No hay suficientes movimientos registrados para generar el análisis financiero de este período',
  emptySubtitle:
    'Agrega nuevos ingresos o gastos para comenzar a ver tus tendencias.',
  newMovement: '+ Nuevo movimiento',
  loadFailed: 'No fue posible cargar el análisis. Intenta de nuevo',
  accept: 'Aceptar',
} as const;
