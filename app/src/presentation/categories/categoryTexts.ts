import type { CategoryType } from '../../infrastructure/database/categoryCatalogs';

// Textos visibles de HU8. Literales de HU8: «Categorías», «Gestiona tus etiquetas de
// ingresos y gastos», «Nueva categoría», «Nombre de la categoría», «Tipo de categoría»,
// «Ingreso», «Gasto», «Ícono», «Guardar», «Cancelar», «Editar», «Eliminar», «Confirmar»,
// «La categoría ya existe», «¿Está seguro de eliminar esta categoría?» y la advertencia de
// reasignación. Los demás proceden del prototipo o son propuestas de E06-D6.
export const CATEGORY_TEXTS = {
  screenTitle: 'Categorías',
  screenSubtitle: 'Gestiona tus etiquetas de ingresos y gastos',
  sections: {
    system: 'Categorías del sistema',
    own: 'Mis categorías',
  },
  // Task 33: estado vacío de «Mis categorías» (propuesta).
  ownEmpty:
    'Aún no tienes categorías propias. Usa «+ Nueva categoría» para crear una.',
  types: {
    income: 'Ingreso',
    expense: 'Gasto',
  } satisfies Record<CategoryType, string>,
  buttons: {
    newCategory: '+ Nueva categoría',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    accept: 'Aceptar',
    openCategories: 'Categorías',
  },
  form: {
    createTitle: 'Nueva categoría',
    editTitle: 'Editar categoría',
    subtitle: 'Personaliza tus ingresos y gastos.',
    nameLabel: 'Nombre de la categoría',
    namePlaceholder: 'Ej: Mascotas',
    typeLabel: 'Tipo de categoría',
    iconLabel: 'Ícono',
  },
  accessibility: {
    locked: 'Categoría del sistema: no se puede editar ni eliminar',
    edit: (name: string) => `Editar ${name}`,
    delete: (name: string) => `Eliminar ${name}`,
    icon: (label: string) => `Ícono ${label}`,
  },
  messages: {
    duplicate: 'La categoría ya existe',
    deleteQuestion: '¿Está seguro de eliminar esta categoría?',
    deleteWarning:
      "Los movimientos asociados a esta categoría serán reasignados automáticamente a la categoría 'Otros'.",
    // Recuento del modal (E07-D7): se omite si la categoría no tiene movimientos.
    reassignCount: (count: number) =>
      count === 1
        ? '1 movimiento será reasignado.'
        : `${count} movimientos serán reasignados.`,
    loadFailed: 'No fue posible cargar las categorías. Intenta de nuevo',
    saveFailed: 'No fue posible guardar la categoría. Intenta de nuevo',
    deleteFailed: 'No fue posible eliminar la categoría. Intenta de nuevo',
    notEditable: 'Esta categoría no se puede modificar.',
    notFound: 'La categoría ya no existe.',
  },
} as const;
