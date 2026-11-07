// Textos visibles de HU5. Literales de HU5: «Historial», «Movimientos de tus finanzas»,
// «Filtrar», «Limpiar filtros», «Editar», «Eliminar», «Nuevo movimiento», «Cancelar»,
// «Confirmar», «No hay movimientos registrados», «No se encontraron movimientos», «Intenta
// cambiar los filtros seleccionados o realiza otra búsqueda», «¿Está seguro de eliminar este
// movimiento?», «Esta acción es irreversible y afectará su balance.» y «Movimiento eliminado
// correctamente». Los demás proceden del prototipo o son propuestas de E08.
export const HISTORY_TEXTS = {
  title: 'Historial',
  subtitle: 'Movimientos de tus finanzas',
  filtersTitle: 'Filtros de búsqueda',
  listTitle: 'Movimientos recientes',
  labels: {
    from: 'Fecha inicio',
    to: 'Fecha fin',
    type: 'Tipo de movimiento',
    category: 'Categoría',
  },
  placeholders: {
    date: 'DD/MM/AAAA',
  },
  options: {
    allTypes: 'Todos los tipos',
    allCategories: 'Categoría (Todas)',
  },
  types: {
    expense: 'Gasto',
    income: 'Ingreso',
  },
  buttons: {
    filter: 'Filtrar',
    clearFilters: 'Limpiar filtros',
    edit: 'Editar',
    delete: 'Eliminar',
    newMovement: 'Nuevo movimiento',
    receipt: 'Movimiento con foto',
    categories: 'Categorías',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    accept: 'Aceptar',
  },
  accessibility: {
    openCalendar: 'Abrir calendario',
    edit: (description: string) => `Editar ${description}`,
    delete: (description: string) => `Eliminar ${description}`,
  },
  errors: {
    dateInvalid: 'Ingresa una fecha válida con el formato DD/MM/AAAA',
    toBeforeFrom: 'La fecha fin no puede ser anterior a la fecha inicio',
  },
  empty: {
    noMovementsTitle: 'No hay movimientos registrados',
    noMovementsSubtitle:
      'Registra tu primer ingreso o gasto con «Nuevo movimiento».',
    noResultsTitle: 'No se encontraron movimientos',
    noResultsSubtitle:
      'Intenta cambiar los filtros seleccionados o realiza otra búsqueda',
  },
  delete: {
    question: '¿Está seguro de eliminar este movimiento?',
    warning: 'Esta acción es irreversible y afectará su balance.',
    done: 'Movimiento eliminado correctamente',
  },
  messages: {
    loadFailed: 'No fue posible cargar los movimientos. Intenta de nuevo',
    deleteFailed: 'No fue posible eliminar el movimiento. Intenta de nuevo',
    notFound: 'El movimiento ya no existe.',
  },
} as const;
